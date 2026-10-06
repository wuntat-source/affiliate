import { NextRequest, NextResponse } from "next/server";
import { getUserContext } from "@/lib/server-auth";
import { mockStore, MockAccount, saveStoreToDisk } from "@/lib/mock-store";
import { nanoid } from "nanoid";
import path from "path";
import fs from "fs";

export async function GET(request: NextRequest) {
  try {
    const userCtx = getUserContext(request);
    const { searchParams } = new URL(request.url);
    const platform = (searchParams.get("platform") || "THREADS") as "THREADS" | "TWITTER";
    const username = (searchParams.get("username") || "").trim().replace(/^@/, "");

    if (!username) {
      return NextResponse.json({ error: "Username parameter is required" }, { status: 400 });
    }

    const safeName = `${platform.toLowerCase()}_${username.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    const sessionsDir = path.resolve(process.cwd(), ".sessions", safeName);
    const statusPath = path.join(sessionsDir, "login_status.json");
    const statePath = path.join(sessionsDir, "storage_state.json");

    // Read status file written by the auto-login script
    let loginStatus: any = null;
    if (fs.existsSync(statusPath)) {
      try {
        loginStatus = JSON.parse(fs.readFileSync(statusPath, "utf-8"));
      } catch {}
    }

    const hasSession = fs.existsSync(statePath);
    const isSuccess = loginStatus?.state === "success";
    const isWaiting = loginStatus?.state === "waiting_login";
    const isLaunching = loginStatus?.state === "launching";
    const hasValidSession = hasSession && !isWaiting && !isLaunching;

    // If valid session exists on disk, ensure account is active in mockStore
    if (hasValidSession || isSuccess) {
      const existing = mockStore.accounts.find(
        (a) =>
          a.platform === platform &&
          a.username.toLowerCase() === username.toLowerCase() &&
          (userCtx.isAdmin || (a.userId || "usr_admin_kenzie") === userCtx.userId)
      );

      if (!existing) {
        const newAcc: MockAccount = {
          id: `acc_browser_${nanoid(6)}`,
          userId: userCtx.userId,
          platform: platform,
          accountName: `@${username}`,
          username: username,
          accessToken: "browser_session_auth",
          status: "ACTIVE",
          _count: { posts: 0 },
          createdAt: new Date(),
        };
        mockStore.accounts.unshift(newAcc);
        saveStoreToDisk();
      } else if (existing.status !== "ACTIVE") {
        existing.status = "ACTIVE";
        saveStoreToDisk();
      }
    }

    return NextResponse.json({
      success: true,
      state: loginStatus?.state || (hasSession ? "success" : "not_started"),
      loggedIn: isSuccess || hasValidSession,
      message: loginStatus?.message || (hasSession ? `Sesi @${username} tersedia.` : "Belum ada sesi login."),
    });
  } catch (error: any) {
    console.error("[Browser Status API Error]:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memeriksa status sesi browser" },
      { status: 500 }
    );
  }
}
