import { NextRequest, NextResponse } from "next/server";
import { openInteractiveBrowser } from "@/lib/playwright/browser-session";
import { getUserContext } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userCtx = getUserContext(request);
    const { platform = "THREADS", username = "my_threads_account" } = body;

    if (!username.trim()) {
      return NextResponse.json({ error: "Username akun wajib diisi." }, { status: 400 });
    }

    const cleanUsername = username.trim().replace(/^@/, "");

    // Launch visible interactive Chromium browser window asynchronously
    const result = await openInteractiveBrowser(platform as any, cleanUsername);

    return NextResponse.json({
      success: result.success,
      isOpened: result.success,
      username: cleanUsername,
      message: result.message,
    });
  } catch (error: any) {
    console.error("[Browser Login API Error]:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuka jendela browser Chromium." },
      { status: 500 }
    );
  }
}
