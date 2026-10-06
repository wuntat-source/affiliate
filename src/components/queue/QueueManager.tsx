"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarClock,
  Send,
  RefreshCw,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
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

  useEffect(() => {
    loadPosts();
  }, [filter]);

  async function loadPosts() {
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
                  <div className="pt-2 flex justify-end">
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
    </div>
  );
};
