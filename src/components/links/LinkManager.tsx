"use client";

import React, { useState, useEffect } from "react";
import {
  Link as LinkIcon,
  Plus,
  Copy,
  Check,
  MousePointerClick,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { getAuthHeaders } from "@/lib/auth";

interface AffiliateLink {
  id: string;
  originalUrl: string;
  shortCode: string;
  platform: string;
  totalClicks: number;
  product: { id: string; name: string; category: string };
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
}

export const LinkManager: React.FC = () => {
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [productId, setProductId] = useState("");
  const [originalUrl, setOriginalUrl] = useState("");
  const [platform, setPlatform] = useState("SHOPEE");
  const [customSlug, setCustomSlug] = useState("");
  const [utmSource, setUtmSource] = useState("threads_curhat");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLinks();
    fetchProducts();
  }, []);

  async function loadLinks() {
    try {
      const res = await fetch("/api/links", { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setLinks(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProducts() {
    try {
      const res = await fetch("/api/products", { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
        if (data.data.length > 0) setProductId(data.data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCreateLink(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || !originalUrl) return;

    setSaving(true);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          productId,
          originalUrl,
          platform,
          customSlug: customSlug || undefined,
          utmSource,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setOriginalUrl("");
        setCustomSlug("");
        loadLinks();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteLink(id: string) {
    if (!confirm("Apakah kamu yakin ingin menghapus link afiliasi ini?")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/links?id=${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        loadLinks();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  }

  function copyShortLink(shortCode: string, id: string) {
    const fullUrl = `${window.location.origin}/r/${shortCode}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-indigo-600" />
            Affiliate Links & Redirect Tracker
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Shortened redirect links with automatic UTM tags and real-time click telemetry.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Tracked Short Link
        </button>
      </div>

      {/* Links Table */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading tracked links...
        </div>
      ) : links.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
          <LinkIcon className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-semibold text-slate-800">No tracked links generated yet</p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Create custom short links with platform tracking to measure conversion on your Threads and X posts.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-4">Product</th>
                  <th className="p-4">Platform</th>
                  <th className="p-4">Tracking Short Link</th>
                  <th className="p-4 text-center">Total Clicks</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {links.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="p-4 font-bold text-slate-900">
                      {l.product?.name || "General Product"}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-700 font-semibold">
                        {l.platform}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-mono text-xs text-indigo-600 font-semibold">
                        /r/{l.shortCode}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <MousePointerClick className="w-3.5 h-3.5 text-pink-500" />
                        {l.totalClicks}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => copyShortLink(l.shortCode, l.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          {copiedId === l.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copy Link
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteLink(l.id)}
                          disabled={deletingId === l.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                          title="Hapus Link"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Link Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-indigo-600" />
                Generate Tracked Short Link
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLink} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Product *
                </label>
                <select
                  required
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination URL *
                </label>
                <input
                  required
                  type="url"
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  placeholder="https://s.shopee.co.id/..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Platform Tag
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                  >
                    <option value="SHOPEE">Shopee</option>
                    <option value="TIKTOK_SHOP">TikTok Shop</option>
                    <option value="TOKOPEDIA">Tokopedia</option>
                    <option value="LAZADA">Lazada</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Custom Slug (Optional)
                  </label>
                  <input
                    type="text"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    placeholder="e.g. botol-2l"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  UTM Source Tag
                </label>
                <input
                  type="text"
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                  placeholder="threads_curhat"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Generate Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
