import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export interface AIContentRequest {
  productName: string;
  category?: string;
  painPoints?: string;
  usps?: string;
  affiliateUrl?: string;
  tone?: "CASUAL_CURHAT" | "VIRAL_STORY" | "PROBLEM_SOLVER" | "HONEST_REVIEW" | "URGENT_DEAL";
  threadLength?: number; // 1 for single reply, or 5, 7, 10 for multi-reply storytelling
  targetPlatform?: "THREADS" | "TWITTER" | "INSTAGRAM";
  apiKey?: string;
  provider?: "gemini" | "openai";
}

export interface AIContentResponse {
  mainPost: string;
  replyPost: string;
  threadPosts?: string[]; // Array of chained posts: [Post #1, Reply #1, Reply #2, ..., Final Link Reply]
  characterCount: number;
  modelUsed: string;
}

const TONE_PROMPTS: Record<string, string> = {
  CASUAL_CURHAT: `
Gaya: Soft-selling curhat Threads santai sehari-hari.
Sudut pandang: Orang pertama ("aku").
`,
  VIRAL_STORY: `
Gaya: Hook kuat, storytelling cepat, dan emosional/penasaran.
`,
  PROBLEM_SOLVER: `
Gaya: Problem-Agitate-Solution to-the-point.
`,
  HONEST_REVIEW: `
Gaya: Review jujur setelah pemakaian rutin. Highlight plus & minus santai.
`,
  URGENT_DEAL: `
Gaya: Info diskon/promo kilat tanpa terlihat spammy.
`,
};

export async function generateSocialContent(req: AIContentRequest): Promise<AIContentResponse> {
  const tone = req.tone || "CASUAL_CURHAT";
  const toneGuideline = TONE_PROMPTS[tone] || TONE_PROMPTS.CASUAL_CURHAT;
  const affiliateLink = req.affiliateUrl || "{link_afiliasi}";
  const threadCount = req.threadLength && req.threadLength > 1 ? req.threadLength : 1;

  const isMultiThread = threadCount >= 3;

  const systemInstruction = isMultiThread
    ? `Kamu adalah copywriter Threads & Twitter/X spesialis "Mega-Thread Storytelling Berantai" (Utas Panjang ${threadCount} Postingan).
Tugasmu: Menulis sebuah cerita/curhat berantai sebanyak PERSIS ${threadCount} postingan yang bersambung dari awal sampai akhir.

Struktur ${threadCount} Postingan:
- Post #1 (Hook Utama): Pembuka yang bikin sangat penasaran, emosional, atau relatable ("Sebuah utas...", "Gak nyangka hal sepele ini...").
- Post #2 sampai #${threadCount - 1} (Story Arc): Cerita kronologis mendalam (masa sulit/keresahan memuncak -> pencarian solusi & kegagalan coba cara lain -> momen menemukan ${req.productName} -> pengalaman nyata & transformasi positif setelah memakai).
- Post #${threadCount} (Final Call-to-Action & Affiliate Link): Spill toko official terpercaya, jaminan keaslian/garansi, tips klaim promo/voucher gratis ongkir, dan sematkan link checkout: ${affiliateLink}.

${toneGuideline}

Wajib berikan output HANYA dalam format JSON valid berikut tanpa markdown formatting tambahan:
{
  "thread_posts": [
    "Teks Postingan #1 (Hook)",
    "Teks Postingan #2 (Keresahan mendalam)",
    ...
    "Teks Postingan #${threadCount} (Spill toko official & link ${affiliateLink})"
  ]
}`
    : `Kamu adalah copywriter profesional spesialis social media marketing & affiliate conversion untuk platform Threads dan Twitter/X.
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
- Link Afiliasi: ${affiliateLink}
- Target Panjang Utas: ${threadCount} Postingan Berantai`;

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

      if (isMultiThread && Array.isArray(parsed.thread_posts) && parsed.thread_posts.length > 0) {
        const posts: string[] = parsed.thread_posts;
        const mainPost = posts[0] || "";
        const replyPost = posts.slice(1).join("\n\n---\n\n");
        return {
          mainPost,
          replyPost,
          threadPosts: posts,
          characterCount: mainPost.length,
          modelUsed: "gemini-1.5-flash",
        };
      }

      return {
        mainPost: parsed.post_utama || "",
        replyPost: parsed.post_balasan || "",
        threadPosts: [parsed.post_utama, parsed.post_balasan].filter(Boolean),
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
        if (isMultiThread && Array.isArray(parsed.thread_posts) && parsed.thread_posts.length > 0) {
          const posts: string[] = parsed.thread_posts;
          const mainPost = posts[0] || "";
          const replyPost = posts.slice(1).join("\n\n---\n\n");
          return {
            mainPost,
            replyPost,
            threadPosts: posts,
            characterCount: mainPost.length,
            modelUsed: "gpt-4o-mini",
          };
        }

        return {
          mainPost: parsed.post_utama || "",
          replyPost: parsed.post_balasan || "",
          threadPosts: [parsed.post_utama, parsed.post_balasan].filter(Boolean),
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
  const threadCount = req.threadLength && req.threadLength > 1 ? req.threadLength : 1;

  if (threadCount >= 3) {
    const threadPosts: string[] = [];

    // Part 1: Hook Pembuka
    threadPosts.push(
      `[1/${threadCount}] Sebuah utas singkat: Gak nyangka masalah sepele kayak ${pain} yang udah bikin pusing berbulan-bulan ternyata solusinya sesimpel ini. Simak ceritanya sampai akhir, siapa tahu kalian ngalamin hal yang sama 👇`
    );

    // Part 2: Background / Keresahan Awal
    threadPosts.push(
      `[2/${threadCount}] Jadi awalnya aku kira masalah ini wajar dialami semua orang. Tiap hari selalu berulang, capek sendiri, dan ngerasa buang waktu banget. Sampai di titik ngerasa harus cari solusi biar gak stres terus.`
    );

    // Part 3: Percobaan & Kegagalan
    threadPosts.push(
      `[3/${threadCount}] Sebelum nemu solusi yang pas, aku udah sempat coba beberapa opsi lain yang harganya murah tapi ujung-ujungnya zonk dan cepat rusak. Malah buang-buang uang dua kali.`
    );

    // Part 4: Momen Penemuan
    threadPosts.push(
      `[4/${threadCount}] Sampai akhirnya beberapa waktu lalu gak sengaja nemu rekomendasi tentang ${req.productName}. Awalnya skeptis, tapi pas baca ulasan orang-orang yang bilang ${usp}, aku beraniin buat checkout.`
    );

    if (threadCount >= 7) {
      // Part 5: Unboxing & First Impression
      threadPosts.push(
        `[5/${threadCount}] Pas barangnya sampai, first impression-nya beneran di luar ekspektasi. Materialnya kokoh, finishing rapi, dan semua kelengkapannya dikirim lengkap tanpa cacat.`
      );
      // Part 6: Real Life Testing
      threadPosts.push(
        `[6/${threadCount}] Pas dicoba pakai buat aktivitas harian, efeknya langsung berasa. Masalah ${pain} yang tadinya bikin ribet, sekarang kelar dalam hitungan menit. Hidup jadi jauh lebih praktis.`
      );
    }

    if (threadCount >= 10) {
      // Part 7: Comparison & Value
      threadPosts.push(
        `[7/${threadCount}] Kalau dihitung-hitung secara value, ini jauh lebih hemat dibanding beli barang murah yang bolak-balik rusak. Investasi kecil tapi manfaatnya berasa tiap hari.`
      );
      // Part 8: Feedback Lingkungan
      threadPosts.push(
        `[8/${threadCount}] Bahkan teman-teman yang sempat main dan nyobain juga pada nanya beli di mana karena mereka ngerasain sendiri kepraktisannya.`
      );
      // Part 9: Insight & Tips
      threadPosts.push(
        `[9/${threadCount}] Pelajaran pentingnya: untuk kebutuhan esensial, jangan ragu pilih yang berkualitas. Beneran bikin mood dan produktivitas harian meningkat drastis.`
      );
    }

    // Final Post: Call to Action & Affiliate Link
    threadPosts.push(
      `[${threadCount}/${threadCount}] Buat yang nanya spill link toko officialnya: aku checkout di toko resmi yang ini ya. Packing aman, garansi original 100%, dan lagi ada promo gratis ongkir + diskon voucher. Langsung cek di sini sebelum kehabisan 👉 ${link}`
    );

    // Adjust numbering in case threadCount was custom
    const finalPosts = threadPosts.slice(0, threadCount);
    // Ensure the last one always has the affiliate link
    finalPosts[finalPosts.length - 1] = `[${finalPosts.length}/${finalPosts.length}] Buat yang nanya spill link toko officialnya: aku checkout di toko resmi yang ini ya. Packing aman, garansi original 100%, dan lagi ada promo gratis ongkir + diskon voucher. Langsung cek di sini sebelum kehabisan 👉 ${link}`;

    const mainPost = finalPosts[0];
    const replyPost = finalPosts.slice(1).join("\n\n---\n\n");

    return {
      mainPost,
      replyPost,
      threadPosts: finalPosts,
      characterCount: mainPost.length,
      modelUsed: "smart-storytelling-engine-v1",
    };
  }

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
    threadPosts: [mainPost, replyPost],
    characterCount: mainPost.length,
    modelUsed: "smart-template-engine-v1",
  };
}
