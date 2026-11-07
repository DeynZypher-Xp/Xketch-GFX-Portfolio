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

// Default to user's connected Supabase project so it works seamlessly on Vercel and local
const DEFAULT_SUPABASE_URL = "https://puqncmhhittknxzbiqzh.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_2Yninq2QlvCAzdh6A6bEvA_lA5zaWtJ";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  DEFAULT_SUPABASE_KEY;

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("your-project-id") &&
    !supabaseAnonKey.includes("your-anon-key")
  );
};

// Client-side singleton Supabase client
export const getSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
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
  const key = supabaseServiceKey || supabaseAnonKey;
  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
