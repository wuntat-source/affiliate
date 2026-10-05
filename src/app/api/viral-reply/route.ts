import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { mockStore } from "@/lib/mock-store";
import { nanoid } from "nanoid";

export interface ViralReplyRequest {
  targetPostUrl?: string;
  targetPostContent?: string;
  productName: string;
  productCategory?: string;
  productUsp?: string;
  affiliateUrl?: string;
  replyStyle?: "RELATABLE_CURHAT" | "HELPFUL_HACK" | "HUMOROUS_CHILL" | "DIRECT_SPILL";
  apiKey?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ViralReplyRequest = await request.json();
    const {
      targetPostContent,
      productName,
      productCategory,
      productUsp,
      affiliateUrl,
      replyStyle,
    } = body;

    if (!productName) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    const link = affiliateUrl || "{link_afiliasi}";
    const style = replyStyle || "RELATABLE_CURHAT";

    const styleInstructions: Record<string, string> = {
      RELATABLE_CURHAT: `
Gaya: Komentar santai seolah kita pengguna yang relate banget sama masalah di postingan itu.
Sudut pandang: Orang pertama ("aku" / "gue").
Panjang: Singkat dan padat (maksimal 220 karakter).
Format: Tanggapi postingannya dulu dengan ramah/relate, lalu spill bahwa ${productName} (${productUsp || "ini"}) ngebantu banget + sertakan link: ${link}.
`,
      HELPFUL_HACK: `
Gaya: Memberikan tips/lifehack bermanfaat terkait topik, lalu merekomendasikan ${productName} sebagai solusinya.
Panjang: Maksimal 240 karakter.
Sertakan link di akhir: ${link}.
`,
      HUMOROUS_CHILL: `
Gaya: Santai, sedikit bercanda/meme relatable, tapi solutif.
Panjang: Maksimal 200 karakter.
Sertakan link: ${link}.
`,
      DIRECT_SPILL: `
Gaya: Buat yang sering nanya atau butuh solusi cepat.
Panjang: Maksimal 180 karakter.
Sertakan link: ${link}.
`,
    };

    const systemPrompt = `Kamu adalah copywriter Threads & Twitter/X spesialis "Viral Thread Commenter / Hijack Reply".
Tugasmu: Menulis balasan komentar organik ke postingan populer yang sedang viral agar audiens tertarik mengklik link afiliasi tanpa terkesan spam kaku.

${styleInstructions[style]}

Kembalikan respon HANYA dalam format JSON valid:
{
  "reply_text": "Teks komentar balasan",
  "hook_explanation": "Alasan kenapa komentar ini natural dan berpeluang dapat klik tinggi"
}`;

    const userPrompt = `Target Postingan Populer / Topik:
"${targetPostContent || "Postingan tentang capek kerja, lembur, dan butuh recharge / rutinitas sehat"}"

Produk Afiliasi yang Dipromosikan:
- Nama Produk: ${productName}
- Kategori: ${productCategory || "General"}
- Keunggulan Utama: ${productUsp || "Praktis dan fungsional"}
- Link Afiliasi: ${link}`;

    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    let generatedReply = "";
    let hookExplanation = "";

    // 1. Try Gemini
    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.85,
          },
          systemInstruction: systemPrompt,
        });

        const result = await model.generateContent(userPrompt);
        const parsed = JSON.parse(result.response.text());
        generatedReply = parsed.reply_text;
        hookExplanation = parsed.hook_explanation;
      } catch (err) {
        console.warn("[Viral Reply Engine] Gemini fallback trigger:", err);
      }
    }

    // 2. Try OpenAI fallback
    if (!generatedReply && openaiKey) {
      try {
        const openai = new OpenAI({ apiKey: openaiKey });
        const res = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.85,
        });
        const content = res.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          generatedReply = parsed.reply_text;
          hookExplanation = parsed.hook_explanation;
        }
      } catch (err) {
        console.warn("[Viral Reply Engine] OpenAI fallback trigger:", err);
      }
    }

    // 3. Fallback smart generator template
    if (!generatedReply) {
      if (style === "HELPFUL_HACK") {
        generatedReply = `Bener banget, kuncinya tuh jangan nunggu burnout baru istirahat. Semenjak pake ${productName} (${productUsp || "ngebantu banget"}), ritme harian jadi jauh lebih teratur. Yang butuh solusinya bisa cek di sini 👉 ${link}`;
        hookExplanation = "Memberikan validasi atas masalah yang dibahas sebelum merekomendasikan solusi.";
      } else if (style === "HUMOROUS_CHILL") {
        generatedReply = `Relate parah 😭 Dulu tiap sore lemes gak karuan, ternyata solusinya cuma modal ${productName} ini di meja. Penyelamat hidup banget: ${link}`;
        hookExplanation = "Memakai emoji dan gaya curhat ekspresif yang mengundang interaksi sesama audiens.";
      } else {
        generatedReply = `Sama banget kak, aku kemarin juga gitu sampai akhirnya nemu ${productName}. Asli nolong banget pas lagi riweuh. Belinya di toko official ini ya: ${link}`;
        hookExplanation = "Pendekatan sosial 'sama banget' menciptakan rasa senasib yang meningkatkan CTR.";
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        replyText: generatedReply,
        hookExplanation,
        characterCount: generatedReply.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate viral reply" },
      { status: 500 }
    );
  }
}
