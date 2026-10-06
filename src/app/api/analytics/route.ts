import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockStore } from "@/lib/mock-store";
import { getUserContext } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  try {
    const userCtx = getUserContext(request);

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
      // Mock store fallback with user isolation
      const products = userCtx.isAdmin
        ? mockStore.products
        : mockStore.products.filter(
            (p) => (p.userId || "usr_admin_kenzie") === userCtx.userId
          );

      const links = userCtx.isAdmin
        ? mockStore.links
        : mockStore.links.filter(
            (l) => (l.userId || "usr_admin_kenzie") === userCtx.userId
          );

      const posts = userCtx.isAdmin
        ? mockStore.posts
        : mockStore.posts.filter(
            (p) => (p.userId || "usr_admin_kenzie") === userCtx.userId
          );

      const totalProducts = products.length;
      const totalLinks = links.length;
      const totalPosts = posts.length;
      const publishedPosts = posts.filter((p) => p.status === "PUBLISHED").length;
      const scheduledPosts = posts.filter((p) => p.status === "SCHEDULED").length;
      const failedPosts = posts.filter((p) => p.status === "FAILED").length;
      const totalAccounts = mockStore.accounts.filter((a) => a.status === "ACTIVE").length;

      // Real clicks accumulation
      const totalClicks = links.reduce((acc, curr) => acc + (curr.totalClicks || 0), 0);

      // Real clicks today calculation
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      
      const clickLogs = mockStore.clickLogs || [];
      const clicksToday = clickLogs.filter((log) => {
        try {
          const logDate = new Date(log.clickedAt);
          const logDateStr = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, "0")}-${String(logDate.getDate()).padStart(2, "0")}`;
          return logDateStr === todayStr;
        } catch {
          return false;
        }
      }).length;

      // Generate 100% Real 7-day trend from actual clickLogs
      const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
      const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      const chartTrend = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const dateLabel = `${d.getDate()} ${months[d.getMonth()]}`;

        // Count exact real clicks on this day
        const dayCount = clickLogs.filter((log) => {
          try {
            const logDate = new Date(log.clickedAt);
            const logDateStr = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, "0")}-${String(logDate.getDate()).padStart(2, "0")}`;
            return logDateStr === dayStr;
          } catch {
            return false;
          }
        }).length;

        chartTrend.push({
          date: dateLabel,
          day: days[d.getDay()],
          value: dayCount,
        });
      }

      const topLinks = links
        .slice()
        .sort((a, b) => (b.totalClicks || 0) - (a.totalClicks || 0))
        .slice(0, 5);

      return NextResponse.json({
        success: true,
        data: {
          totalProducts,
          totalLinks,
          totalPosts,
          totalAccounts,
          publishedPosts,
          scheduledPosts,
          failedPosts,
          totalClicks,
          clicksToday,
          chartTrend,
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
