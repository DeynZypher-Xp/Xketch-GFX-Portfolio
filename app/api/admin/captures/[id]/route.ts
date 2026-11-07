import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/auth";
import { getServerSupabaseClient } from "@/lib/supabase";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get("admin_session")?.value;
    if (!verifyAdminToken(token)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Capture ID is required" }, { status: 400 });
    }

    const supabase = getServerSupabaseClient();

    // 1. Get record first to obtain storage_path
    const { data: record, error: findError } = await supabase
      .from("camera_captures")
      .select("id, storage_path")
      .eq("id", id)
      .single();

    if (findError && findError.code !== "PGRST116") {
      console.warn("Could not find record before deletion:", findError);
    }

    // 2. Delete file from Supabase storage if storage_path exists
    if (record?.storage_path) {
      const { error: storageError } = await supabase.storage
        .from("captured-photos")
        .remove([record.storage_path]);

      if (storageError) {
        console.warn("Storage deletion warning:", storageError.message);
      }
    }

    // 3. Delete from database table
    const { error: dbError } = await supabase
      .from("camera_captures")
      .delete()
      .eq("id", id);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Deletion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
