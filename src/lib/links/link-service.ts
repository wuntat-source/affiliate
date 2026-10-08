import { prisma } from "@/lib/prisma";
import { mockStore, MockClickLog } from "@/lib/mock-store";
import { nanoid } from "nanoid";

export interface CreateAffiliateLinkInput {
  productId: string;
  originalUrl: string;
  platform?: "SHOPEE" | "TIKTOK_SHOP" | "TOKOPEDIA" | "LAZADA" | "AMAZON" | "CUSTOM";
  customSlug?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  userId?: string;
}

export function buildTargetUrlWithUtm(
  originalUrl: string,
  options?: { utmSource?: string; utmMedium?: string; utmCampaign?: string }
): string {
  try {
    const url = new URL(originalUrl);
    if (options?.utmSource) url.searchParams.set("utm_source", options.utmSource);
    if (options?.utmMedium) url.searchParams.set("utm_medium", options.utmMedium);
    if (options?.utmCampaign) url.searchParams.set("utm_campaign", options.utmCampaign);
    return url.toString();
  } catch {
    return originalUrl;
  }
}

export async function createOrUpdateAffiliateLink(input: CreateAffiliateLinkInput) {
  const shortCode = input.customSlug?.trim() || nanoid(7);

  try {
    const link = await prisma.affiliateLink.create({
      data: {
        userId: input.userId || null,
        productId: input.productId,
        originalUrl: input.originalUrl,
        platform: input.platform || "SHOPEE",
        shortCode,
        utmSource: input.utmSource || "affiliatepost",
        utmMedium: input.utmMedium || "social",
        utmCampaign: input.utmCampaign || "threads_curhat",
      },
      include: {
        product: true,
      },
    });

    return link;
  } catch {
    // Mock store fallback with userId
    const targetUserId = input.userId || "usr_admin_kenzie";
    const product = mockStore.products.find(
      (p) => p.id === input.productId && (p.userId || "usr_admin_kenzie") === targetUserId
    ) || {
      id: input.productId,
      name: "Produk Affiliate",
      category: "General",
    };

    const newLink = {
      id: `link_${nanoid(8)}`,
      userId: targetUserId,
      productId: input.productId,
      product: {
        id: product.id,
        name: product.name,
        category: product.category,
      },
      originalUrl: input.originalUrl,
      shortCode,
      platform: input.platform || "SHOPEE",
      utmSource: input.utmSource || "threads_curhat",
      totalClicks: 0,
      _count: { clicks: 0, posts: 0 },
      createdAt: new Date().toISOString(),
    };

    mockStore.links = [newLink, ...mockStore.links];
    return newLink;
  }
}

export async function recordLinkClick(
  shortCode: string,
  reqInfo?: { ip?: string; userAgent?: string; referer?: string }
) {
  try {
    const link = await prisma.affiliateLink.findUnique({
      where: { shortCode },
    });

    if (link && link.isActive) {
      await prisma.$transaction([
        prisma.affiliateLink.update({
          where: { id: link.id },
          data: { totalClicks: { increment: 1 } },
        }),
        prisma.linkClick.create({
          data: {
            affiliateLinkId: link.id,
            userAgent: reqInfo?.userAgent,
            referer: reqInfo?.referer,
            device: detectDevice(reqInfo?.userAgent),
          },
        }),
      ]);

      return buildTargetUrlWithUtm(link.originalUrl, {
        utmSource: link.utmSource || undefined,
        utmMedium: link.utmMedium || undefined,
        utmCampaign: link.utmCampaign || undefined,
      });
    }
  } catch {
    // Prisma fallback -> Mock Store
  }

  // Look in mock store
  const targetLink = mockStore.links.find((l) => l.shortCode === shortCode);
  if (!targetLink) return null;

  // Increment real click
  targetLink.totalClicks = (targetLink.totalClicks || 0) + 1;
  if (!targetLink._count) targetLink._count = { clicks: 0, posts: 0 };
  targetLink._count.clicks = targetLink.totalClicks;

  // Log real click event
  const newLog: MockClickLog = {
    id: `clk_${nanoid(10)}`,
    linkId: targetLink.id,
    shortCode: targetLink.shortCode,
    clickedAt: new Date().toISOString(),
    userAgent: reqInfo?.userAgent,
    referer: reqInfo?.referer,
    ip: reqInfo?.ip,
  };

  mockStore.clickLogs = [newLog, ...mockStore.clickLogs];
  // Trigger save
  mockStore.links = [...mockStore.links];

  return buildTargetUrlWithUtm(targetLink.originalUrl, {
    utmSource: targetLink.utmSource || undefined,
    utmMedium: "social",
    utmCampaign: "threads_curhat",
  });
}

function detectDevice(userAgent?: string): string {
  if (!userAgent) return "Unknown";
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|phone/i.test(ua)) return "Mobile";
  if (/tablet|ipad/i.test(ua)) return "Tablet";
  return "Desktop";
}
