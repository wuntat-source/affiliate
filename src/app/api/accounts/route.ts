import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockStore, MockAccount, saveStoreToDisk } from "@/lib/mock-store";
import { getUserContext } from "@/lib/server-auth";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  try {
    const userCtx = getUserContext(request);

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
      // Strictly isolate by current user
      const filtered = mockStore.accounts.filter(
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
          (a.userId || "usr_admin_kenzie") === userCtx.userId
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
        (a) => a.id === id && (a.userId || "usr_admin_kenzie") === userCtx.userId
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
