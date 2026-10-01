"use client";

import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  MousePointerClick,
  Send,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Package,
  Layers,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { NavTab } from "../layout/AppLayout";

interface DashboardStats {
  totalProducts: number;
  totalLinks: number;
  totalPosts: number;
  publishedPosts: number;
  scheduledPosts: number;
  failedPosts: number;
  totalClicks: number;
  topLinks: Array<{
    id: string;
    shortCode: string;
    totalClicks: number;
    platform: string;
    product: { name: string };
  }>;
}

export const DashboardOverview: React.FC<{ onNavigate: (tab: NavTab) => void }> = ({
  onNavigate,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.data);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-800 text-white p-6 md:p-8 shadow-xs">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-indigo-100 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            AI Soft-Selling Engine Ready
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Automate Affiliate Curhat Posts on Threads & X
          </h2>
          <p className="text-xs md:text-sm text-indigo-100 leading-relaxed">
            Convert Shopee, TikTok Shop & Tokopedia products into natural daily stories. Auto-post with scheduled reply link-threads and track every click in real-time.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate("ai-studio")}
              className="px-4 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Open AI Content Studio
            </button>
            <button
              onClick={() => onNavigate("products")}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/20 transition-all cursor-pointer"
            >
              Manage Catalog
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Total Affiliate Clicks</span>
            <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {stats?.totalClicks ?? 0}
          </p>
          <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" /> Real-time telemetry tracking
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Posts Published</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {stats?.publishedPosts ?? 0}
          </p>
          <span className="text-[11px] text-slate-500">
            Across Threads & X accounts
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Scheduled in Queue</span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {stats?.scheduledPosts ?? 0}
          </p>
          <span className="text-[11px] text-indigo-600 font-medium">
            Automated BullMQ worker ready
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Active Products</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {stats?.totalProducts ?? 0}
          </p>
          <span className="text-[11px] text-slate-500">
            {stats?.totalLinks ?? 0} Short affiliate links
          </span>
        </div>
      </div>

      {/* Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Clicked Links */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-pink-500" />
              Top Performing Affiliate Links
            </h3>
            <button
              onClick={() => onNavigate("links")}
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-semibold"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {stats?.topLinks && stats.topLinks.length > 0 ? (
            <div className="space-y-2">
              {stats.topLinks.map((link) => (
                <div
                  key={link.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between hover:bg-slate-100/80 transition-all"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800">{link.product.name}</p>
                    <p className="text-[11px] font-mono text-indigo-600">/r/{link.shortCode}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900">{link.totalClicks}</span>
                    <span className="text-[10px] text-slate-500 block">clicks</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
              No link clicks recorded yet. Generate your first post in the AI Studio!
            </div>
          )}
        </div>

        {/* Automation Status */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <Layers className="w-4 h-4 text-indigo-600" />
            System Automation Status
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <div>
                  <p className="text-xs font-semibold text-slate-800">Threads Graph Publisher</p>
                  <p className="text-[10px] text-slate-500">Auto-reply container chaining</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono font-semibold border border-emerald-200">
                READY
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-indigo-600" />
                <div>
                  <p className="text-xs font-semibold text-slate-800">BullMQ Scheduler Worker</p>
                  <p className="text-[10px] text-slate-500">Async delayed job processor</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-semibold border border-indigo-200">
                ACTIVE
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-violet-600" />
                <div>
                  <p className="text-xs font-semibold text-slate-800">Gemini & OpenAI Fallback</p>
                  <p className="text-[10px] text-slate-500">Multi-tone soft-selling templates</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-violet-50 text-violet-700 font-mono font-semibold border border-violet-200">
                ONLINE
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
