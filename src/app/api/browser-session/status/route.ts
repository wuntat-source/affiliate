import { NextRequest, NextResponse } from "next/server";
import { checkLoginStatus } from "@/lib/playwright/browser-session";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = (searchParams.get("platform") || "THREADS") as "THREADS" | "TWITTER";
    const username = (searchParams.get("username") || "").trim().replace(/^@/, "");

    if (!username) {
      return NextResponse.json({ error: "Username parameter wajib diisi" }, { status: 400 });
    }

    const status = await checkLoginStatus(platform, username);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Gagal memeriksa status login browser" },
      { status: 500 }
    );
  }
}
