import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;
  const isAuthenticated = verifyAdminToken(token);
  return NextResponse.json({ authenticated: isAuthenticated });
}
