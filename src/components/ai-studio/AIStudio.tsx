"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Send,
  Calendar,
  Copy,
  Check,
  RefreshCw,
  MessageSquare,
  Flame,
  HelpCircle,
  ShoppingBag,
  Sliders,
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

export const AIStudio: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  // Input states
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("Home & Living");
  const [painPoints, setPainPoints] = useState(
    "Sering lupa minum pas kerja di depan laptop sampai pusing dan lemes"
  );
  const [usps, setUsps] = useState(
    "Ada penanda waktu jam, kapasitas besar 2L gak perlu bolak-balik isi ulang"
  );
  const [affiliateUrl, setAffiliateUrl] = useState("https://s.shopee.co.id/contohlink123");
  const [tone, setTone] = useState<"CASUAL_CURHAT" | "VIRAL_STORY" | "PROBLEM_SOLVER" | "HONEST_REVIEW" | "URGENT_DEAL">("CASUAL_CURHAT");

  // Output states
  const [loading, setLoading] = useState(false);
  const [mainPost, setMainPost] = useState(
    "Tiap sore kepala suka kliyengan, kukira stres kerjaan, ternyata cuma dehidrasi gara-gara mager bolak-balik ngisi air. Akhirnya naruh botol 2 liter yang ada penanda jamnya di meja kerja. Tiap lirik jam jadi auto kesentil buat minum. Sekarang pusing hilang, target air harian kelar tanpa drama."
  );
  const [replyPost, setReplyPost] = useState(
    "Yang suka lupa minum pas lagi fokus kerja kayak aku, botolnya bisa cek di sini ya 👉 https://s.shopee.co.id/contohlink123"
  );
  const [copiedMain, setCopiedMain] = useState(false);
  const [copiedReply, setCopiedReply] = useState(false);

  // Queue scheduling state
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [scheduleTime, setScheduleTime] = useState<string>("");
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueSuccessMsg, setQueueSuccessMsg] = useState<string | null>(null);

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

  function handleSelectProduct(id: string) {
    setSelectedProductId(id);
    const found = products.find((p) => p.id === id);
    if (found) {
      setProductName(found.name);
      setCategory(found.category || "General");
      if (found.painPoints) setPainPoints(found.painPoints);
      if (found.usps) setUsps(found.usps);
      if (found.affiliateLinks && found.affiliateLinks.length > 0) {
        setAffiliateUrl(`${window.location.origin}/r/${found.affiliateLinks[0].shortCode}`);
      }
    }
  }

  async function handleGenerate() {
    setLoading(true);
    setQueueSuccessMsg(null);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          category,
          painPoints,
          usps,
          affiliateUrl,
          tone,
          productId: selectedProductId || undefined,
          saveDraft: true,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setMainPost(data.data.mainPost);
        setReplyPost(data.data.replyPost);
      }
    } catch (err) {
      console.error("AI Generation error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleQueuePost(immediate = false) {
    if (!selectedAccountId && accounts.length === 0) {
      try {
        const accRes = await fetch("/api/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform: "THREADS",
            username: "demo_affiliate_creator",
            accountName: "Demo Creator Account",
          }),
        });
        const accData = await accRes.json();
        if (accData.success) {
          setSelectedAccountId(accData.data.id);
          setAccounts([accData.data]);
        }
      } catch (e) {
        console.error(e);
      }
    }

    setQueueLoading(true);
    setQueueSuccessMsg(null);

    try {
      const activeAccId = selectedAccountId || accounts[0]?.id;
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: activeAccId,
          productId: selectedProductId || undefined,
          mainContent: mainPost,
          replyContent: replyPost,
          scheduledAt: immediate ? undefined : scheduleTime || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (immediate) {
          await fetch(`/api/posts/${data.data.id}/publish`, { method: "POST" });
          setQueueSuccessMsg("Post published successfully via instant dispatcher!");
        } else {
          setQueueSuccessMsg("Post successfully scheduled in Queue!");
        }
      }
    } catch (e) {
      console.error("Queue post error:", e);
    } finally {
      setQueueLoading(false);
    }
  }

  const mainPostChars = mainPost.length;
  const isOptimalThreads = mainPostChars <= 350;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          AI Content Studio (Threads Soft-Selling)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Transform product data into high-converting organic curhat stories with automated affiliate reply-threads.
        </p>
      </div>

      {/* Main Grid: Form Inputs & Live Preview Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Generator Config */}
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              Content Parameters
            </h3>
            {products.length > 0 && (
              <select
                value={selectedProductId}
                onChange={(e) => handleSelectProduct(e.target.value)}
                className="bg-slate-50 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 outline-none"
              >
                <option value="">-- Load from Catalog --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Name
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Botol Minum Motivasi 2L"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Health & Fitness"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Affiliate Link / Short URL
                </label>
                <input
                  type="text"
                  value={affiliateUrl}
                  onChange={(e) => setAffiliateUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Keresahan / Pain Points (Relatable Problem)
              </label>
              <textarea
                rows={2}
                value={painPoints}
                onChange={(e) => setPainPoints(e.target.value)}
                placeholder="e.g. Sering lupa minum pas kerja sampai pusing/dehidrasi"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Keunggulan / USPs (Solution)
              </label>
              <textarea
                rows={2}
                value={usps}
                onChange={(e) => setUsps(e.target.value)}
                placeholder="e.g. Ada penanda waktu jam, kapasitas besar 2L"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Writing Persona / Tone
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "CASUAL_CURHAT", label: "Casual Curhat", icon: MessageSquare },
                  { id: "VIRAL_STORY", label: "Viral Story", icon: Flame },
                  { id: "PROBLEM_SOLVER", label: "Problem Solver", icon: HelpCircle },
                  { id: "HONEST_REVIEW", label: "Honest Review", icon: ShoppingBag },
                  { id: "URGENT_DEAL", label: "Urgent Deal", icon: Sparkles },
                ].map((t) => {
                  const Icon = t.icon;
                  const isSelected = tone === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTone(t.id as any)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-50 border-indigo-400 text-indigo-700 font-semibold shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-indigo-600" : "text-slate-400"}`} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !productName}
            className="w-full mt-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating Soft-Selling Story...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Threads Curhat & Reply Link
              </>
            )}
          </button>
        </div>

        {/* Right Col: Live Threads Simulator & Dispatch Actions */}
        <div className="lg:col-span-6 space-y-4">
          {/* Threads Post Simulator Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                <span className="text-xs font-bold text-slate-900 tracking-wider">
                  THREADS POST SIMULATOR
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full ${
                    isOptimalThreads
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {mainPostChars} / 350 chars {isOptimalThreads && "✓ Ideal"}
                </span>
              </div>
            </div>

            {/* Post 1: Main Story */}
            <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white">
                    U
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900">your_username</span>
                    <span className="text-[10px] text-slate-400 ml-1.5">just now</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(mainPost);
                    setCopiedMain(true);
                    setTimeout(() => setCopiedMain(false), 2000);
                  }}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all cursor-pointer"
                  title="Copy main post"
                >
                  {copiedMain ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <textarea
                rows={4}
                value={mainPost}
                onChange={(e) => setMainPost(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-800 leading-relaxed resize-none outline-none border-0 p-0 focus:ring-0"
              />
            </div>

            {/* Post 2: Reply Thread with Link */}
            <div className="relative pl-6 before:content-[''] before:absolute before:left-3 before:top-0 before:bottom-0 before:w-0.5 before:bg-slate-200">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                      U
                    </div>
                    <div>
                      <span className="text-xs font-bold text-indigo-900">your_username</span>
                      <span className="text-[10px] text-indigo-500 ml-1.5">Reply #1 (Affiliate Link)</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(replyPost);
                      setCopiedReply(true);
                      setTimeout(() => setCopiedReply(false), 2000);
                    }}
                    className="p-1.5 rounded-lg bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 transition-all cursor-pointer"
                    title="Copy reply post"
                  >
                    {copiedReply ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <textarea
                  rows={2}
                  value={replyPost}
                  onChange={(e) => setReplyPost(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-800 leading-relaxed resize-none outline-none border-0 p-0 focus:ring-0"
                />
              </div>
            </div>

            {/* Queue & Publish Control Center */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              {queueSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                  {queueSuccessMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Target Account</label>
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
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Schedule For</label>
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
                  onClick={() => handleQueuePost(false)}
                  disabled={queueLoading}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-200 transition-all cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  Add to Post Queue
                </button>
                <button
                  type="button"
                  onClick={() => handleQueuePost(true)}
                  disabled={queueLoading}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Publish Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
