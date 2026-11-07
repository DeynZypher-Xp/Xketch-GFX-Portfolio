import { createClient } from "@supabase/supabase-js";

export interface CameraCapture {
  id: string;
  capture_id: string;
  image_url: string;
  storage_path: string;
  device_type?: string;
  user_agent?: string;
  created_at: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("placeholder") &&
    !supabaseAnonKey.includes("placeholder")
  );
};

// Client-side singleton Supabase client
export const getSupabaseClient = () => {
  const url = supabaseUrl || "https://placeholder.supabase.co";
  const key = supabaseAnonKey || "placeholder-key";
  return createClient(url, key, {
    auth: {
      persistSession: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
};

export const supabase = getSupabaseClient();

// Server-side Supabase client (prefers service role key for admin/storage bypass)
export const getServerSupabaseClient = () => {
  const url = supabaseUrl || "https://placeholder.supabase.co";
  const key = supabaseServiceKey || supabaseAnonKey || "placeholder-key";
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
