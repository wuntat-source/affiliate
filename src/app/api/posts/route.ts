import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { schedulePostJob } from "@/lib/queue/post-queue";
import { mockStore, MockPost } from "@/lib/mock-store";
import { getUserContext } from "@/lib/server-auth";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const userCtx = getUserContext(request);

    // Ambil dari database DAN mockStore, lalu gabungkan
    // (mockStore berisi postingan lama yang belum dimigrasi ke DB)
    let dbPosts: any[] = [];
    try {
      const userFilter = userCtx.isAdmin ? {} : { userId: userCtx.userId };
      dbPosts = await prisma.post.findMany({
        where: {
          ...userFilter,
          ...(status ? { status: status as any } : {}),
        },
        include: {
          account: true,
          product: true,
          affiliateLink: true,
          analytics: true,
          logs: { orderBy: { createdAt: "desc" }, take: 5 },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch {
      dbPosts = [];
    }

    // mockStore posts (filter per user + status)
    let mockPosts = userCtx.isAdmin
      ? mockStore.posts
      : mockStore.posts.filter(
          (p) => (p.userId || "usr_admin_kenzie") === userCtx.userId
        );
    if (status) {
      mockPosts = mockPosts.filter((p) => p.status === status);
    }

    // Gabungkan, hindari duplikat ID
    const dbIds = new Set(dbPosts.map((p) => p.id));
    const combined = [...dbPosts, ...mockPosts.filter((p) => !dbIds.has(p.id))];
    // Urutkan berdasarkan createdAt terbaru
    combined.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    return NextResponse.json({ success: true, data: combined });
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
          userId: userCtx.userId,
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
      const allAccounts = mockStore.accounts;
      const account = allAccounts.find(
        (a) => a.id === accountId && (userCtx.isAdmin || (a.userId || "usr_admin_kenzie") === userCtx.userId)
      ) || {
        platform: "THREADS",
        username: "curhat_gadget_daily",
      };

      const allProducts = mockStore.products;
      const product = productId
        ? allProducts.find(
            (p) => p.id === productId && (userCtx.isAdmin || (p.userId || "usr_admin_kenzie") === userCtx.userId)
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
        createdAt: new Date().toISOString(),
      };

      const currentPosts = [...mockStore.posts];
      mockStore.posts = [newPost, ...currentPosts];

      return NextResponse.json({ success: true, data: newPost });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create post" },
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
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    try {
      await prisma.post.delete({ where: { id } });
      return NextResponse.json({ success: true });
    } catch {
      const current = [...mockStore.posts];
      mockStore.posts = current.filter(
        (p) => !(p.id === id && (userCtx.isAdmin || (p.userId || "usr_admin_kenzie") === userCtx.userId))
      );
      return NextResponse.json({ success: true, message: "Postingan berhasil dihapus." });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete post" },
      { status: 500 }
    );
  }
}
