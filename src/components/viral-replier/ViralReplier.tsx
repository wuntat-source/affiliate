"use client";

import React, { useState, useEffect } from "react";
import {
  Flame,
  Sparkles,
  Send,
  Calendar,
  Copy,
  Check,
  RefreshCw,
  MessageCircle,
  ExternalLink,
  HelpCircle,
  Zap,
  TrendingUp,
  Sliders,
  CheckCircle2,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  painPoints?: string;
  usps?: string;
  affiliateLinks?: Array<{ id: string; shortCode: string; originalUrl: string }>;
}

interface Account {
  id: string;
  platform: string;
  username: string;
}

interface ViralTargetHistory {
  id: string;
  targetUrl: string;
  targetExcerpt: string;
  replyContent: string;
  productName: string;
  status: "POSTED" | "SCHEDULED";
  createdAt: string;
}

export const ViralReplier: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");

  // Input states
  const [targetPostUrl, setTargetPostUrl] = useState("");
  const [targetPostContent, setTargetPostContent] = useState(
    "Lagi capek banget sama rutinitas kerja akhir-akhir ini, duduk seharian di depan laptop kepala sering kliyengan dan badan pegel-pegel. Ada tips gak biar tetap fit pas kerja?"
  );
  const [productName, setProductName] = useState("");
  const [productUsp, setProductUsp] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [replyStyle, setReplyStyle] = useState<"RELATABLE_CURHAT" | "HELPFUL_HACK" | "HUMOROUS_CHILL" | "DIRECT_SPILL">("RELATABLE_CURHAT");

  // Output states
  const [loading, setLoading] = useState(false);
  const [generatedReply, setGeneratedReply] = useState("");
  const [hookExplanation, setHookExplanation] = useState("");
  const [copied, setCopied] = useState(false);

  // Target Account & Schedule
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [postingLoading, setPostingLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // History state
  const [historyList, setHistoryList] = useState<ViralTargetHistory[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchAccounts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.success && data.data) {
        setProducts(data.data);
        if (data.data.length > 0) {
          handleSelectProduct(data.data[0].id, data.data);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchAccounts() {
    try {
      const res = await fetch("/api/accounts");
      const data = await res.json();
      if (data.success && data.data) {
        setAccounts(data.data);
        if (data.data.length > 0) {
          setSelectedAccountId(data.data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  function handleSelectProduct(id: string, list = products) {
    setSelectedProductId(id);
    const found = list.find((p) => p.id === id);
    if (found) {
      setProductName(found.name);
      setProductUsp(found.usps || "Praktis dan fungsional");
      if (found.affiliateLinks && found.affiliateLinks.length > 0) {
        setAffiliateUrl(`${window.location.origin}/r/${found.affiliateLinks[0].shortCode}`);
      }
    }
  }

  async function handleGenerateReply() {
    if (!productName) return;
    setLoading(true);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/viral-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetPostUrl,
          targetPostContent,
          productName,
          productUsp,
          affiliateUrl,
          replyStyle,
        }),
      });

      const result = await res.json();
      if (result.success && result.data) {
        setGeneratedReply(result.data.replyText);
        setHookExplanation(result.data.hookExplanation);
      }
    } catch (err) {
      console.error("Viral reply generate error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePostReply(isImmediate = true) {
    if (!generatedReply) return;
    setPostingLoading(true);
    setSuccessMessage(null);

    try {
      const activeAccId = selectedAccountId || accounts[0]?.id;
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: activeAccId,
          productId: selectedProductId || undefined,
          mainContent: `[Reply to: ${targetPostUrl || "Popular Post"}]\n${generatedReply}`,
          scheduledAt: isImmediate ? undefined : scheduleTime || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (isImmediate) {
          await fetch(`/api/posts/${data.data.id}/publish`, { method: "POST" });
          setSuccessMessage("🚀 Balasan berhasil diposting ke thread populer!");
        } else {
          setSuccessMessage("✅ Balasan berhasil dijadwalkan di antrean!");
        }

        const newHistory: ViralTargetHistory = {
          id: data.data.id || String(Date.now()),
          targetUrl: targetPostUrl || "https://threads.net/@creator/post/viral123",
          targetExcerpt: targetPostContent.slice(0, 60) + "...",
          replyContent: generatedReply,
          productName,
          status: isImmediate ? "POSTED" : "SCHEDULED",
          createdAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        };

        setHistoryList([newHistory, ...historyList]);
      }
    } catch (e) {
      console.error("Post reply error:", e);
    } finally {
      setPostingLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border border-orange-200/80 rounded-2xl p-6 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-600 text-xs font-bold font-mono">
            <Flame className="w-3.5 h-3.5" />
            VIRAL THREAD HIJACK & POPULAR REPLIER
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-serif">
            Posting Balasan ke Postingan Populer / Trending
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Dapatkan ribuan impresi dan klik organik gratis dengan membalas postingan Threads / X yang sedang ramai dengan komentar curhat solutif yang menyematkan link afiliasimu.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Target & Product */}
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            Target Postingan Populer
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Link URL Postingan Threads / X yang Ramai
              </label>
              <input
                type="url"
                value={targetPostUrl}
                onChange={(e) => setTargetPostUrl(e.target.value)}
                placeholder="https://www.threads.net/@username/post/..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-orange-500 outline-none transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Topik / Isi Postingan yang Sedang Dibahas *
              </label>
              <textarea
                rows={3}
                value={targetPostContent}
                onChange={(e) => setTargetPostContent(e.target.value)}
                placeholder="Contoh: Capek banget seharian duduk depan laptop kepala pusing..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-orange-500 outline-none transition-all"
              />
            </div>

            {/* Product Mapping */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Produk Afiliasi yang Dipromosikan
                </label>
                {products.length > 0 && (
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleSelectProduct(e.target.value)}
                    className="bg-slate-50 text-slate-700 text-xs px-2.5 py-1 rounded-lg border border-slate-200 outline-none font-medium"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Nama produk"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={affiliateUrl}
                    onChange={(e) => setAffiliateUrl(e.target.value)}
                    placeholder="Link Afiliasi (https://...)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Gaya Balasan Komentar (Reply Tone)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "RELATABLE_CURHAT", label: "Relatable & Empati", icon: MessageCircle },
                    { id: "HELPFUL_HACK", label: "Helpful Lifehack", icon: Zap },
                    { id: "HUMOROUS_CHILL", label: "Humor & Santai", icon: Flame },
                    { id: "DIRECT_SPILL", label: "Direct Spill", icon: Sparkles },
                  ].map((s) => {
                    const Icon = s.icon;
                    const isSelected = replyStyle === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setReplyStyle(s.id as any)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? "bg-orange-50 border-orange-400 text-orange-700 font-semibold shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-orange-500" : "text-slate-400"}`} />
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerateReply}
              disabled={loading || !productName}
              className="w-full mt-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Menganalisis & Meracik Komentar Viral...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Balasan Komentar Viral
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Reply Simulator & Publisher */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-900 tracking-wider flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-orange-500" />
                SIMULASI BALASAN DI THREAD POPULER
              </span>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">
                {generatedReply.length} Chars
              </span>
            </div>

            {/* Target Post Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700">
                  VP
                </div>
                <span className="text-xs font-bold text-slate-900">viral_creator_account</span>
                <span className="text-[10px] text-slate-400">• Postingan Populer</span>
              </div>
              <p className="text-xs text-slate-700 italic leading-relaxed">
                &ldquo;{targetPostContent}&rdquo;
              </p>
            </div>

            {/* Reply Preview Box */}
            <div className="relative pl-6 before:content-[''] before:absolute before:left-3 before:top-0 before:bottom-0 before:w-0.5 before:bg-orange-300">
              <div className="bg-orange-50/50 border border-orange-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-bold">
                      YOU
                    </div>
                    <span className="text-xs font-bold text-orange-950">
                      {accounts[0]?.username ? `@${accounts[0].username}` : "@your_account"}
                    </span>
                    <span className="text-[10px] text-orange-700 font-semibold px-1.5 py-0.2 rounded bg-orange-100">
                      Balasan Afiliasi
                    </span>
                  </div>

                  {generatedReply && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedReply);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="p-1 rounded-lg bg-white border border-orange-200 hover:bg-orange-100 text-orange-700 transition-all cursor-pointer"
                      title="Salin Komentar"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                <textarea
                  rows={3}
                  value={generatedReply}
                  onChange={(e) => setGeneratedReply(e.target.value)}
                  placeholder="Komentar balasan yang natural dan berkonversi tinggi akan muncul di sini..."
                  className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 leading-relaxed resize-none outline-none border-0 p-0 focus:ring-0 font-medium"
                />

                {hookExplanation && (
                  <p className="text-[11px] text-orange-700 bg-white/80 p-2 rounded-lg border border-orange-100 leading-snug">
                    💡 <strong>Hook Strategi:</strong> {hookExplanation}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Gunakan Akun
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  >
                    {accounts.length === 0 ? (
                      <option value="">Threads Creator (Sandbox Active)</option>
                    ) : (
                      accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.platform} (@{acc.username})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Jadwalkan Balasan (Opsional)
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handlePostReply(false)}
                  disabled={postingLoading || !generatedReply}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Calendar className="w-3.5 h-3.5 text-orange-500" />
                  Jadwalkan Balasan
                </button>
                <button
                  type="button"
                  onClick={() => handlePostReply(true)}
                  disabled={postingLoading || !generatedReply}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  Kirim Balasan Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Target History Table */}
      {historyList.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <Flame className="w-4 h-4 text-orange-500" />
            Riwayat Balasan Thread Populer
          </h3>

          <div className="space-y-3">
            {historyList.map((h) => (
              <div
                key={h.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {h.productName}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                      {h.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">
                    &ldquo;{h.replyContent}&rdquo;
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Target: {h.targetExcerpt}
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 font-mono shrink-0">
                  {h.createdAt}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
