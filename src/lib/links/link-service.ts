import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

export interface CreateAffiliateLinkInput {
  productId: string;
  originalUrl: string;
  platform?: "SHOPEE" | "TIKTOK_SHOP" | "TOKOPEDIA" | "LAZADA" | "AMAZON" | "CUSTOM";
  customSlug?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
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

  const link = await prisma.affiliateLink.create({
    data: {
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
}

export async function recordLinkClick(
  shortCode: string,
  reqInfo?: { ip?: string; userAgent?: string; referer?: string }
) {
  const link = await prisma.affiliateLink.findUnique({
    where: { shortCode },
  });

  if (!link || !link.isActive) return null;

  // Asynchronously record click log and increment counter
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

function detectDevice(userAgent?: string): string {
  if (!userAgent) return "Unknown";
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|phone/i.test(ua)) return "Mobile";
  if (/tablet|ipad/i.test(ua)) return "Tablet";
  return "Desktop";
}
