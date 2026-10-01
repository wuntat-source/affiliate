"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  MousePointerClick,
  Send,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

export const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Performance & Conversion Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track affiliate traffic generation, post conversions, and engagement across all channels.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading analytics data...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Total Affiliate Clicks</span>
              <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
                <MousePointerClick className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900">{data?.totalClicks || 0}</p>
            <p className="text-[11px] text-slate-500">Captured via real-time telemetry</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Published Threads</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900">{data?.publishedPosts || 0}</p>
            <p className="text-[11px] text-slate-500">With 1st-reply link chaining</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Active Product Catalog</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900">{data?.totalProducts || 0}</p>
            <p className="text-[11px] text-slate-500">Ready for automated rotation</p>
          </div>
        </div>
      )}
    </div>
  );
};
