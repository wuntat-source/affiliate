import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockStore, MockAccount } from "@/lib/mock-store";
import { nanoid } from "nanoid";

export async function GET() {
  try {
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
      return NextResponse.json({ success: true, data: mockStore.accounts });
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
        (a) => a.platform === platform && a.username === username
      );

      if (existing) {
        existing.accountName = accountName || username;
        existing.accessToken = accessToken || "sandbox_token";
        return NextResponse.json({ success: true, data: existing });
      }

      const newAccount: MockAccount = {
        id: `acc_${nanoid(6)}`,
        platform,
        accountName: accountName || username,
        username,
        accessToken: accessToken || "sandbox_token",
        status: "ACTIVE",
        _count: { posts: 0 },
        createdAt: new Date(),
      };

      mockStore.accounts.unshift(newAccount);
      return NextResponse.json({ success: true, data: newAccount });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save account" },
      { status: 500 }
    );
  }
}
