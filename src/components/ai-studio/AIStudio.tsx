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
  Wand2,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Users,
  CheckSquare,
  Square,
} from "lucide-react";
import { getAuthHeaders } from "@/lib/auth";

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
  accountName?: string;
}

export const AIStudio: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);

  // Input states - Reset to clean initial values
  const [rawDescription, setRawDescription] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [showExtractor, setShowExtractor] = useState(true);
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("General");
  const [painPoints, setPainPoints] = useState("");
  const [usps, setUsps] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [tone, setTone] = useState<"CASUAL_CURHAT" | "VIRAL_STORY" | "PROBLEM_SOLVER" | "HONEST_REVIEW" | "URGENT_DEAL">("CASUAL_CURHAT");
  const [threadLength, setThreadLength] = useState<number>(1); // 1 = Single Reply, 5 = 5 Parts, 7 = 7 Parts, 10 = 10 Parts

  // Output states
  const [loading, setLoading] = useState(false);
  const [mainPost, setMainPost] = useState("");
  const [replyPost, setReplyPost] = useState("");
  const [threadPosts, setThreadPosts] = useState<string[]>([]);
  const [copiedMain, setCopiedMain] = useState(false);
  const [copiedReply, setCopiedReply] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Queue scheduling state
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [scheduleTime, setScheduleTime] = useState<string>("");
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueSuccessMsg, setQueueSuccessMsg] = useState<string | null>(null);

  // Validation state
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleAutoExtract() {
    if (!rawDescription.trim()) return;
    setExtracting(true);
    setValidationError(null);
    try {
      const res = await fetch("/api/ai/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ rawText: rawDescription }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.productName) setProductName(data.data.productName);
        if (data.data.category) setCategory(data.data.category);
        if (data.data.painPoints) setPainPoints(data.data.painPoints);
        if (data.data.usps) setUsps(data.data.usps);
        if (data.data.suggestedTone) setTone(data.data.suggestedTone);
      }
    } catch (err) {
      console.error("Extraction error:", err);
    } finally {
      setExtracting(false);
    }
  }

  useEffect(() => {
    fetchProducts();
    fetchAccounts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch("/api/products", { headers: getAuthHeaders() });
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
      const res = await fetch("/api/accounts", { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success && data.data) {
        setAccounts(data.data);
        if (data.data.length > 0) {
          setSelectedAccountIds([data.data[0].id]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  function toggleAccount(id: string) {
    setSelectedAccountIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleAllAccounts() {
    if (selectedAccountIds.length === accounts.length) {
      setSelectedAccountIds([]);
    } else {
      setSelectedAccountIds(accounts.map((a) => a.id));
    }
  }

  function handleSelectProduct(id: string) {
    setSelectedProductId(id);
    setValidationError(null);
    const found = products.find((p) => p.id === id);
    if (found) {
      setProductName(found.name);
      setCategory(found.category || "General");
      setPainPoints(found.painPoints || "");
      setUsps(found.usps || "");
      if (found.affiliateLinks && found.affiliateLinks.length > 0) {
        setAffiliateUrl(`${window.location.origin}/r/${found.affiliateLinks[0].shortCode}`);
      }
    }
  }

  async function handleGenerate() {
    setValidationError(null);
    setQueueSuccessMsg(null);

    const missing: string[] = [];
    if (!productName.trim()) missing.push("Nama Produk");
    if (!affiliateUrl.trim()) missing.push("Link Afiliasi");
    if (!painPoints.trim()) missing.push("Keresahan / Pain Points");
    if (!usps.trim()) missing.push("Keunggulan / USPs");

    if (missing.length > 0) {
      setValidationError(`Semua isian wajib diisi sebelum membuat konten! Harap lengkapi: ${missing.join(", ")}.`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          productName,
          category,
          painPoints,
          usps,
          affiliateUrl,
          tone,
          threadLength,
          productId: selectedProductId || undefined,
          saveDraft: true,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setMainPost(data.data.mainPost);
        setReplyPost(data.data.replyPost);
        if (data.data.threadPosts && data.data.threadPosts.length > 0) {
          setThreadPosts(data.data.threadPosts);
        } else {
          setThreadPosts([data.data.mainPost, data.data.replyPost].filter(Boolean));
        }
      }
    } catch (err) {
      console.error("AI Generation error:", err);
      setValidationError("Terjadi kesalahan saat men-generate postingan AI.");
    } finally {
      setLoading(false);
    }
  }

  async function handleQueuePost(immediate = false) {
    setValidationError(null);
    setQueueSuccessMsg(null);

    const effectiveMain = threadPosts.length > 0 ? threadPosts[0] : mainPost;
    const effectiveReply = threadPosts.length > 1 ? threadPosts.slice(1).join("\n\n---\n\n") : replyPost;

    if (!effectiveMain.trim()) {
      setValidationError("Postingan belum dibuat! Harap lengkapi semua isian formulir di sebelah kiri dan klik tombol 'Generate' terlebih dahulu.");
      return;
    }

    if (accounts.length === 0) {
      setValidationError("Belum ada Akun Sosial yang terhubung! Silakan tambahkan akun Threads Anda di menu 'Social Accounts' terlebih dahulu.");
      return;
    }

    const targetIds = selectedAccountIds.length > 0 ? selectedAccountIds : [accounts[0].id];

    setQueueLoading(true);

    let successCount = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < targetIds.length; i++) {
        const accId = targetIds[i];
        const targetAcc = accounts.find((a) => a.id === accId);
        const accLabel = targetAcc ? `@${targetAcc.username}` : `Akun #${i + 1}`;

        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({
            accountId: accId,
            productId: selectedProductId || undefined,
            mainContent: effectiveMain,
            replyContent: effectiveReply,
            scheduledAt: immediate ? undefined : scheduleTime || undefined,
          }),
        });

        const data = await res.json();
        if (data.success) {
          if (immediate) {
            const pubRes = await fetch(`/api/posts/${data.data.id}/publish`, {
              method: "POST",
              headers: getAuthHeaders(),
            });
            const pubData = await pubRes.json();
            if (pubData.success) {
              successCount++;
            } else {
              errors.push(`${accLabel}: ${pubData.error || "Gagal posting"}`);
            }
          } else {
            successCount++;
          }
        } else {
          errors.push(`${accLabel}: ${data.error || "Gagal simpan"}`);
        }
      }

      if (successCount > 0) {
        if (immediate) {
          setQueueSuccessMsg(`✅ Berhasil mempublikasikan postingan dan balasan ke ${successCount} akun Threads!`);
        } else {
          setQueueSuccessMsg(`✅ Berhasil menjadwalkan postingan ke ${successCount} akun target antrean!`);
        }
      }

      if (errors.length > 0) {
        setValidationError(`⚠️ Beberapa akun mengalami kendala: ${errors.join(", ")}`);
      }
    } catch (e: any) {
      console.error("Queue post error:", e);
      setValidationError("Terjadi kegagalan saat mengirim postingan ke server.");
    } finally {
      setQueueLoading(false);
    }
  }

  const mainPostChars = mainPost.length;
  const isOptimalThreads = mainPostChars > 0 && mainPostChars <= 350;

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
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => {
                  setProductName(e.target.value);
                  setValidationError(null);
                }}
                placeholder="e.g. Botol Minum Motivasi 2L"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Affiliate Link / Short URL <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={affiliateUrl}
                onChange={(e) => {
                  setAffiliateUrl(e.target.value);
                  setValidationError(null);
                }}
                placeholder="https://s.shopee.co.id/... atau shortlink"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            {/* Quick Paste & Auto-Extract from Marketplace / Shopee */}
            <div className="bg-linear-to-r from-indigo-50/70 via-purple-50/50 to-pink-50/40 border border-indigo-100/90 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                  Auto-Extract dari Deskripsi Toko / Shopee
                </span>
                <button
                  type="button"
                  onClick={() => setShowExtractor(!showExtractor)}
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  {showExtractor ? "Sembunyikan" : "Buka Ekstraktor"}
                  {showExtractor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {showExtractor && (
                <div className="space-y-2 pt-1">
                  <textarea
                    rows={2}
                    value={rawDescription}
                    onChange={(e) => setRawDescription(e.target.value)}
                    placeholder="Paste judul atau teks deskripsi produk dari Shopee/Tokopedia di sini..."
                    className="w-full bg-white border border-indigo-200/80 rounded-lg p-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={handleAutoExtract}
                    disabled={extracting || !rawDescription.trim()}
                    className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    {extracting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Mengekstrak Keresahan & Keunggulan...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        ✨ Ekstrak Otomatis (Nama, Keresahan, & Keunggulan)
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Keresahan / Pain Points (Relatable Problem) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={painPoints}
                onChange={(e) => {
                  setPainPoints(e.target.value);
                  setValidationError(null);
                }}
                placeholder="e.g. Sering lupa minum pas kerja sampai pusing/dehidrasi"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Keunggulan / USPs (Solution) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={usps}
                onChange={(e) => {
                  setUsps(e.target.value);
                  setValidationError(null);
                }}
                placeholder="e.g. Ada penanda waktu jam, kapasitas besar 2L gak bolak-balik"
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

            {/* Thread Format & Storytelling Length (1 to 10 Part Replies) */}
            <div className="bg-orange-50/50 border border-orange-200/80 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-orange-950 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-600" />
                  Format Cerita / Panjang Balasan Utas
                </label>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                  {threadLength === 1 ? "1 Reply Singkat" : `${threadLength} Balasan Berantai`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Pilih format curhat singkat atau storytelling bersambung 5 - 10 balasan untuk engagement dan konversi klik tertinggi.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {[
                  { length: 1, label: "1 Balasan", desc: "Quick Curhat" },
                  { length: 5, label: "5 Cerita", desc: "Story Arc 5 Part" },
                  { length: 7, label: "7 Cerita", desc: "Deep Narrative" },
                  { length: 10, label: "10 Cerita", desc: "Mega Thread" },
                ].map((item) => {
                  const isSelected = threadLength === item.length;
                  return (
                    <button
                      key={item.length}
                      type="button"
                      onClick={() => setThreadLength(item.length)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-white border-orange-500 text-orange-900 font-bold shadow-xs ring-2 ring-orange-400/20"
                          : "bg-white/70 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="text-xs font-bold">{item.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Validation Alert Notification */}
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{validationError}</div>
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Membuat {threadLength > 1 ? `Utas Cerita ${threadLength} Part...` : "Soft-Selling Story..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>
                  {threadLength > 1
                    ? `Generate Storytelling Utas (${threadLength} Balasan Berantai)`
                    : "Generate Threads Curhat & Reply Link"}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Right Col: Live Threads Simulator & Dispatch Actions */}
        <div className="lg:col-span-6 space-y-4">
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
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {threadPosts.length > 2
                    ? `${threadPosts.length} Chained Posts`
                    : `${mainPostChars} / 350 chars`}
                </span>
              </div>
            </div>

            {/* Dynamic Multi-Part Thread Simulator */}
            {threadPosts.length > 2 ? (
              <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                {threadPosts.map((postText, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === threadPosts.length - 1;
                  const isCopied = copiedIndex === idx;

                  return (
                    <div
                      key={idx}
                      className={`relative pl-6 ${
                        !isLast
                          ? "before:content-[''] before:absolute before:left-3 before:top-4 before:bottom-0 before:w-0.5 before:bg-indigo-200"
                          : ""
                      }`}
                    >
                      <div
                        className={`rounded-xl p-4 space-y-2.5 border transition-all ${
                          isLast
                            ? "bg-orange-50/70 border-orange-200/90 shadow-2xs"
                            : isFirst
                            ? "bg-slate-50 border-slate-200/80"
                            : "bg-indigo-50/40 border-indigo-100"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                                isLast ? "bg-orange-600" : isFirst ? "bg-slate-900" : "bg-indigo-600"
                              }`}
                            >
                              {idx + 1}
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-900">
                                {isFirst
                                  ? "Post Utama (Hook)"
                                  : isLast
                                  ? "Part Akhir (Call-to-Action & Link Afiliasi)"
                                  : `Part ${idx + 1} (Story Arc)`}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(postText);
                              setCopiedIndex(idx);
                              setTimeout(() => setCopiedIndex(null), 2000);
                            }}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all cursor-pointer text-[10px] flex items-center gap-1"
                            title="Copy part"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <textarea
                          rows={3}
                          value={postText}
                          onChange={(e) => {
                            const newArr = [...threadPosts];
                            newArr[idx] = e.target.value;
                            setThreadPosts(newArr);
                            if (idx === 0) setMainPost(e.target.value);
                            else setReplyPost(newArr.slice(1).join("\n\n---\n\n"));
                          }}
                          className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 leading-relaxed resize-none outline-none border-0 p-0 focus:ring-0 font-medium"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
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
                    {mainPost && (
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
                    )}
                  </div>

                  <textarea
                    rows={4}
                    value={mainPost}
                    onChange={(e) => setMainPost(e.target.value)}
                    placeholder="Hasil postingan utama curhat Threads akan muncul di sini setelah kamu klik tombol Generate..."
                    className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 leading-relaxed resize-none outline-none border-0 p-0 focus:ring-0"
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
                      {replyPost && (
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
                      )}
                    </div>

                    <textarea
                      rows={4}
                      value={replyPost}
                      onChange={(e) => setReplyPost(e.target.value)}
                      placeholder="Komentar balasan berisi link afiliasi otomatis akan muncul di sini..."
                      className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 leading-relaxed resize-none outline-none border-0 p-0 focus:ring-0"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Queue & Publish Control Center */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              {queueSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                  {queueSuccessMsg}
                </div>
              )}

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    Target Akun ({selectedAccountIds.length} dari {accounts.length} Dipilih)
                  </label>
                  {accounts.length > 1 && (
                    <button
                      type="button"
                      onClick={toggleAllAccounts}
                      className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      {selectedAccountIds.length === accounts.length ? (
                        <>
                          <CheckSquare className="w-3 h-3" /> Batalkan Semua
                        </>
                      ) : (
                        <>
                          <Square className="w-3 h-3" /> Pilih Semua Akun ({accounts.length})
                        </>
                      )}
                    </button>
                  )}
                </div>

                {accounts.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                    <span>Threads Creator (Sandbox Mode)</span>
                    <span className="text-[10px] font-mono text-amber-600 font-bold">SANDBOX</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {accounts.map((acc) => {
                      const isSelected = selectedAccountIds.includes(acc.id);
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => toggleAccount(acc.id)}
                          className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? "bg-indigo-50/90 border-indigo-300 text-indigo-950 shadow-2xs"
                              : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center text-white text-[10px] shrink-0 ${
                                isSelected ? "bg-indigo-600" : "border border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold leading-tight truncate">@{acc.username}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{acc.platform}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Schedule For (Opsional Jadwal)</label>
                  <input
                    type="datetime-local"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  />
                </div>
              </div>

              {/* Validation Alert Notification on Dispatcher */}
              {validationError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium leading-relaxed">{validationError}</div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleQueuePost(false)}
                  disabled={queueLoading}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  Add to Post Queue {selectedAccountIds.length > 1 && `(${selectedAccountIds.length} Akun)`}
                </button>
                <button
                  type="button"
                  onClick={() => handleQueuePost(true)}
                  disabled={queueLoading}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {queueLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Publishing ke {selectedAccountIds.length} Akun...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Publish Now {selectedAccountIds.length > 1 && `(${selectedAccountIds.length} Akun)`}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
