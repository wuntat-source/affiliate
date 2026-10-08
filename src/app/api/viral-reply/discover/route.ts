import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import {
  scrapeThreadsSearch,
  getKeywordsForNiche,
  getNicheLabel,
} from "@/lib/threads-scraper";

export interface TrendingPostItem {
  id: string;
  creator: string;
  handle: string;
  avatar: string;
  content: string;
  repliesCount: number;
  likesCount: number;
  niche: string;
  suggestedProduct: string;
  suggestedPainPoint: string;
}

const DEFAULT_TRENDING_FEEDS: Record<string, TrendingPostItem[]> = {
  WFC: [
    {
      id: "trend_1",
      creator: "Dimas Pradana",
      handle: "@dimas_wfc",
      avatar: "DP",
      content:
        "Jujur seminggu ini leher pegel banget dan punggung kaku gara-gara nunduk terus ngetik di laptop dari pagi sampe sore. Ada rekomendasi stand laptop yang beneran kokoh gak?",
      repliesCount: 342,
      likesCount: 1850,
      niche: "Work & Office",
      suggestedProduct: "Stand Laptop Ergonomis Aluminium",
      suggestedPainPoint: "Leher pegal dan punggung bungkuk pas kerja",
    },
    {
      id: "trend_2",
      creator: "Siti Rahma",
      handle: "@siti_daily",
      avatar: "SR",
      content:
        "Tiap jam 3 sore kepala auto kliyengan. Baru sadar dari pagi belum minum air putih sama sekali karena mager bolak-balik ngisi gelas pas lagi meeting marathon 😭",
      repliesCount: 512,
      likesCount: 3200,
      niche: "Health & Lifestyle",
      suggestedProduct: "Botol Minum Motivasi 2L",
      suggestedPainPoint: "Sering lupa minum sampai dehidrasi",
    },
  ],
  GADGET: [
    {
      id: "trend_3",
      creator: "Tech Geek ID",
      handle: "@techgeek_id",
      avatar: "TG",
      content:
        "Kabel charger laptop sama HP yang berserakan di meja kerja bikin pusing liatnya. Ada yang punya rekomendasi cable organizer atau hub meja yang rapih dan estetik?",
      repliesCount: 215,
      likesCount: 1400,
      niche: "Tech & Workspace",
      suggestedProduct: "Cable Organizer & Desk Hub",
      suggestedPainPoint: "Meja kerja berantakan banyak kabel",
    },
  ],
  LIFESTYLE: [
    {
      id: "trend_4",
      creator: "Alya Putri",
      handle: "@alyaputri_",
      avatar: "AP",
      content:
        "Pengen mulai konsisten minum air 2 liter sehari buat glowing tapi selalu gagal di tengah jalan. Tips kalian gimana biar gak lupa ya?",
      repliesCount: 428,
      likesCount: 2900,
      niche: "Health & Beauty",
      suggestedProduct: "Botol Minum Motivasi 2L",
      suggestedPainPoint: "Gagal konsisten minum 2 liter",
    },
  ],
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get("niche") || "ALL";

    // Coba ambil data asli dari Threads via scraper.
    // Kalau gagal (timeout/blokir), fallback ke data contoh.
    let results: TrendingPostItem[] = [];
    let isLive = false;

    try {
      const keywords = getKeywordsForNiche(niche);
      const scraped: TrendingPostItem[] = [];
      for (const kw of keywords.slice(0, 3)) {
        const posts = await scrapeThreadsSearch(kw, 4);
        const nicheKey = niche === "ALL" ? nicheForKeyword(keywords, kw) : niche;
        for (const p of posts) {
          scraped.push({
            id: p.id,
            creator: p.creator,
            handle: p.handle,
            avatar: p.avatar,
            content: p.content,
            repliesCount: p.repliesCount,
            likesCount: p.likesCount,
            niche: getNicheLabel(nicheKey),
            suggestedProduct: "",
            suggestedPainPoint: "",
          });
        }
        if (scraped.length >= 8) break;
      }
      if (scraped.length > 0) {
        results = scraped;
        isLive = true;
      }
    } catch (e) {
      console.warn("[discover] scraper gagal, pakai data contoh:", (e as Error).message);
    }

    if (!isLive) {
      if (niche === "ALL") {
        results = [
          ...DEFAULT_TRENDING_FEEDS.WFC,
          ...DEFAULT_TRENDING_FEEDS.GADGET,
          ...DEFAULT_TRENDING_FEEDS.LIFESTYLE,
        ];
      } else if (DEFAULT_TRENDING_FEEDS[niche]) {
        results = DEFAULT_TRENDING_FEEDS[niche];
      } else {
        results = DEFAULT_TRENDING_FEEDS.WFC;
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      live: isLive,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to discover trending posts" },
      { status: 500 }
    );
  }
}

/** Tentukan niche asal untuk keyword (dipakai saat niche=ALL) */
function nicheForKeyword(keywords: string[], kw: string): string {
  const idx = keywords.indexOf(kw);
  if (keywords.length === 3) {
    return ["WFC", "GADGET", "LIFESTYLE"][idx] || "WFC";
  }
  return "WFC";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, topic } = body;

    // Simulate / AI-extract post content from URL or custom prompt
    let extractedContent = "";
    let extractedCreator = "viral_user";

    if (url) {
      // Mock scrape result from URL structure
      extractedContent = `Postingan terkait diskusi viral seputar rutinitas dan keresahan harian di Threads: ${url}`;
      extractedCreator = url.includes("@") ? url.split("@")[1].split("/")[0] : "trending_creator";
    } else if (topic) {
      extractedContent = topic;
    }

    return NextResponse.json({
      success: true,
      data: {
        content: extractedContent,
        creator: extractedCreator,
        estimatedReplies: Math.floor(Math.random() * 300) + 120,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch post from URL" },
      { status: 500 }
    );
  }
}
