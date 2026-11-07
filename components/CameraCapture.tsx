"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  CameraOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Download,
  RotateCcw,
  Sparkles,
  Info,
  Lock,
  ArrowLeft,
  SwitchCamera,
  X,
} from "lucide-react";
import { CameraCapture } from "@/lib/supabase";

type CameraStatus =
  | "idle" // Waiting for visitor consent
  | "requesting" // Requesting browser permissions
  | "active" // Live video stream active
  | "capturing" // Triggering shutter / flash
  | "uploading" // Uploading to Supabase
  | "success" // Saved successfully
  | "denied" // User denied permission
  | "error"; // Hardware or browser error

export interface CameraCaptureProps {
  onClose?: () => void;
  isModal?: boolean;
}

export default function CameraCaptureComponent({
  onClose,
  isModal = false,
}: CameraCaptureProps = {}) {
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [savedData, setSavedData] = useState<CameraCapture | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [useCountdown, setUseCountdown] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Play synthetic shutter sound using Web Audio API
  const playShutterSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Click 1 (Mirror up)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);

      // Click 2 (Curtain close)
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(350, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);
        gain2.gain.setValueAtTime(0.5, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.09);
      }, 70);
    } catch (e) {
      console.warn("Could not play audio:", e);
    }
  }, []);

  // Stop camera tracks cleanly
  const stopCameraStream = useCallback(() => {
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
    if (onClose) onClose();
  }, [stopCameraStream, onClose]);

  // Check for available video input devices
  const checkDevices = useCallback(async () => {
    try {
      if (navigator.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setHasMultipleCameras(videoInputs.length > 1);
      }
    } catch {
      // Ignore device enumeration errors
    }
  }, []);

  // Start the camera with user consent
  const startCamera = async (mode: "user" | "environment" = facingMode) => {
    stopCameraStream();
    setStatus("requesting");
    setErrorMessage("");
    setUploadError(null);

    // Verify mediaDevices support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus("error");
      setErrorMessage("Your browser does not support camera access. Please use an updated modern browser (Chrome, Safari, Edge, Firefox).");
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setFacingMode(mode);
      setStatus("active");
      await checkDevices();
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
        setErrorMessage("Camera permission was denied. Please allow camera permissions in your browser address bar and try again.");
      } else if (
        error.name === "NotFoundError" ||
        error.name === "DevicesNotFoundError"
      ) {
        setStatus("error");
        setErrorMessage("No front camera device was found on this system.");
      } else if (
        error.name === "NotReadableError" ||
        error.name === "TrackStartError"
      ) {
        setStatus("error");
        setErrorMessage("Your camera is currently in use by another application. Please close other camera apps and retry.");
      } else {
        setStatus("error");
        setErrorMessage(error.message || "An unexpected error occurred while accessing the camera.");
      }
    }
  };

  // Flip between front and rear cameras
  const toggleCamera = () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    startCamera(nextMode);
  };

  // Trigger shutter and upload
  const executeCapture = async () => {
    if (!videoRef.current || !streamRef.current) return;

    // Trigger visual flash & audio click
    setIsFlashing(true);
    playShutterSound();
    setStatus("capturing");

    setTimeout(() => {
      setIsFlashing(false);
    }, 250);

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvasRef.current = canvas;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setStatus("error");
      setErrorMessage("Could not initialize 2D canvas context for capture.");
      return;
    }

    // Front camera is mirrored for natural user perspective
    if (facingMode === "user") {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, width, height);

    // Get Base64 image
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(dataUrl);

    // Stop camera feed after photo is captured
    stopCameraStream();

    // Now upload to Supabase Storage & Database
    setStatus("uploading");
    setUploadError(null);

    try {
      // Determine device category
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isTablet = /iPad|Tablet/i.test(navigator.userAgent);
      const deviceType = isMobile ? "mobile" : isTablet ? "tablet" : "desktop";

      const res = await fetch("/api/captures/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: dataUrl,
          deviceType,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || result.hint || "Upload failed");
      }

      setSavedData(result.capture);
      setStatus("success");
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : "Failed to upload photo to Supabase.";
      console.error("Upload error:", errMessage);
      setUploadError(errMessage);
      setStatus("error");
    }
  };

  // Handle capture button press (with optional 3-second timer)
  const handleCaptureClick = () => {
    if (useCountdown) {
      let count = 3;
      setCountdown(count);
      const interval = setInterval(() => {
        count -= 1;
        if (count > 0) {
          setCountdown(count);
        } else {
          clearInterval(interval);
          setCountdown(null);
          executeCapture();
        }
      }, 1000);
    } else {
      executeCapture();
    }
  };

  // Retake photo: reset states and restart camera
  const handleRetake = () => {
    setCapturedImage(null);
    setSavedData(null);
    setUploadError(null);
    startCamera(facingMode);
  };

  // Clean up media tracks when unmounting
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  return (
    <div className={`relative w-full max-w-4xl mx-auto ${isModal ? "p-0" : "px-4 py-8"}`}>
      {/* Hidden processing canvas */}
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

      {/* Screen 1: Explicit Consent & Permission Introduction */}
      {status === "idle" && (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6 sm:p-10 text-center shadow-2xl">
          {/* Decorative Glowing Orbs */}
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-violet-600/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 rounded-3xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-6 shadow-[0_0_35px_rgba(168,85,247,0.3)] animate-pulse">
              <Camera className="w-10 h-10" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium mb-4">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>100% Consent-Based Experience</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
              Live Interactive <span className="text-transparent bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text">Camera Studio</span>
            </h2>

            <p className="text-zinc-300 text-base sm:text-lg max-w-2xl mb-8 leading-relaxed">
              Experience our live camera capture system. To ensure complete privacy, your front camera is only activated when you explicitly grant permission, and photos are saved only when you press the <b>Capture Photo</b> button.
            </p>

            {/* Privacy Commitments List */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl text-left mb-8">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm mb-1">
                  <Lock className="w-4 h-4" /> Explicit Consent
                </div>
                <p className="text-zinc-400 text-xs">
                  We never activate your camera without asking you first.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm mb-1">
                  <Sparkles className="w-4 h-4" /> Live Preview
                </div>
                <p className="text-zinc-400 text-xs">
                  See yourself in real-time with responsive selfie mirroring.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm mb-1">
                  <CheckCircle2 className="w-4 h-4" /> Cloud Storage
                </div>
                <p className="text-zinc-400 text-xs">
                  Instant sync with Supabase Storage and real-time dashboard.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
              <button
                onClick={() => startCamera("user")}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-semibold shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
              >
                <Camera className="w-5 h-5" />
                <span>Grant Permission & Start Camera</span>
              </button>

              {onClose ? (
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:w-auto px-7 py-4 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/15 text-white font-medium transition cursor-pointer text-center"
                >
                  Skip to Website
                </button>
              ) : (
                <Link
                  href="/"
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-medium transition text-center"
                >
                  Back to Home
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Screen 2: Requesting Browser Permission State */}
      {status === "requesting" && (
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-10 text-center flex flex-col items-center">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
            <div className="w-full h-full flex items-center justify-center text-purple-400">
              <Camera className="w-8 h-8" />
            </div>
          </div>

          <h3 className="text-2xl font-bold text-white mb-2">Requesting Camera Access</h3>
          <p className="text-zinc-400 text-sm max-w-md mb-6">
            Please look for the browser prompt at the top of your screen and click <b>"Allow"</b> to activate the front camera preview.
          </p>

          <button
            onClick={() => {
              stopCameraStream();
              setStatus("idle");
            }}
            className="px-6 py-2.5 rounded-xl border border-white/15 bg-white/5 text-zinc-400 hover:text-white text-sm transition"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Screen 3: Live Camera Viewfinder */}
      {(status === "active" || status === "capturing") && (
        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-black/80 shadow-2xl backdrop-blur-xl">
          {/* Top Bar HUD */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
            {/* Live Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/15 backdrop-blur-md">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                LIVE CAMERA
              </span>
            </div>

            {/* Quick Controls */}
            <div className="flex items-center gap-2">
              {/* Countdown toggle */}
              <button
                type="button"
                onClick={() => setUseCountdown(!useCountdown)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition backdrop-blur-md ${
                  useCountdown
                    ? "bg-purple-600/80 border-purple-400 text-white"
                    : "bg-black/60 border-white/15 text-zinc-300 hover:text-white"
                }`}
                title="Toggle 3-second countdown timer"
              >
                ⏱️ 3s Timer: {useCountdown ? "ON" : "OFF"}
              </button>

              {/* Flip camera if available */}
              {hasMultipleCameras && (
                <button
                  type="button"
                  onClick={toggleCamera}
                  className="p-2 rounded-full bg-black/60 border border-white/15 text-white hover:bg-white/10 transition backdrop-blur-md"
                  title="Switch Front/Rear Camera"
                >
                  <SwitchCamera className="w-4 h-4" />
                </button>
              )}

              {/* Stop camera */}
              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  setStatus("idle");
                }}
                className="p-2 rounded-full bg-black/60 border border-white/15 text-zinc-400 hover:text-white transition backdrop-blur-md"
                title="Stop camera session"
              >
                <CameraOff className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Video element container */}
          <div className="relative w-full aspect-[4/3] sm:aspect-video bg-black flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                facingMode === "user" ? "scale-x-[-1]" : ""
              }`}
            />

            {/* Shutter Flash Animation */}
            {isFlashing && (
              <div className="absolute inset-0 bg-white z-40 transition-opacity duration-200 pointer-events-none" />
            )}

            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                <span className="text-8xl sm:text-9xl font-black text-white drop-shadow-[0_0_40px_rgba(168,85,247,0.9)] animate-ping">
                  {countdown}
                </span>
              </div>
            )}

            {/* Composition Framing Target Lines */}
            <div className="absolute inset-10 pointer-events-none border border-white/20 rounded-2xl">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-purple-400 -translate-x-1 -translate-y-1" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-purple-400 translate-x-1 -translate-y-1" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-purple-400 -translate-x-1 translate-y-1" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-purple-400 translate-x-1 translate-y-1" />
            </div>
          </div>

          {/* Bottom Bar: Shutter Controls */}
          <div className="p-6 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center">
            <div className="flex items-center justify-center gap-6 w-full max-w-sm">
              <button
                type="button"
                onClick={handleCaptureClick}
                disabled={countdown !== null}
                className="group relative flex items-center justify-center p-1 rounded-full transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                aria-label="Capture Photo"
              >
                {/* Outer Glow Ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500 to-fuchsia-500 blur-md opacity-75 group-hover:opacity-100 transition-opacity" />

                {/* Shutter Button Ring */}
                <div className="relative w-20 h-20 rounded-full border-4 border-white/80 flex items-center justify-center bg-black/40">
                  <div className="w-14 h-14 rounded-full bg-white group-hover:bg-purple-200 transition-colors shadow-inner" />
                </div>
              </button>
            </div>

            <p className="text-zinc-400 text-xs sm:text-sm mt-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Click the button above to capture a high-resolution photo</span>
            </p>
          </div>
        </div>
      )}

      {/* Screen 4: Uploading to Supabase State */}
      {status === "uploading" && (
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-10 text-center flex flex-col items-center shadow-2xl">
          {capturedImage && (
            <div className="relative w-36 h-36 rounded-2xl overflow-hidden border border-purple-500/50 mb-6 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
              <img
                src={capturedImage}
                alt="Captured snapshot"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-white animate-spin" />
              </div>
            </div>
          )}

          <h3 className="text-2xl font-bold text-white mb-2">Uploading Photo to Supabase</h3>
          <p className="text-zinc-400 text-sm max-w-md">
            Securing image in Supabase Storage and recording capture metadata in the database...
          </p>
        </div>
      )}

      {/* Screen 5: Success / Photo Saved State */}
      {status === "success" && savedData && (
        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
              <CheckCircle2 className="w-4 h-4" />
              <span>Photo Uploaded Successfully</span>
            </div>
            <h3 className="text-3xl font-extrabold text-white">Capture Recorded!</h3>
            <p className="text-zinc-400 text-sm mt-1">
              Your photo is securely stored in Supabase and broadcasted to the real-time admin gallery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center max-w-3xl mx-auto">
            {/* Captured Photo Preview */}
            <div className="relative rounded-2xl overflow-hidden border border-white/20 aspect-video sm:aspect-[4/3] bg-black shadow-lg">
              {capturedImage && (
                <img
                  src={capturedImage}
                  alt="Your captured photo"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute bottom-2 left-2 right-2 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md text-[11px] text-zinc-300 flex items-center justify-between">
                <span>{savedData.capture_id}</span>
                <span>{new Date(savedData.created_at).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Capture Details & Actions */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Capture ID:</span>
                  <span className="font-mono text-purple-300 font-semibold">{savedData.capture_id}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Timestamp:</span>
                  <span className="text-white">{new Date(savedData.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Storage Status:</span>
                  <span className="text-emerald-400 font-medium">Saved in Supabase</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-3">
                {capturedImage && (
                  <a
                    href={capturedImage}
                    download={`${savedData.capture_id}.jpg`}
                    className="w-full px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium flex items-center justify-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Photo</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleRetake}
                  className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-semibold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.3)] transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Take Another Photo</span>
                </button>

                {onClose && (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full px-5 py-3 rounded-xl border border-purple-500/50 bg-purple-600/30 hover:bg-purple-600/50 text-white font-semibold flex items-center justify-center gap-2 shadow-lg transition"
                  >
                    <span>Continue to Website →</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen 6: Permission Denied State */}
      {status === "denied" && (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-2xl p-8 sm:p-10 text-center flex flex-col items-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5">
            <CameraOff className="w-8 h-8" />
          </div>

          <h3 className="text-2xl font-bold text-white mb-2">Camera Access Blocked</h3>
          <p className="text-zinc-300 text-sm max-w-lg mb-6 leading-relaxed">
            {errorMessage || "You declined or blocked camera permissions. In accordance with privacy best practices, we cannot activate the preview without your permission."}
          </p>

          {/* Step-by-step unblock instructions */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-left text-xs sm:text-sm text-zinc-300 max-w-md w-full mb-6 space-y-2">
            <p className="font-semibold text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-purple-400" /> How to enable camera:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-zinc-400 pl-1">
              <li>Click the 🔒 or 📷 icon in your browser address bar.</li>
              <li>Set <b>Camera</b> to <b>Allow</b>.</li>
              <li>Click the <b>"Try Again"</b> button below.</li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => startCamera("user")}
              className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
            <button
              onClick={() => setStatus("idle")}
              className="px-6 py-3 rounded-xl border border-white/15 bg-white/5 text-zinc-300 hover:text-white transition"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* Screen 7: General Error or Hardware Failure */}
      {status === "error" && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 backdrop-blur-2xl p-8 sm:p-10 text-center flex flex-col items-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-5">
            <AlertCircle className="w-8 h-8" />
          </div>

          <h3 className="text-2xl font-bold text-white mb-2">Something Went Wrong</h3>
          <p className="text-zinc-300 text-sm max-w-lg mb-6 leading-relaxed">
            {uploadError || errorMessage || "An unexpected error occurred."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                if (capturedImage && uploadError) {
                  // Retry upload with current image
                  executeCapture();
                } else {
                  startCamera("user");
                }
              }}
              className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
            <button
              onClick={() => {
                stopCameraStream();
                setStatus("idle");
              }}
              className="px-6 py-3 rounded-xl border border-white/15 bg-white/5 text-zinc-300 hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
