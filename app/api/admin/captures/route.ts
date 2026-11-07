import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/auth";
import { getServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("admin_session")?.value;
    if (!verifyAdminToken(token)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error: "Supabase not configured",
          captures: [],
          hint: "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
        },
        { status: 200 }
      );
    }

    const supabase = getServerSupabaseClient();
    const { data, error } = await supabase
      .from("camera_captures")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching captures:", error);
      return NextResponse.json(
        {
          error: error.message,
          captures: [],
          hint: "Ensure the 'camera_captures' table exists by running supabase-schema.sql.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ captures: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
