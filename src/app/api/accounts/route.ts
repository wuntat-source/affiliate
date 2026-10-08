import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockStore, MockAccount } from "@/lib/mock-store";
import { getUserContext } from "@/lib/server-auth";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";

async function syncSessionsFromDisk(userId: string) {
  try {
    const sessionsBase = path.resolve(process.cwd(), ".sessions");
    if (!fs.existsSync(sessionsBase)) return;

    const entries = fs.readdirSync(sessionsBase, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && (entry.name.startsWith("threads_") || entry.name.startsWith("twitter_"))) {
        const statePath = path.join(sessionsBase, entry.name, "storage_state.json");
        if (fs.existsSync(statePath)) {
          const parts = entry.name.split("_");
          const platform = (parts[0].toUpperCase() === "TWITTER" ? "TWITTER" : "THREADS") as any;
          const username = parts.slice(1).join("_");

          await prisma.account.upsert({
            where: { platform_username: { platform, username } },
            update: { status: "ACTIVE", userId },
            create: {
              userId,
              platform,
              accountName: `@${username}`,
              username,
              accessToken: "browser_session_auth",
              status: "ACTIVE",
            },
          });
        }
      }
    }
  } catch (err) {
    console.error("[Account Disk Sync Error]:", err);
  }
}

export async function GET(request: NextRequest) {
  try {
    const userCtx = getUserContext(request);

    // Sync any existing disk sessions for current user
    await syncSessionsFromDisk(userCtx.userId);

    try {
      const accounts = await prisma.account.findMany({
        where: userCtx.isAdmin ? {} : { userId: userCtx.userId },
        include: {
          _count: {
            select: { posts: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ success: true, data: accounts });
    } catch {
      const allAccounts = mockStore.accounts;

      // Admin sees all accounts; Members only see their own
      let filtered = userCtx.isAdmin
        ? allAccounts
        : allAccounts.filter(
            (a) => (a.userId || "usr_admin_kenzie") === userCtx.userId
          );

      // Deduplicate by platform + username + userId
      const seen = new Set<string>();
      const deduped = filtered.filter((acc) => {
        const key = `${acc.platform}_${acc.username.toLowerCase()}_${acc.userId || "usr_admin_kenzie"}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return NextResponse.json({ success: true, data: deduped });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userCtx = getUserContext(request);
    const { platform, accountName, username, accessToken, refreshToken, platformUserId } = body;

    if (!platform || !username) {
      return NextResponse.json(
        { error: "Platform and username are required." },
        { status: 400 }
      );
    }

    try {
      const account = await prisma.account.upsert({
        where: {
          platform_username: {
            platform,
            username,
          },
        },
        update: {
          accountName: accountName || username,
          accessToken: accessToken || "sandbox_token",
          refreshToken: refreshToken || null,
          platformUserId: platformUserId || null,
          status: "ACTIVE",
          lastHealthCheck: new Date(),
        },
        create: {
          platform,
          accountName: accountName || username,
          username,
          accessToken: accessToken || "sandbox_token",
          refreshToken: refreshToken || null,
          platformUserId: platformUserId || null,
          status: "ACTIVE",
          lastHealthCheck: new Date(),
        },
      });

      return NextResponse.json({ success: true, data: account });
    } catch {
      const current = [...mockStore.accounts];
      const existing = current.find(
        (a) =>
          a.platform === platform &&
          a.username.toLowerCase() === username.toLowerCase() &&
          (a.userId || "usr_admin_kenzie") === userCtx.userId
      );

      if (existing) {
        existing.accountName = accountName || username;
        existing.accessToken = accessToken || "sandbox_token";
        existing.status = "ACTIVE";
        mockStore.accounts = current;
        return NextResponse.json({ success: true, data: existing });
      }

      const newAccount: MockAccount = {
        id: `acc_${nanoid(6)}`,
        userId: userCtx.userId,
        platform,
        accountName: accountName || username,
        username,
        accessToken: accessToken || "sandbox_token",
        status: "ACTIVE",
        _count: { posts: 0 },
        createdAt: new Date().toISOString(),
      };

      mockStore.accounts = [newAccount, ...current];
      return NextResponse.json({ success: true, data: newAccount });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save account" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userCtx = getUserContext(request);

    if (!id) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
    }

    try {
      await prisma.account.delete({
        where: { id },
      });
      return NextResponse.json({ success: true });
    } catch {
      const current = [...mockStore.accounts];
      const target = current.find(
        (a) => a.id === id && (userCtx.isAdmin || (a.userId || "usr_admin_kenzie") === userCtx.userId)
      );

      if (target) {
        // Remove from accounts store
        mockStore.accounts = current.filter((a) => a.id !== id);

        // Remove disk session folder so syncSessionsFromDisk does not resurrect it
        try {
          const cleanUsername = target.username.trim().replace(/^@+/, "");
          const safeName = `${target.platform.toLowerCase()}_${cleanUsername.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
          const dir = path.resolve(process.cwd(), ".sessions", safeName);
          if (fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true });
          }
        } catch (e) {
          console.error("[Account Session Dir Delete Error]:", e);
        }
      }

      return NextResponse.json({ success: true, message: "Akun berhasil dihapus." });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete account" },
      { status: 500 }
    );
  }
}
