"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Camera,
  Trash2,
  ExternalLink,
  Download,
  Copy,
  Check,
  Eye,
  Smartphone,
  Monitor,
  Tablet,
  Calendar,
  Clock,
  Radio,
  Search,
  Filter,
  AlertTriangle,
  X,
  ChevronRight,
} from "lucide-react";
import { CameraCapture, getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [captures, setCaptures] = useState<CameraCapture[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [realtimeActive, setRealtimeActive] = useState(false);
  const [realtimeNotice, setRealtimeNotice] = useState<string | null>(null);

  // Gallery filters & search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDevice, setFilterDevice] = useState<"all" | "mobile" | "desktop" | "tablet">("all");

  // Lightbox modal state
  const [selectedCapture, setSelectedCapture] = useState<CameraCapture | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/admin/check");
        const data = await res.json();
        setIsAuthenticated(Boolean(data.authenticated));
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  // Fetch captures list
  const fetchCaptures = useCallback(async (quiet = false) => {
    if (!quiet) setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/captures");
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      const data = await res.json();
      setCaptures(data.captures || []);
    } catch (err) {
      console.error("Failed to fetch captures:", err);
    } finally {
      setLoading(false);
      if (!quiet) setIsRefreshing(false);
    }
  }, []);

  // When authenticated, load captures and subscribe to real-time events
  useEffect(() => {
    if (isAuthenticated) {
      fetchCaptures();

      if (isSupabaseConfigured()) {
        try {
          const supabase = getSupabaseClient();
          const channel = supabase
            .channel("realtime-camera-captures")
            .on(
              "postgres_changes",
              { event: "INSERT", schema: "public", table: "camera_captures" },
              (payload) => {
                const newCapture = payload.new as CameraCapture;
                setCaptures((prev) => {
                  // Avoid duplicates
                  if (prev.some((c) => c.id === newCapture.id)) return prev;
                  return [newCapture, ...prev];
                });

                setRealtimeNotice(`📸 New capture received: ${newCapture.capture_id}`);
                setTimeout(() => setRealtimeNotice(null), 5000);
              }
            )
            .on(
              "postgres_changes",
              { event: "DELETE", schema: "public", table: "camera_captures" },
              (payload) => {
                const deleted = payload.old as { id: string };
                setCaptures((prev) => prev.filter((c) => c.id !== deleted.id));
              }
            )
            .subscribe((status) => {
              setRealtimeActive(status === "SUBSCRIBED");
            });

          return () => {
            supabase.removeChannel(channel);
          };
        } catch (e) {
          console.warn("Realtime subscription warning:", e);
        }
      }
    }
  }, [isAuthenticated, fetchCaptures]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Authentication failed");
      } else {
        setIsAuthenticated(true);
        fetchCaptures();
      }
    } catch {
      setLoginError("Could not reach authentication server");
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      setIsAuthenticated(false);
      setPassword("");
      setCaptures([]);
    }
  };

  // Handle Delete Capture
  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/captures/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCaptures((prev) => prev.filter((c) => c.id !== id));
        if (selectedCapture?.id === id) {
          setSelectedCapture(null);
        }
        setDeleteConfirmId(null);
      } else {
        const error = await res.json();
        alert(`Failed to delete: ${error.error || "Server error"}`);
      }
    } catch {
      alert("Failed to delete photo due to network error.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered Captures list
  const filteredCaptures = useMemo(() => {
    return captures.filter((c) => {
      const matchesSearch =
        searchQuery === "" ||
        c.capture_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        new Date(c.created_at).toLocaleDateString().includes(searchQuery);

      const matchesDevice =
        filterDevice === "all" ||
        (c.device_type && c.device_type.toLowerCase() === filterDevice);

      return matchesSearch && matchesDevice;
    });
  }, [captures, searchQuery, filterDevice]);

  // Statistics
  const stats = useMemo(() => {
    const total = captures.length;
    const now = new Date();
    const todayCaptures = captures.filter((c) => {
      const d = new Date(c.created_at);
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }).length;

    const mobileCount = captures.filter((c) => c.device_type === "mobile").length;
    const desktopCount = captures.filter((c) => c.device_type === "desktop").length;

    return { total, todayCaptures, mobileCount, desktopCount };
  }, [captures]);

  // Render Loading Initial Auth State
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  // 1. Unauthenticated Login Screen
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-4 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/XketchPng.png"
                alt="Xketch GFX"
                width={200}
                height={50}
                className="mx-auto h-auto"
                priority
              />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Admin Control Portal</h1>
            <p className="text-zinc-400 text-sm mt-1">Authenticate to inspect live camera captures</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
                  Admin Master Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter admin password..."
                    className="w-full px-4 py-3.5 rounded-xl border border-white/15 bg-black/50 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-semibold shadow-[0_0_25px_rgba(168,85,247,0.35)] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loginLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Sign In to Dashboard</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-white/10 text-center">
              <p className="text-xs text-zinc-500">
                Default password: <code className="text-purple-300">admin@xketch2026</code> (configured via ADMIN_PASSWORD)
              </p>
              <Link href="/" className="inline-block mt-3 text-xs text-zinc-400 hover:text-purple-300 transition">
                ← Return to Website
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 2. Authenticated Admin Dashboard
  return (
    <main className="min-h-screen bg-black text-white relative overflow-x-hidden flex flex-col">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-[-15%]"
          style={{
            background: `
              radial-gradient(circle at 10% 20%, rgba(168,85,247,0.25), transparent 40%),
              radial-gradient(circle at 90% 15%, rgba(124,58,237,0.2), transparent 40%),
              radial-gradient(circle at 80% 85%, rgba(217,70,239,0.15), transparent 35%)
            `,
            filter: "blur(110px)",
          }}
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[90px]" />
      </div>

      {/* Realtime Toast Notification */}
      {realtimeNotice && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 animate-bounce">
          <div className="px-4 py-3 rounded-2xl bg-purple-600/90 text-white font-medium text-xs sm:text-sm shadow-[0_0_30px_rgba(168,85,247,0.5)] border border-purple-400 flex items-center gap-3 backdrop-blur-xl">
            <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
            <span>{realtimeNotice}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-7xl mx-auto h-16 sm:h-20 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/" className="shrink-0">
              <Image
                src="/XketchPng.png"
                alt="Xketch GFX"
                width={160}
                height={40}
                className="w-auto h-auto max-h-8"
              />
            </Link>
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              Admin Gallery
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Realtime Sync Badge */}
            <div
              className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium backdrop-blur-md ${
                realtimeActive
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-white/5 border-white/10 text-zinc-400"
              }`}
              title={realtimeActive ? "Connected to Supabase Realtime" : "Connecting to Realtime..."}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  realtimeActive ? "bg-emerald-400 animate-ping" : "bg-zinc-500"
                }`}
              />
              <span>{realtimeActive ? "Realtime Active" : "Polling Mode"}</span>
            </div>

            {/* Launch Camera Test */}
            <Link
              href="/camera"
              target="_blank"
              className="px-3 sm:px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs sm:text-sm font-medium transition flex items-center gap-2"
              title="Open camera capture page in new tab"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Open Camera</span>
            </Link>

            {/* Manual Refresh Button */}
            <button
              onClick={() => fetchCaptures()}
              disabled={isRefreshing}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition flex items-center gap-2 text-xs sm:text-sm"
              title="Refresh captures list"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-purple-400" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/30 text-zinc-300 hover:text-rose-300 transition flex items-center gap-2 text-xs sm:text-sm"
              title="Sign out of admin"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-400 mb-1">Total Photos</p>
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl sm:text-4xl font-black text-purple-400">{stats.total}</h3>
              <Camera className="w-5 h-5 text-purple-500/60" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-400 mb-1">Captured Today</p>
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl sm:text-4xl font-black text-emerald-400">{stats.todayCaptures}</h3>
              <Calendar className="w-5 h-5 text-emerald-500/60" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-400 mb-1">Mobile Devices</p>
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl sm:text-4xl font-black text-violet-400">{stats.mobileCount}</h3>
              <Smartphone className="w-5 h-5 text-violet-500/60" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-400 mb-1">Desktop Devices</p>
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl sm:text-4xl font-black text-pink-400">{stats.desktopCount}</h3>
              <Monitor className="w-5 h-5 text-pink-500/60" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Capture ID or date..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Device Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(["all", "mobile", "desktop", "tablet"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterDevice(mode)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition ${
                  filterDevice === mode
                    ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                    : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {mode === "all" ? "All Devices" : mode}
              </button>
            ))}
          </div>
        </div>

        {/* Captures Gallery Grid */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <RefreshCw className="w-10 h-10 text-purple-400 animate-spin mb-4" />
            <p className="text-zinc-400 text-sm">Loading captured photos from Supabase...</p>
          </div>
        ) : filteredCaptures.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">No Captures Found</h3>
            <p className="text-zinc-400 text-sm max-w-sm mb-6">
              {searchQuery || filterDevice !== "all"
                ? "No photos match your current search and filter criteria."
                : "No photos have been captured yet. Try taking a photo using the live camera experience!"}
            </p>
            <Link
              href="/camera"
              target="_blank"
              className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>Launch Camera & Take Photo</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredCaptures.map((capture) => {
              const formattedDate = new Date(capture.created_at).toLocaleString();
              return (
                <div
                  key={capture.id}
                  className="group relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:border-purple-500/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] flex flex-col"
                >
                  {/* Photo Container */}
                  <div
                    onClick={() => setSelectedCapture(capture)}
                    className="relative w-full aspect-square bg-zinc-950 overflow-hidden cursor-pointer"
                  >
                    <img
                      src={capture.image_url}
                      alt={`Capture ${capture.capture_id}`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-3.5 py-1.5 rounded-full bg-purple-600/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                        <Eye className="w-3.5 h-3.5" /> Inspect
                      </span>
                    </div>

                    {/* Device Badge */}
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] text-zinc-300 flex items-center gap-1">
                      {capture.device_type === "mobile" ? (
                        <Smartphone className="w-3 h-3 text-purple-400" />
                      ) : (
                        <Monitor className="w-3 h-3 text-cyan-400" />
                      )}
                      <span className="capitalize">{capture.device_type || "desktop"}</span>
                    </div>
                  </div>

                  {/* Card Info & Quick Actions */}
                  <div className="p-3.5 flex flex-col justify-between flex-1 gap-2">
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-purple-300 font-semibold truncate">
                          {capture.capture_id}
                        </span>
                        <button
                          onClick={() => copyToClipboard(capture.capture_id, capture.id)}
                          className="text-zinc-400 hover:text-white p-1"
                          title="Copy Capture ID"
                        >
                          {copiedId === capture.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>

                    {/* Quick Button Bar */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                      <button
                        onClick={() => setSelectedCapture(capture)}
                        className="text-xs text-purple-300 hover:text-purple-200 font-medium flex items-center gap-1"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>

                      <div className="flex items-center gap-1">
                        <a
                          href={capture.image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
                          title="Open full resolution in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={() => setDeleteConfirmId(capture.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox / Details Modal */}
      {selectedCapture && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-zinc-950 border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
            {/* Close Button */}
            <button
              onClick={() => setSelectedCapture(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 text-zinc-300 hover:text-white border border-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Photo View */}
            <div className="flex-1 bg-black flex items-center justify-center p-4 min-h-[300px] md:min-h-[500px]">
              <img
                src={selectedCapture.image_url}
                alt={selectedCapture.capture_id}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>

            {/* Sidebar Details */}
            <div className="w-full md:w-80 p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/10 bg-white/[0.02]">
              <div className="space-y-5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                    Capture Details
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1 break-all">
                    {selectedCapture.capture_id}
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-zinc-500 block mb-0.5">Captured Timestamp:</span>
                    <span className="text-zinc-200">
                      {new Date(selectedCapture.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-500 block mb-0.5">Device Platform:</span>
                    <span className="text-zinc-200 capitalize flex items-center gap-1.5 mt-0.5">
                      {selectedCapture.device_type === "mobile" ? (
                        <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                      ) : (
                        <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                      {selectedCapture.device_type || "Unknown"}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-500 block mb-0.5">Storage Path:</span>
                    <span className="font-mono text-[11px] text-zinc-400 break-all">
                      {selectedCapture.storage_path}
                    </span>
                  </div>

                  {selectedCapture.user_agent && (
                    <div>
                      <span className="text-zinc-500 block mb-0.5">Browser Info:</span>
                      <p className="text-[11px] text-zinc-400 line-clamp-3 leading-relaxed">
                        {selectedCapture.user_agent}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-6 border-t border-white/10">
                <a
                  href={selectedCapture.image_url}
                  download={`${selectedCapture.capture_id}.jpg`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Full Resolution</span>
                </a>

                <button
                  onClick={() => copyToClipboard(selectedCapture.image_url, "modal-url")}
                  className="w-full py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-zinc-200 text-xs flex items-center justify-center gap-2 transition"
                >
                  {copiedId === "modal-url" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>URL Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Supabase URL</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setDeleteConfirmId(selectedCapture.id)}
                  className="w-full py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs flex items-center justify-center gap-2 transition"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Delete From Storage & Database</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl border border-rose-500/30 bg-zinc-950 p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-white">Permanently Delete Photo?</h3>
            <p className="text-zinc-400 text-xs sm:text-sm">
              This action will remove the photo from Supabase Storage and remove its record from the database. This cannot be undone.
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs sm:text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs sm:text-sm transition flex items-center gap-2"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
