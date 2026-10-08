/**
 * Scraper postingan publik Threads via Firefox (Playwright).
 * Dipakai untuk fitur Auto-Discovery agar memakai data asli, bukan mock.
 *
 * Cara kerja: buka halaman search publik threads.com/search?q=<keyword>,
 * lalu parse postingan dari DOM. Memerlukan proxy env (lihat getPlaywrightProxy).
 */

import { firefox } from "playwright";
import { getPlaywrightProxy } from "./playwright/browser-session";

export interface ScrapedPost {
  id: string;
  creator: string;
  handle: string;
  avatar: string;
  content: string;
  postUrl: string;
  likesCount: number;
  repliesCount: number;
}

// Keyword per niche untuk pencarian
const NICHE_KEYWORDS: Record<string, string[]> = {
  WFC: ["stand laptop", "kerja dari rumah", "produktivitas"],
  GADGET: ["cable organizer", "setup meja kerja", "gadget"],
  LIFESTYLE: ["minum air putih", "gaya hidup sehat", "skincare"],
};

function parseCount(s: string): number {
  if (!s) return 0;
  const m = s.trim().toLowerCase().match(/^([\d.,]+)([km]?)$/);
  if (!m) return 0;
  let n = parseFloat(m[1].replace(",", "."));
  if (m[2] === "k") n *= 1000;
  if (m[2] === "m") n *= 1000000;
  return Math.round(n);
}

export async function scrapeThreadsSearch(
  keyword: string,
  maxPosts = 8
): Promise<ScrapedPost[]> {
  const proxy = getPlaywrightProxy();
  const browser = await firefox.launch({
    headless: true,
    proxy,
    args: ["--no-sandbox"],
  });

  try {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    const url = `https://www.threads.com/search?q=${encodeURIComponent(keyword)}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(8000);

    const posts: ScrapedPost[] = await page.evaluate((max: number) => {
      const results: any[] = [];
      const seen = new Set<string>();
      // Setiap link postingan unik
      const postLinks = document.querySelectorAll<HTMLAnchorElement>('a[href*="/post/"]');
      for (const link of postLinks) {
        const href = link.getAttribute("href") || "";
        if (seen.has(href)) continue;
        seen.add(href);
        if (results.length >= max) break;

        // Naik ke container post (cari elemen yang memuat username + konten)
        let container: HTMLElement | null = link as HTMLElement;
        for (let i = 0; i < 8 && container; i++) {
          container = container.parentElement;
          if (!container) break;
          const t = container.innerText || "";
          // Container post biasanya memuat @username dan teks cukup panjang
          if (t.length > 50 && container.querySelector('a[href^="/@"]')) break;
        }
        if (!container) continue;

        const fullText = container.innerText || "";
        // Username: link /@username pertama di container
        const userLink = container.querySelector<HTMLAnchorElement>('a[href^="/@"]');
        const handle = userLink
          ? "@" + (userLink.getAttribute("href") || "").replace("/@", "").split("/")[0]
          : "@unknown";
        const creator = userLink?.innerText?.trim() || handle.replace("@", "");

        // Konten: ambil baris teks, buang baris username/tanggal/angka engagement
        const lines = fullText.split("\n").map((l) => l.trim()).filter(Boolean);
        // Baris konten biasanya yang paling panjang dan bukan angka/tanggal
        const contentLines = lines.filter((l) => {
          if (/^[\d.,kKmM]+$/.test(l)) return false; // angka engagement
          if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(l)) return false; // tanggal
          if (l === creator || l === handle || l === handle.replace("@", "")) return false;
          return l.length > 10;
        });
        const content = contentLines.slice(0, 3).join(" ").slice(0, 500);
        if (!content) continue;

        // Engagement: angka-angka di akhir (likes, replies, reposts...)
        const numbers = lines
          .filter((l) => /^[\d.,kKmM]+$/.test(l))
          .map((l) => l);

        results.push({
          id: "scraped_" + href.split("/post/")[1]?.split("?")[0]?.replace(/[^a-zA-Z0-9_-]/g, "") || String(results.length),
          creator,
          handle,
          avatar: creator.slice(0, 2).toUpperCase(),
          content,
          postUrl: href.startsWith("http") ? href : "https://www.threads.com" + href,
          likesCount: numbers[0] ? undefined : 0, // diisi di bawah
          _numbers: numbers,
        });
      }
      return results;
    }, maxPosts);

    // Parse angka engagement di Node (lebih mudah)
    return posts.map((p: any) => {
      const nums: string[] = p._numbers || [];
      const { _numbers, ...rest } = p;
      return {
        ...rest,
        likesCount: parseCount(nums[0] || "0"),
        repliesCount: parseCount(nums[1] || "0"),
      };
    });
  } finally {
    await browser.close().catch(() => {});
  }
}

/** Ambil keyword untuk niche tertentu */
export function getKeywordsForNiche(niche: string): string[] {
  if (niche && NICHE_KEYWORDS[niche]) return NICHE_KEYWORDS[niche];
  // ALL: ambil 1 keyword dari tiap niche
  return [NICHE_KEYWORDS.WFC[0], NICHE_KEYWORDS.GADGET[0], NICHE_KEYWORDS.LIFESTYLE[0]];
}

/** Label niche untuk keyword */
export function getNicheLabel(niche: string): string {
  const labels: Record<string, string> = {
    WFC: "Work & Office",
    GADGET: "Tech & Workspace",
    LIFESTYLE: "Health & Lifestyle",
  };
  return labels[niche] || "General";
}
