"use client";

import React, { useState, useEffect } from "react";
import {
  MousePointerClick,
  TrendingUp,
  Users,
  Link as LinkIcon,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Package,
  Calendar,
  Send,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { NavTab } from "../layout/AppLayout";
import { getAuthHeaders } from "@/lib/auth";

interface ChartPoint {
  date: string;
  day: string;
  value: number;
}

interface TopLink {
  id: string;
  shortCode: string;
  originalUrl: string;
  platform: string;
  totalClicks: number;
  product?: { name: string; category?: string };
}

interface DashboardData {
  totalClicks: number;
  clicksToday: number;
  totalAccounts: number;
  totalLinks: number;
  totalProducts: number;
  publishedPosts: number;
  scheduledPosts: number;
  chartTrend: ChartPoint[];
  topLinks: TopLink[];
}

export const DashboardOverview: React.FC<{ onNavigate: (tab: NavTab) => void }> = ({
  onNavigate,
}) => {
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData>({
    totalClicks: 0,
    clicksToday: 0,
    totalAccounts: 0,
    totalLinks: 0,
    totalProducts: 0,
    publishedPosts: 0,
    scheduledPosts: 0,
    chartTrend: [],
    topLinks: [],
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics", { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success && json.data) {
        setData({
          totalClicks: json.data.totalClicks || 0,
          clicksToday: json.data.clicksToday || 0,
          totalAccounts: json.data.totalAccounts || 0,
          totalLinks: json.data.totalLinks || 0,
          totalProducts: json.data.totalProducts || 0,
          publishedPosts: json.data.publishedPosts || 0,
          scheduledPosts: json.data.scheduledPosts || 0,
          chartTrend: Array.isArray(json.data.chartTrend) ? json.data.chartTrend : [],
          topLinks: Array.isArray(json.data.topLinks) ? json.data.topLinks : [],
        });
      }
    } catch (err) {
      console.error("[Dashboard Load Error]:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleCopyLink(shortCode: string) {
    const fullUrl = `${window.location.origin}/r/${shortCode}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedCode(shortCode);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  // Compute max value for chart scaling
  const maxChartVal = Math.max(...data.chartTrend.map((p) => p.value), 20);

  return (
    <div className="space-y-6">
      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL CLICKS */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              TOTAL CLICKS
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? "..." : data.totalClicks.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Akumulasi klik link afiliasi
            </p>
          </div>
        </div>

        {/* Card 2: CLICKS TODAY */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              CLICKS HARI INI
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">
              {loading ? "..." : data.clicksToday.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Traffic 24 jam terakhir
            </p>
          </div>
        </div>

        {/* Card 3: ACTIVE ACCOUNTS */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              AKUN AKTIF
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {loading ? "..." : data.totalAccounts}
              </span>
              {data.totalAccounts > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Ready
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Threads Browser Session
            </p>
          </div>
        </div>

        {/* Card 4: LINKS GENERATED */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              TOTAL LINK AKTIF
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
              <LinkIcon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? "..." : data.totalLinks}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Shopee & Marketplace tracked URLs
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Performance Chart & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Clicks Trend Chart */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                Tren Klik Afiliasi (7 Hari Terakhir)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Statistik performa kunjungan link dari postingan Threads & Twitter.
              </p>
            </div>
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* Bar / Column Visualizer */}
          <div className="space-y-4">
            <div className="h-48 flex items-end justify-between gap-3 pt-4 px-2 border-b border-slate-100">
              {data.chartTrend.map((point, idx) => {
                const heightPercent = maxChartVal > 0 ? (point.value / maxChartVal) * 100 : 0;
                const isToday = idx === data.chartTrend.length - 1;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-mono font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      {point.value}
                    </span>
                    <div className="w-full max-w-[42px] bg-slate-100 rounded-t-lg relative flex items-end overflow-hidden h-full">
                      <div
                        style={{ height: `${Math.max(heightPercent, 8)}%` }}
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          isToday
                            ? "bg-gradient-to-t from-orange-600 to-amber-400 shadow-xs"
                            : "bg-gradient-to-t from-indigo-600/80 to-indigo-400/80 group-hover:from-indigo-600 group-hover:to-indigo-500"
                        }`}
                      />
                    </div>
                    <div className="text-center pt-1">
                      <span className="block text-[10px] font-bold text-slate-700">{point.day}</span>
                      <span className="block text-[9px] text-slate-400 font-mono whitespace-nowrap">
                        {point.date}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Quick Launchpad & Shortcut Center */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Akses Cepat (Quick Actions)
            </h3>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => onNavigate("generate")}
                className="w-full p-3 rounded-xl bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-100 text-left flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-950 group-hover:text-indigo-600">
                      AI Studio (Buat Utas)
                    </h4>
                    <p className="text-[10px] text-slate-500">Generate curhat & publish ke Threads</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate("resource-manager")}
                className="w-full p-3 rounded-xl bg-orange-50/70 hover:bg-orange-100/80 border border-orange-100 text-left flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-orange-950 group-hover:text-orange-600">
                      Katalog & Link Afiliasi
                    </h4>
                    <p className="text-[10px] text-slate-500">Kelola produk Shopee & shortlinks</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-orange-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate("auto-poster")}
                className="w-full p-3 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-100 text-left flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 group-hover:text-emerald-600">
                      Social Accounts
                    </h4>
                    <p className="text-[10px] text-slate-500">Cek status koneksi @pintulangitketujuh</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Links Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-indigo-600" />
              Top Produk & Link Afiliasi Terlaris
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Daftar link shortener yang menghasilkan konversi klik terbanyak.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("resource-manager")}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer flex items-center gap-1"
          >
            Lihat Semua Link &rarr;
          </button>
        </div>

        {data.topLinks.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Belum ada link afiliasi yang dibuat.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.topLinks.map((link) => {
              const isCopied = copiedCode === link.shortCode;

              return (
                <div
                  key={link.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 rounded-xl px-2.5 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <LinkIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                        {link.product?.name || "Produk Afiliasi"}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                        <span className="text-indigo-600 font-semibold">/r/{link.shortCode}</span>
                        <span>&bull;</span>
                        <span className="truncate max-w-[200px] text-slate-400">{link.originalUrl}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-orange-600 font-mono">
                        {link.totalClicks || 0} Klik
                      </span>
                      <span className="block text-[9px] text-slate-400 uppercase font-mono">
                        {link.platform}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(link.shortCode)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
                      title="Salin Short URL"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-semibold">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
