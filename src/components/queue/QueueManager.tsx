"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarClock,
  Send,
  RefreshCw,
  Clock,
  AlertTriangle,
  Pencil,
  Trash2,
  X,
  Save,
} from "lucide-react";
import { formatDate, wibToISOString, isoToWibLocal } from "@/lib/utils";
import { getAuthHeaders } from "@/lib/auth";

interface PostItem {
  id: string;
  mainContent: string;
  replyContent?: string;
  status: "DRAFT" | "SCHEDULED" | "QUEUED" | "PROCESSING" | "PUBLISHED" | "FAILED";
  scheduledAt?: string;
  publishedAt?: string;
  lastError?: string;
  account: { platform: string; username: string };
  product?: { name: string };
}

export const QueueManager: React.FC = () => {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<PostItem | null>(null);
  const [editMain, setEditMain] = useState("");
  const [editReply, setEditReply] = useState("");
  const [editSchedule, setEditSchedule] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPosts();
  }, [filter]);

  async function loadPosts() {
    setLoading(true);
    try {
      const url = filter === "ALL" ? "/api/posts" : `/api/posts?status=${filter}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setPosts(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function openEdit(p: PostItem) {
    setEditingPost(p);
    setEditMain(p.mainContent);
    setEditReply(p.replyContent || "");
    // Tampilkan dalam WIB
    setEditSchedule(p.scheduledAt ? isoToWibLocal(p.scheduledAt) : "");
  }

  async function handleSaveEdit() {
    if (!editingPost) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/posts/${editingPost.id}`, {
        method: "PUT",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          mainContent: editMain,
          replyContent: editReply,
          // Kirim sebagai UTC (input dianggap WIB)
          scheduledAt: editSchedule ? wibToISOString(editSchedule) : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingPost(null);
        loadPosts();
      } else {
        alert(data.error || "Gagal menyimpan perubahan.");
      }
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus postingan ini dari antrean? Tindakan ini tidak bisa dibatalkan.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        loadPosts();
      } else {
        alert(data.error || "Gagal menghapus.");
      }
    } catch (e) {
      console.error(e);
      alert("Gagal menghapus.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handlePublishImmediate(id: string) {
    setPublishingId(id);
    try {
      const res = await fetch(`/api/posts/${id}/publish`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        loadPosts();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPublishingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-indigo-600" />
            Post Queue & Automation Scheduler
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage scheduled curhat drops, background queue states, and manual dispatch triggers.
          </p>
        </div>

        <button
          onClick={loadPosts}
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 border border-slate-200 shadow-xs transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Pipeline
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {["ALL", "SCHEDULED", "PUBLISHED", "DRAFT", "FAILED"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === tab
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading queue pipeline...
        </div>
      ) : posts.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
          <CalendarClock className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-semibold text-slate-800">No posts in this view</p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Use the AI Content Studio to generate curhat copy and add to the scheduler queue.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => {
            const isPublishing = publishingId === p.id;
            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-6 space-y-4 transition-all shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-mono font-bold">
                      {p.account.platform} (@{p.account.username})
                    </span>
                    {p.product && (
                      <span className="text-xs font-medium text-slate-600">
                        Product: <strong className="text-slate-900">{p.product.name}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        p.status === "PUBLISHED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : p.status === "SCHEDULED"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          : p.status === "FAILED"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {p.status}
                    </span>

                    {p.scheduledAt && (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-indigo-600" />
                        {formatDate(p.scheduledAt)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <p className="text-xs text-slate-800 leading-relaxed">{p.mainContent}</p>
                  </div>

                  {p.replyContent && (
                    <div className="pl-4 border-l-2 border-indigo-500">
                      <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-950">
                        <span className="text-indigo-600 font-bold block text-[10px] mb-0.5">
                          Reply #1 (Affiliate Link):
                        </span>
                        {p.replyContent}
                      </div>
                    </div>
                  )}

                  {p.lastError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{p.lastError}</span>
                    </div>
                  )}
                </div>

                {p.status !== "PUBLISHED" && (
                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(p)}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 border border-slate-200 shadow-xs transition-all cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingId === p.id}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold flex items-center gap-2 border border-slate-200 hover:border-rose-200 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {deletingId === p.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      Hapus
                    </button>
                    <button
                      onClick={() => handlePublishImmediate(p.id)}
                      disabled={isPublishing}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isPublishing ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      Publish Immediately
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Edit */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-indigo-600" />
                Edit Postingan
              </h3>
              <button
                onClick={() => setEditingPost(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                  Konten Utama
                </label>
                <textarea
                  value={editMain}
                  onChange={(e) => setEditMain(e.target.value)}
                  rows={5}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                  Balasan / Affiliate Link
                </label>
                <textarea
                  value={editReply}
                  onChange={(e) => setEditReply(e.target.value)}
                  rows={4}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                  Jadwal (kosongkan untuk draft)
                </label>
                <input
                  type="datetime-local"
                  value={editSchedule}
                  onChange={(e) => setEditSchedule(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-slate-100">
              <button
                onClick={() => setEditingPost(null)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving || !editMain.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
