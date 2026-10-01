import { NextRequest, NextResponse } from "next/server";
import { recordLinkClick } from "@/lib/links/link-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!code) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const userAgent = request.headers.get("user-agent") || undefined;
  const referer = request.headers.get("referer") || undefined;
  const ip = request.headers.get("x-forwarded-for") || undefined;

  try {
    const targetUrl = await recordLinkClick(code, {
      ip,
      userAgent,
      referer,
    });

    if (targetUrl) {
      return NextResponse.redirect(targetUrl, 302);
    }
  } catch (err) {
    console.error("[Link Redirect Error]:", err);
  }

  return NextResponse.redirect(new URL("/", request.url));
}
