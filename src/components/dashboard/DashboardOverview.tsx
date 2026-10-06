"use client";

import React, { useState, useEffect } from "react";
import {
  MousePointerClick,
  TrendingUp,
  Users,
  Link as LinkIcon,
  Sparkles,
} from "lucide-react";
import { NavTab } from "../layout/AppLayout";
import { getAuthHeaders } from "@/lib/auth";

interface DashboardStats {
  totalClicks: number;
  clicksToday: number;
  activeAccounts: number;
  linksGenerated: number;
}

export const DashboardOverview: React.FC<{ onNavigate: (tab: NavTab) => void }> = ({
  onNavigate,
}) => {
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly">("daily");
  const [stats, setStats] = useState<DashboardStats>({
    totalClicks: 0,
    clicksToday: 0,
    activeAccounts: 0,
    linksGenerated: 0,
  });

  useEffect(() => {
    fetch("/api/analytics", { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setStats({
            totalClicks: data.data.totalClicks || 0,
            clicksToday: 0,
            activeAccounts: data.data.totalAccounts || 0,
            linksGenerated: data.data.totalLinks || 0,
          });
        }
      })
      .catch(console.error);
  }, []);

  const chartData = [
    { date: "15 Mar", value: 0 },
    { date: "16 Mar", value: 0 },
    { date: "17 Mar", value: 0 },
    { date: "18 Mar", value: 0 },
    { date: "19 Mar", value: 0 },
    { date: "20 Mar", value: 0 },
    { date: "21 Mar", value: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: TOTAL CLICKS */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between space-y-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              TOTAL CLICKS
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shadow-2xs">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.totalClicks}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 italic">
              All-time tracked clicks
            </p>
          </div>
        </div>

        {/* Card 2: CLICKS TODAY */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between space-y-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              CLICKS TODAY
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shadow-2xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-orange-600 tracking-tight">
              {stats.clicksToday}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 italic">
              Since midnight
            </p>
          </div>
        </div>

        {/* Card 3: ACTIVE ACCOUNTS */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between space-y-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              ACTIVE ACCOUNTS
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shadow-2xs">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.activeAccounts}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 italic">
              Managed social accounts
            </p>
          </div>
        </div>

        {/* Card 4: LINKS GENERATED */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between space-y-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              LINKS GENERATED
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shadow-2xs">
              <LinkIcon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.linksGenerated}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 italic">
              Total short links
            </p>
          </div>
        </div>
      </div>

      {/* Main Chart Card: Clicks Over Time */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Chart Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-serif">
              Clicks Over Time
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Last 7 days performance
            </p>
          </div>

          {/* Time range pills */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 self-start sm:self-auto">
            {(["daily", "weekly", "monthly"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setTimeRange(mode)}
                className={`px-3.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  timeRange === mode
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Curve Chart */}
        <div className="relative pt-6 pb-2">
          <div className="relative h-56 w-full flex flex-col justify-between">
            {[100, 75, 50, 25, 0].map((val, idx) => (
              <div key={idx} className="flex items-center gap-4 w-full text-xs text-slate-400 font-mono">
                <span className="w-8 text-right shrink-0">{val}</span>
                <div className="flex-1 border-b border-slate-100 border-dashed" />
              </div>
            ))}

            {/* Empty state overlay if zero clicks */}
            {stats.totalClicks === 0 && (
              <div className="absolute inset-0 pl-12 flex flex-col items-center justify-center bg-white/60 backdrop-blur-2xs">
                <p className="text-xs font-semibold text-slate-600">Belum ada aktivitas klik</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tambahkan produk di Resource Manager dan mulai buat postingan di menu Generate!
                </p>
                <button
                  onClick={() => onNavigate("resource-manager")}
                  className="mt-3 px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  + Tambah Produk Sekarang
                </button>
              </div>
            )}
          </div>

          {/* X Axis Dates */}
          <div className="flex justify-between pl-12 pr-4 pt-3 text-xs text-slate-500 font-mono">
            {chartData.map((d, i) => (
              <span key={i} className="text-center">
                {d.date}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
