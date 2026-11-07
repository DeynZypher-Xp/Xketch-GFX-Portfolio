import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { ArrowLeft, ShieldCheck, Lock, Sparkles } from "lucide-react";
import CameraCaptureComponent from "@/components/CameraCapture";

export const metadata: Metadata = {
  title: "Live Camera Experience | Xketch GFX",
  description: "Consent-based responsive live camera capture system powered by Supabase.",
};

export default function CameraPage() {
  return (
    <main className="min-h-screen bg-black text-white relative overflow-x-hidden flex flex-col justify-between">
      {/* Background Ambient Glow Gradients */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-[-20%]"
          style={{
            background: `
              radial-gradient(circle at 25% 25%, rgba(168,85,247,0.35), transparent 40%),
              radial-gradient(circle at 75% 20%, rgba(124,58,237,0.3), transparent 40%),
              radial-gradient(circle at 65% 75%, rgba(217,70,239,0.25), transparent 35%),
              radial-gradient(circle at 30% 80%, rgba(88,28,135,0.35), transparent 40%)
            `,
            filter: "blur(100px)",
          }}
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[90px]" />
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-7xl mx-auto h-16 sm:h-20 px-4 sm:px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <ArrowLeft className="w-5 h-5 text-zinc-400 group-hover:text-purple-400 transition -translate-x-0.5 group-hover:-translate-x-1.5" />
            <div className="w-[140px] sm:w-[180px] h-auto">
              <Image
                src="/XketchPng.png"
                alt="Xketch GFX"
                width={200}
                height={50}
                className="w-auto h-auto"
                priority
              />
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="px-4 py-1.5 rounded-full border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs sm:text-sm font-medium transition flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <section className="flex-1 flex flex-col justify-center items-center py-6 sm:py-12">
        <div className="w-full">
          <CameraCaptureComponent />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 px-4 bg-black/40 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Xketch GFX • High-Performance Consent Camera</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-zinc-300 transition">
              Home
            </Link>
            <Link href="/admin" className="hover:text-zinc-300 transition">
              Admin Gallery
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
