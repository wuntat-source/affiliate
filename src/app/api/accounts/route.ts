import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockStore, MockAccount } from "@/lib/mock-store";
import { getUserContext } from "@/lib/server-auth";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";

function syncSessionsFromDisk(userId: string) {
  try {
    const sessionsBase = path.resolve(process.cwd(), ".sessions");
    if (!fs.existsSync(sessionsBase)) return;

    const entries = fs.readdirSync(sessionsBase, { withFileTypes: true });
    const currentAccounts = [...mockStore.accounts];
    let modified = false;

    for (const entry of entries) {
      if (entry.isDirectory() && (entry.name.startsWith("threads_") || entry.name.startsWith("twitter_"))) {
        const statePath = path.join(sessionsBase, entry.name, "storage_state.json");
        if (fs.existsSync(statePath)) {
          const parts = entry.name.split("_");
          const platform = parts[0].toUpperCase();
          const username = parts.slice(1).join("_");

          const existingIndex = currentAccounts.findIndex(
            (a) =>
              a.platform === platform &&
              a.username.toLowerCase() === username.toLowerCase() &&
              (a.userId || "usr_admin_kenzie") === userId
          );

          if (existingIndex === -1) {
            const newAcc: MockAccount = {
              id: `acc_disk_${nanoid(6)}`,
              userId: userId,
              platform: platform,
              accountName: `@${username}`,
              username: username,
              accessToken: "browser_session_auth",
              status: "ACTIVE",
              _count: { posts: 0 },
              createdAt: new Date().toISOString(),
            };
            currentAccounts.unshift(newAcc);
            modified = true;
          } else if (currentAccounts[existingIndex].status !== "ACTIVE") {
            currentAccounts[existingIndex].status = "ACTIVE";
            modified = true;
          }
        }
      }
    }

    if (modified) {
      mockStore.accounts = currentAccounts;
    }
  } catch (err) {
    console.error("[Account Disk Sync Error]:", err);
  }
}

export async function GET(request: NextRequest) {
  try {
    const userCtx = getUserContext(request);

    // Sync any existing disk sessions for current user
    syncSessionsFromDisk(userCtx.userId);

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
      const allAccounts = mockStore.accounts;

      // Admin sees all accounts; Members see only their own
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
      const index = current.findIndex(
        (a) => a.id === id && (userCtx.isAdmin || (a.userId || "usr_admin_kenzie") === userCtx.userId)
      );
      if (index !== -1) {
        current.splice(index, 1);
        mockStore.accounts = current;
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
