import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export interface AIContentRequest {
  productName: string;
  category?: string;
  painPoints?: string;
  usps?: string;
  affiliateUrl?: string;
  tone?: "CASUAL_CURHAT" | "VIRAL_STORY" | "PROBLEM_SOLVER" | "HONEST_REVIEW" | "URGENT_DEAL";
  targetPlatform?: "THREADS" | "TWITTER" | "INSTAGRAM";
  apiKey?: string;
  provider?: "gemini" | "openai";
}

export interface AIContentResponse {
  mainPost: string;
  replyPost: string;
  characterCount: number;
  modelUsed: string;
}

const TONE_PROMPTS: Record<string, string> = {
  CASUAL_CURHAT: `
Gaya: Soft-selling curhat Threads santai sehari-hari.
Sudut pandang: Orang pertama ("aku").
Struktur:
1. Postingan Utama: Awali dengan keresahan/kebiasaan sepele atau momen relatable. Ceritakan bagaimana produk ini jadi solusi praktis (maksimal 350 karakter).
2. Postingan Balasan (Reply #1 dengan Link Afiliasi): Tulis dengan kalimat yang LEBIH PANJANG, LENGKAP, dan BERBOBOT (2-4 kalimat natural). Jelaskan detail tambahan seperti kenapa beli di toko official ini, info bonus/promo gratis ongkir, tips klaim voucher toko, jaminan barang original, serta ajakan klik link ${'{link_afiliasi}'} yang ramah dan solutif.
`,
  VIRAL_STORY: `
Gaya: Hook kuat, storytelling cepat, dan emosional/penasaran.
Struktur:
1. Postingan Utama: Hook dramatis dan cerita perubahan sebelum vs sesudah (maksimal 350 karakter).
2. Postingan Balasan (Reply #1 dengan Link Afiliasi): Kalimat panjang dan meyakinkan (2-4 kalimat). Cantumkan spill link official ${'{link_afiliasi}'}, review singkat pengiriman/packing, peringatan agar tidak tergiur produk palsu murah, dan ajakan checkout mumpung stok promo masih ada.
`,
  PROBLEM_SOLVER: `
Gaya: Problem-Agitate-Solution to-the-point.
Struktur:
1. Postingan Utama: Bedah masalah teknis/harian dan solusinya (maksimal 320 karakter).
2. Postingan Balasan (Reply #1 dengan Link Afiliasi): Rekomendasi mendalam (2-3 kalimat) mengenai alasan memilih varian/produk ini dibanding alternatif lain, garansi kualitas, serta link pembelian resmi ${'{link_afiliasi}'}.
`,
  HONEST_REVIEW: `
Gaya: Review jujur setelah pemakaian rutin. Highlight plus & minus santai.
Struktur:
1. Postingan Utama: Ulasan objektif hasil pemakaian (maksimal 350 karakter).
2. Postingan Balasan (Reply #1 dengan Link Afiliasi): Ulasan lanjutan yang informatif (2-4 kalimat) mengenai detail material, toko resmi tempat beli dengan rating bintang 5, tips pemakaian harian, dan link checkout ${'{link_afiliasi}'}.
`,
  URGENT_DEAL: `
Gaya: Info diskon/promo kilat tanpa terlihat spammy.
Struktur:
1. Postingan Utama: Highlight promo spesial, voucher terbatas, atau bundling menarik (maksimal 300 karakter).
2. Postingan Balasan (Reply #1 dengan Link Afiliasi): Penjelasan detail promo (2-3 kalimat) mengenai cara dapat gratis ongkir ekstra, batas waktu diskon, dan link checkout langsung ${'{link_afiliasi}'}.
`,
};

export async function generateSocialContent(req: AIContentRequest): Promise<AIContentResponse> {
  const tone = req.tone || "CASUAL_CURHAT";
  const toneGuideline = TONE_PROMPTS[tone] || TONE_PROMPTS.CASUAL_CURHAT;
  const affiliateLink = req.affiliateUrl || "{link_afiliasi}";

  const systemInstruction = `Kamu adalah copywriter profesional spesialis social media marketing & affiliate conversion untuk platform Threads dan Twitter/X.
Tugasmu: Menghasilkan konten organik yang natural, sangat menarik, berkonversi tinggi, dan TIDAK kaku.

ATURAN PENTING:
1. Postingan utama (post_utama) berisi hook dan cerita/curhat menarik (maksimal 350 karakter).
2. Postingan balasan (post_balasan) HARUS DIBUAT LEBIH PANJANG (2-4 kalimat lengkap, bukan cuma 1 kalimat pendek). Isinya harus memberikan nilai tambah (alasan beli di toko official, tips klaim diskon/gratis ongkir, review packing/kualitas ori, dan call-to-action natural) yang menyematkan link ${affiliateLink}.

${toneGuideline}

Wajib berikan output HANYA dalam format JSON valid berikut tanpa markdown formatting tambahan:
{
  "post_utama": "Teks postingan utama",
  "post_balasan": "Teks komentar balasan yang panjang dan informatif dengan link ${affiliateLink}"
}`;

  const prompt = `Data Produk:
- Nama Produk: ${req.productName}
- Kategori: ${req.category || "General"}
- Masalah / Pain Points: ${req.painPoints || "Masalah sehari-hari"}
- Keunggulan / USPs: ${req.usps || "Praktis dan fungsional"}
- Link Afiliasi: ${affiliateLink}`;

  const geminiApiKey = req.apiKey || process.env.GEMINI_API_KEY;
  const openaiApiKey = req.apiKey || process.env.OPENAI_API_KEY;

  // 1. Try Gemini if configured
  if (geminiApiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.8,
        },
        systemInstruction,
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const parsed = JSON.parse(responseText);

      return {
        mainPost: parsed.post_utama,
        replyPost: parsed.post_balasan,
        characterCount: (parsed.post_utama || "").length,
        modelUsed: "gemini-1.5-flash",
      };
    } catch (err: any) {
      console.warn("[AI Engine] Gemini generation error, attempting fallback:", err.message);
    }
  }

  // 2. Try OpenAI if configured
  if (openaiApiKey) {
    try {
      const openai = new OpenAI({ apiKey: openaiApiKey });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      });

      const content = completion.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        return {
          mainPost: parsed.post_utama,
          replyPost: parsed.post_balasan,
          characterCount: (parsed.post_utama || "").length,
          modelUsed: "gpt-4o-mini",
        };
      }
    } catch (err: any) {
      console.warn("[AI Engine] OpenAI generation error, using smart local template:", err.message);
    }
  }

  // 3. Fallback Smart Generator Engine (Local NLP Template)
  return generateFallbackContent(req);
}

export interface ExtractedProductInfo {
  productName: string;
  category: string;
  painPoints: string;
  usps: string;
  suggestedTone: "CASUAL_CURHAT" | "VIRAL_STORY" | "PROBLEM_SOLVER" | "HONEST_REVIEW" | "URGENT_DEAL";
}

export async function extractProductInfo(rawText: string): Promise<ExtractedProductInfo> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  const systemInstruction = `Kamu adalah pakar riset produk e-commerce & affiliate marketing.
Tugasmu: Mengekstrak informasi penting dari deskripsi mentah/judul produk Shopee, Tokopedia, atau TikTok Shop menjadi format terstruktur untuk kebutuhan copywriting affiliate Threads/Twitter.

Format Output WAJIB JSON:
{
  "productName": "Nama ringkas dan menarik dari produk",
  "category": "Kategori produk (e.g. Gadget & Tech, Home & Living, Fashion, Health & Beauty, Lifestyle)",
  "painPoints": "Keresahan/masalah sehari-hari relatable yang dialami orang sebelum pakai produk ini (1-2 kalimat santai)",
  "usps": "Keunggulan utama & fitur produk yang jadi solusi (1-2 kalimat jelas)",
  "suggestedTone": "CASUAL_CURHAT"
}`;

  if (geminiApiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
        systemInstruction,
      });
      const result = await model.generateContent(`Deskripsi Mentah Produk:\n"""${rawText}"""`);
      const parsed = JSON.parse(result.response.text());
      return {
        productName: parsed.productName || "Produk Pilihan",
        category: parsed.category || "General",
        painPoints: parsed.painPoints || "Sering ribet dengan barang yang kurang praktis",
        usps: parsed.usps || "Kualitas bagus dan sangat membantu aktivitas harian",
        suggestedTone: parsed.suggestedTone || "CASUAL_CURHAT",
      };
    } catch (e: any) {
      console.warn("[AI Extract] Gemini extract error:", e.message);
    }
  }

  if (openaiApiKey) {
    try {
      const openai = new OpenAI({ apiKey: openaiApiKey });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: `Deskripsi Mentah Produk:\n"""${rawText}"""` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });
      const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
      return {
        productName: parsed.productName || "Produk Pilihan",
        category: parsed.category || "General",
        painPoints: parsed.painPoints || "Sering ribet dengan barang yang kurang praktis",
        usps: parsed.usps || "Kualitas bagus dan sangat membantu aktivitas harian",
        suggestedTone: parsed.suggestedTone || "CASUAL_CURHAT",
      };
    } catch (e: any) {
      console.warn("[AI Extract] OpenAI extract error:", e.message);
    }
  }

  // Fallback Rule-based Local Parser
  const lines = rawText.split("\n").map(l => l.trim()).filter(Boolean);
  const firstLine = lines[0] || "Produk Rekomendasi";
  const title = firstLine.replace(/^(jual|promo|ready|diskon|murah)\s+/i, "").slice(0, 60);

  return {
    productName: title,
    category: "General",
    painPoints: `Sering kerepotan atau butuh solusi praktis untuk kebutuhan harian`,
    usps: lines.slice(1, 3).join(", ") || "Material berkualitas, awet, dan multifungsi",
    suggestedTone: "CASUAL_CURHAT",
  };
}

function generateFallbackContent(req: AIContentRequest): AIContentResponse {
  const link = req.affiliateUrl || "{link_afiliasi}";
  const pain = req.painPoints || "sering kerepotan dengan urusan harian";
  const usp = req.usps || "kualitasnya premium dan fungsional banget";

  let mainPost = "";
  let replyPost = "";

  if (req.tone === "VIRAL_STORY") {
    mainPost = `Kirain hal sepele, ternyata efeknya berasa banget pas nemu ${req.productName}. Awalnya kesel karena ${pain}, tapi pas nyoba yang punya ${usp}, langsung ngerasa terbantu parah. Kenapa gak tau dari dulu ya.`;
    replyPost = `Karena banyak banget yang DM minta spill link toko dan nanyain ori atau enggak: aku checkout langsung di official store yang ini ya. Packingnya rapi dan aman, pengirimannya super cepet, plus dapet bonus lengkap sesuai deskripsi. Jangan lupa klaim voucher diskon toko & gratis ongkirnya sebelum checkout mumpung harganya masih promo 👉 ${link}`;
  } else if (req.tone === "HONEST_REVIEW") {
    mainPost = `Udah pake ${req.productName} sekitar semingguan. Jujur ngebantu banget terutama pas ${pain}. Nilai plusnya karena ${usp}. Buat harian ini worth it sih.`;
    replyPost = `Buat teman-teman yang nanya beli di mana: saran aku pastikan beli di official store yang ini ya biar dapet garansi resmi dan kualitas barangnya 100% original. Kemarin pas aku cek ratingnya bintang 5 dengan ribuan review positif. Link checkout toko resminya aku taro di sini ya 👉 ${link}`;
  } else if (req.tone === "PROBLEM_SOLVER") {
    mainPost = `Buat yang sering ngalamin ${pain}, jangan dibiarin berlarut-larut. Solusi paling praktis yang aku temuin sejauh ini ya pakai ${req.productName} ini. Desain dan ${usp} beneran ngerubah rutinitas jadi jauh lebih efisien.`;
    replyPost = `Solusi buat yang punya kendala serupa, mending langsung ambil yang varian ini biar gak gonta-ganti lagi. Kualitas materialnya tebel dan awet banget untuk pemakaian jangka panjang. Cek ketersediaan stok & promo diskon terbarunya langsung di sini ya 👉 ${link}`;
  } else if (req.tone === "URGENT_DEAL") {
    mainPost = `Lagi ada promo kilat buat ${req.productName}! Pas banget buat yang selama ini ngeluh ${pain}. Fitur ${usp} dengan harga segini beneran best deal banget minggu ini.`;
    replyPost = `Info tambahan: vouchernya lagi aktif dan stok flash salenya terbatas banget hari ini. Yang mau dapetin harga termurah plus ekstra gratis ongkir, langsung amankan sebelum harganya kembali normal di link official ini ya 👉 ${link}`;
  } else {
    // CASUAL_CURHAT (Default Threads Style)
    mainPost = `Jujur baru sadar kalau masalah ${pain} tuh kelar cuma pake ini. Kemarin checkout ${req.productName} gara-gara ${usp}, ditaruh meja langsung ngebantu banget tanpa bikin ribet.`;
    replyPost = `Banyak banget yang nanya belinya di mana dan dapet bonus apa aja. Ini aku spill link toko official terpercayanya ya, mumpung lagi ada promo gratis ongkir & diskon kilat. Wajib klaim voucher tokonya dulu pas checkout biar makin hemat 👉 ${link}`;
  }

  return {
    mainPost,
    replyPost,
    characterCount: mainPost.length,
    modelUsed: "smart-template-engine-v1",
  };
}
