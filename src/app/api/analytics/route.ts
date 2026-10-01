import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockStore } from "@/lib/mock-store";

export async function GET() {
  try {
    try {
      const [
        totalProducts,
        totalLinks,
        totalPosts,
        publishedPosts,
        scheduledPosts,
        failedPosts,
        recentClicks,
        topLinks,
      ] = await Promise.all([
        prisma.product.count(),
        prisma.affiliateLink.count(),
        prisma.post.count(),
        prisma.post.count({ where: { status: "PUBLISHED" } }),
        prisma.post.count({ where: { status: "SCHEDULED" } }),
        prisma.post.count({ where: { status: "FAILED" } }),
        prisma.linkClick.count(),
        prisma.affiliateLink.findMany({
          take: 5,
          orderBy: { totalClicks: "desc" },
          include: { product: true },
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          totalProducts,
          totalLinks,
          totalPosts,
          publishedPosts,
          scheduledPosts,
          failedPosts,
          totalClicks: recentClicks,
          topLinks,
        },
      });
    } catch {
      // Mock store fallback
      const totalProducts = mockStore.products.length;
      const totalLinks = mockStore.links.length;
      const totalPosts = mockStore.posts.length;
      const publishedPosts = mockStore.posts.filter((p) => p.status === "PUBLISHED").length;
      const scheduledPosts = mockStore.posts.filter((p) => p.status === "SCHEDULED").length;
      const failedPosts = mockStore.posts.filter((p) => p.status === "FAILED").length;
      const totalClicks = mockStore.links.reduce((acc, curr) => acc + curr.totalClicks, 0);

      const topLinks = mockStore.links
        .slice()
        .sort((a, b) => b.totalClicks - a.totalClicks)
        .slice(0, 5);

      return NextResponse.json({
        success: true,
        data: {
          totalProducts,
          totalLinks,
          totalPosts,
          publishedPosts,
          scheduledPosts,
          failedPosts,
          totalClicks,
          topLinks,
        },
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
