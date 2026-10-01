"use client";

import React, { useState, useEffect } from "react";
import {
  MousePointerClick,
  TrendingUp,
  Users,
  Link as LinkIcon,
} from "lucide-react";
import { NavTab } from "../layout/AppLayout";

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
    totalClicks: 910,
    clicksToday: 165,
    activeAccounts: 10,
    linksGenerated: 237,
  });

  const chartData = [
    { date: "15 Mar", value: 12 },
    { date: "16 Mar", value: 38 },
    { date: "17 Mar", value: 45 },
    { date: "18 Mar", value: 190 },
    { date: "19 Mar", value: 85 },
    { date: "20 Mar", value: 345 },
    { date: "21 Mar", value: 110 },
  ];

  return (
    <div className="space-y-6">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: TOTAL CLICKS */}
        <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between space-y-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              TOTAL CLICKS
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#2a1711] border border-orange-500/30 flex items-center justify-center text-orange-500 shadow-xs">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white tracking-tight">
              {stats.totalClicks}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 italic">
              All-time tracked clicks
            </p>
          </div>
        </div>

        {/* Card 2: CLICKS TODAY */}
        <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between space-y-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              CLICKS TODAY
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#2a1711] border border-orange-500/30 flex items-center justify-center text-orange-500 shadow-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-orange-500 tracking-tight">
              {stats.clicksToday}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 italic">
              Since midnight
            </p>
          </div>
        </div>

        {/* Card 3: ACTIVE ACCOUNTS */}
        <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between space-y-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              ACTIVE ACCOUNTS
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#2a1711] border border-orange-500/30 flex items-center justify-center text-orange-500 shadow-xs">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white tracking-tight">
              {stats.activeAccounts}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 italic">
              Managed social accounts
            </p>
          </div>
        </div>

        {/* Card 4: LINKS GENERATED */}
        <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between space-y-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              LINKS GENERATED
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#2a1711] border border-orange-500/30 flex items-center justify-center text-orange-500 shadow-xs">
              <LinkIcon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white tracking-tight">
              {stats.linksGenerated}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 italic">
              Total short links
            </p>
          </div>
        </div>
      </div>

      {/* Main Chart Card: Clicks Over Time */}
      <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Chart Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white font-serif">
              Clicks Over Time
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Last 7 days performance
            </p>
          </div>

          {/* Time range pills */}
          <div className="inline-flex p-1 rounded-xl bg-[#090d16] border border-slate-800 self-start sm:self-auto">
            {(["daily", "weekly", "monthly"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setTimeRange(mode)}
                className={`px-3.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  timeRange === mode
                    ? "bg-[#161f36] text-white shadow-xs border border-slate-700"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Curve Chart */}
        <div className="relative pt-6 pb-2">
          {/* Y Axis Grid lines & labels */}
          <div className="relative h-64 w-full flex flex-col justify-between">
            {[380, 285, 190, 95, 0].map((val, idx) => (
              <div key={idx} className="flex items-center gap-4 w-full text-xs text-slate-500 font-mono">
                <span className="w-8 text-right shrink-0">{val}</span>
                <div className="flex-1 border-b border-slate-800/40 border-dashed" />
              </div>
            ))}

            {/* Render Smooth SVG Wave */}
            <div className="absolute inset-x-0 bottom-0 top-0 pl-12 pr-4 pointer-events-none">
              <svg
                viewBox="0 0 700 240"
                preserveAspectRatio="none"
                className="w-full h-full overflow-visible"
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="glow" />
                    <feComposite in="SourceGraphic" in2="glow" operator="over" />
                  </filter>
                </defs>

                {/* Area under curve */}
                <path
                  d="M 0 230 C 60 220, 80 205, 116 205 C 160 205, 180 195, 233 195 C 280 195, 310 110, 350 110 C 390 110, 430 175, 466 175 C 510 175, 540 25, 583 25 C 630 25, 660 160, 700 160 L 700 240 L 0 240 Z"
                  fill="url(#chartGradient)"
                />

                {/* Main Curve Line */}
                <path
                  d="M 0 230 C 60 220, 80 205, 116 205 C 160 205, 180 195, 233 195 C 280 195, 310 110, 350 110 C 390 110, 430 175, 466 175 C 510 175, 540 25, 583 25 C 630 25, 660 160, 700 160"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="3.5"
                  filter="url(#glow)"
                />

                {/* Points on curve */}
                {[
                  { cx: 0, cy: 230 },
                  { cx: 116, cy: 205 },
                  { cx: 233, cy: 195 },
                  { cx: 350, cy: 110 },
                  { cx: 466, cy: 175 },
                  { cx: 583, cy: 25 },
                  { cx: 700, cy: 160 },
                ].map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.cx}
                    cy={pt.cy}
                    r="4.5"
                    className="fill-indigo-300 stroke-[#0f172a] stroke-2"
                  />
                ))}
              </svg>
            </div>
          </div>

          {/* X Axis Dates */}
          <div className="flex justify-between pl-12 pr-4 pt-3 text-xs text-slate-400 font-mono">
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
