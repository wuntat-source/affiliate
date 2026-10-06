import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockStore, MockAccount, saveStoreToDisk } from "@/lib/mock-store";
import { getUserContext } from "@/lib/server-auth";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";

function syncSessionsFromDisk(userId: string, isAdmin: boolean) {
  try {
    const sessionsBase = path.resolve(process.cwd(), ".sessions");
    if (!fs.existsSync(sessionsBase)) return;

    const entries = fs.readdirSync(sessionsBase, { withFileTypes: true });
    let modified = false;

    for (const entry of entries) {
      if (entry.isDirectory() && (entry.name.startsWith("threads_") || entry.name.startsWith("twitter_"))) {
        const statePath = path.join(sessionsBase, entry.name, "storage_state.json");
        if (fs.existsSync(statePath)) {
          const parts = entry.name.split("_");
          const platform = parts[0].toUpperCase();
          const username = parts.slice(1).join("_");

          const existing = mockStore.accounts.find(
            (a) =>
              a.platform === platform &&
              a.username.toLowerCase() === username.toLowerCase() &&
              (isAdmin || (a.userId || "usr_admin_kenzie") === userId)
          );

          if (!existing) {
            const newAcc: MockAccount = {
              id: `acc_disk_${nanoid(6)}`,
              userId: userId,
              platform: platform,
              accountName: `@${username}`,
              username: username,
              accessToken: "browser_session_auth",
              status: "ACTIVE",
              _count: { posts: 0 },
              createdAt: new Date(),
            };
            mockStore.accounts.unshift(newAcc);
            modified = true;
          } else if (existing.status !== "ACTIVE") {
            existing.status = "ACTIVE";
            modified = true;
          }
        }
      }
    }

    if (modified) {
      saveStoreToDisk();
    }
  } catch (err) {
    console.error("[Account Disk Sync Error]:", err);
  }
}

export async function GET(request: NextRequest) {
  try {
    const userCtx = getUserContext(request);

    // Sync any existing disk sessions
    syncSessionsFromDisk(userCtx.userId, userCtx.isAdmin);

    try {
      const accounts = await prisma.account.findMany({
        include: {
          _count: {
            select: { posts: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ success: true, data: accounts });
    } catch {
      // Admin sees all accounts; Members only see their own
      const filtered = userCtx.isAdmin
        ? mockStore.accounts
        : mockStore.accounts.filter(
            (a) => (a.userId || "usr_admin_kenzie") === userCtx.userId
          );
      return NextResponse.json({ success: true, data: filtered });
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
      const existing = mockStore.accounts.find(
        (a) =>
          a.platform === platform &&
          a.username === username &&
          (userCtx.isAdmin || (a.userId || "usr_admin_kenzie") === userCtx.userId)
      );

      if (existing) {
        existing.accountName = accountName || username;
        existing.accessToken = accessToken || "sandbox_token";
        saveStoreToDisk();
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
        createdAt: new Date(),
      };

      mockStore.accounts.unshift(newAccount);
      saveStoreToDisk();
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
      const index = mockStore.accounts.findIndex(
        (a) => a.id === id && (userCtx.isAdmin || (a.userId || "usr_admin_kenzie") === userCtx.userId)
      );
      if (index !== -1) {
        mockStore.accounts.splice(index, 1);
        saveStoreToDisk();
      }
      return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete account" },
      { status: 500 }
    );
  }
}
