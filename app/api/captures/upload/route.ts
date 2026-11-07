import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error: "Supabase credentials are not configured.",
          hint: "Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.",
        },
        { status: 503 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let imageBuffer: Buffer;
    let deviceType = "desktop";
    let userAgent = req.headers.get("user-agent") || "unknown";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as Blob | null;
      if (!file) {
        return NextResponse.json({ error: "No image file provided." }, { status: 400 });
      }
      deviceType = (formData.get("deviceType") as string) || deviceType;
      const arrayBuffer = await file.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else {
      // JSON with Base64 payload
      const body = await req.json();
      const { imageBase64, deviceType: dt } = body;
      if (!imageBase64) {
        return NextResponse.json({ error: "No image data provided." }, { status: 400 });
      }
      if (dt) deviceType = dt;

      // Strip data:image/...;base64, prefix if present
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      imageBuffer = Buffer.from(base64Data, "base64");
    }

    // Generate unique Capture ID
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const captureId = `CAP-${timestamp}-${randomSuffix}`;
    const fileName = `${captureId}.jpg`;
    const storagePath = `captures/${fileName}`;

    const supabase = getServerSupabaseClient();

    // 1. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("captured-photos")
      .upload(storagePath, imageBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase Storage Upload Error:", uploadError);
      return NextResponse.json(
        {
          error: `Storage upload failed: ${uploadError.message}`,
          hint: "Ensure the 'captured-photos' storage bucket exists in Supabase. Run supabase-schema.sql in Supabase SQL editor.",
        },
        { status: 500 }
      );
    }

    // 2. Get Public URL
    const { data: urlData } = supabase.storage
      .from("captured-photos")
      .getPublicUrl(storagePath);

    const imageUrl = urlData.publicUrl;

    // 3. Save to database table camera_captures
    const { data: dbData, error: dbError } = await supabase
      .from("camera_captures")
      .insert({
        capture_id: captureId,
        image_url: imageUrl,
        storage_path: storagePath,
        device_type: deviceType,
        user_agent: userAgent.substring(0, 500),
      })
      .select()
      .single();

    if (dbError) {
      console.error("Supabase Database Insert Error:", dbError);
      return NextResponse.json(
        {
          error: `Database save failed: ${dbError.message}`,
          hint: "Ensure the 'camera_captures' table exists. Run supabase-schema.sql in Supabase SQL editor.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      capture: dbData,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("Upload handler error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
