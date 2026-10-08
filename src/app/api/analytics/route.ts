import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockStore } from "@/lib/mock-store";
import { getUserContext } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  try {
    const userCtx = getUserContext(request);

    try {
      // Filter per-user untuk data milik user; akun tampil semua yang aktif
      const userFilter = userCtx.isAdmin ? {} : { userId: userCtx.userId };
      const accountFilter = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        totalProducts,
        totalLinks,
        totalPosts,
        publishedPosts,
        scheduledPosts,
        failedPosts,
        totalClicks,
        clicksToday,
        totalAccounts,
        topLinks,
        clicks7d,
      ] = await Promise.all([
        prisma.product.count({ where: userFilter }),
        prisma.affiliateLink.count({ where: userFilter }),
        prisma.post.count({ where: userFilter }),
        prisma.post.count({ where: { ...userFilter, status: "PUBLISHED" } }),
        prisma.post.count({ where: { ...userFilter, status: "SCHEDULED" } }),
        prisma.post.count({ where: { ...userFilter, status: "FAILED" } }),
        prisma.affiliateLink.aggregate({
          where: userFilter,
          _sum: { totalClicks: true },
        }).then((r) => r._sum.totalClicks || 0),
        prisma.linkClick.count({
          where: { clickedAt: { gte: today } },
        }),
        prisma.account.count({
          where: { ...accountFilter, status: "ACTIVE" },
        }),
        prisma.affiliateLink.findMany({
          where: userFilter,
          take: 5,
          orderBy: { totalClicks: "desc" },
          include: { product: true },
        }),
        prisma.linkClick.groupBy({
          by: ["clickedAt"],
          _count: true,
          where: {
            clickedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      // Bentuk data tren 7 hari
      const chartTrend = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
        const key = d.toISOString().slice(0, 10);
        const count = clicks7d
          .filter((c: any) => c.clickedAt.toISOString().slice(0, 10) === key)
          .reduce((s: number, c: any) => s + c._count, 0);
        return {
          date: key,
          label: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
          value: count,
        };
      });

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
          clicksToday,
          totalAccounts,
          topLinks,
          chartTrend,
        },
      });
    } catch {
      // Admin sees system-wide data; Members see only their own data
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
      const totalAccounts = (
        userCtx.isAdmin
          ? mockStore.accounts
          : mockStore.accounts.filter(
              (a) => (a.userId || "usr_admin_kenzie") === userCtx.userId
            )
      ).filter((a) => a.status === "ACTIVE").length;

      // Real clicks accumulation
      const userLinkIds = new Set(links.map((l) => l.id));
      const totalClicks = links.reduce((acc, curr) => acc + (curr.totalClicks || 0), 0);

      // Real clicks today calculation
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      
      const allClickLogs = mockStore.clickLogs || [];
      const relevantClickLogs = userCtx.isAdmin
        ? allClickLogs
        : allClickLogs.filter((log) => userLinkIds.has(log.linkId));

      const clicksToday = relevantClickLogs.filter((log) => {
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
        const dayCount = relevantClickLogs.filter((log) => {
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
