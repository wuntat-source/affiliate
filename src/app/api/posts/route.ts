import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { schedulePostJob } from "@/lib/queue/post-queue";
import { mockStore, MockPost, saveStoreToDisk } from "@/lib/mock-store";
import { getUserContext } from "@/lib/server-auth";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const userCtx = getUserContext(request);

    try {
      const posts = await prisma.post.findMany({
        where: status ? { status: status as any } : undefined,
        include: {
          account: true,
          product: true,
          affiliateLink: true,
          analytics: true,
          logs: { orderBy: { createdAt: "desc" }, take: 5 },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ success: true, data: posts });
    } catch {
      // Strictly isolate by current user
      let filtered = mockStore.posts.filter(
        (p) => (p.userId || "usr_admin_kenzie") === userCtx.userId
      );

      if (status) {
        filtered = filtered.filter((p) => p.status === status);
      }

      return NextResponse.json({ success: true, data: filtered });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch post queue" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userCtx = getUserContext(request);
    const { accountId, productId, affiliateLinkId, mainContent, replyContent, scheduledAt, aiDraftId } = body;

    if (!accountId || !mainContent) {
      return NextResponse.json(
        { error: "Account ID and main post content are required." },
        { status: 400 }
      );
    }

    try {
      const post = await prisma.post.create({
        data: {
          accountId,
          productId: productId || null,
          affiliateLinkId: affiliateLinkId || null,
          aiDraftId: aiDraftId || null,
          mainContent,
          replyContent: replyContent || null,
          status: scheduledAt ? "SCHEDULED" : "DRAFT",
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        },
        include: {
          account: true,
          product: true,
        },
      });

      if (scheduledAt) {
        await schedulePostJob(post.id, new Date(scheduledAt));
      }

      return NextResponse.json({ success: true, data: post });
    } catch {
      const account = mockStore.accounts.find(
        (a) => a.id === accountId && (a.userId || "usr_admin_kenzie") === userCtx.userId
      ) || {
        platform: "THREADS",
        username: "curhat_gadget_daily",
      };
      const product = productId
        ? mockStore.products.find(
            (p) => p.id === productId && (p.userId || "usr_admin_kenzie") === userCtx.userId
          )
        : undefined;

      const newPost: MockPost = {
        id: `post_${nanoid(6)}`,
        userId: userCtx.userId,
        accountId,
        account: { platform: account.platform, username: account.username },
        productId: productId || undefined,
        product: product ? { name: product.name } : undefined,
        mainContent,
        replyContent: replyContent || undefined,
        status: scheduledAt ? "SCHEDULED" : "DRAFT",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        createdAt: new Date(),
      };

      mockStore.posts.unshift(newPost);
      saveStoreToDisk();
      return NextResponse.json({ success: true, data: newPost });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create post" },
      { status: 500 }
    );
  }
}
