"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  Sparkles,
  History,
  Settings,
  FolderKanban,
  Send,
  CalendarClock,
  LogOut,
  Moon,
  Sun,
  RotateCw,
  Flame,
  AlertCircle,
} from "lucide-react";
import { clearAuthSession } from "@/lib/auth";

export type NavTab =
  | "dashboard"
  | "generate"
  | "history"
  | "resource-manager"
  | "auto-poster"
  | "queue"
  | "settings";

interface AppLayoutProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentTab,
  onTabChange,
  onLogout,
  children,
}) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "generate", label: "Generate", icon: Sparkles },
    { id: "history", label: "History", icon: History },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "resource-manager", label: "Resource Manager", icon: FolderKanban },
    { id: "auto-poster", label: "Auto-Poster", icon: Send },
    { id: "queue", label: "Queue", icon: CalendarClock },
  ];

  function handleRefresh() {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 400);
  }

  function handleSignOut() {
    clearAuthSession();
    onLogout();
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col md:flex-row antialiased font-sans">
      {/* Left Sidebar */}
      <aside className="w-full md:w-64 bg-[#0d1322] border-r border-slate-800/80 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Header */}
          <div className="p-6 flex items-center gap-3 border-b border-slate-800/60">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1">
                Affiliate<span className="text-orange-500">Post</span>
              </h1>
              <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase font-mono">
                Viral Generator
              </p>
            </div>
          </div>

          {/* Nav List */}
          <nav className="p-3 space-y-1.5 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id as NavTab)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left relative ${
                    isActive
                      ? "bg-[#161f36] text-orange-400 shadow-md border-l-4 border-orange-500"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#121a2e]"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-orange-400" : "text-slate-500"
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar info */}
        <div className="p-4 space-y-3">
          <div className="p-3.5 rounded-xl bg-[#11192e] border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
            <p>
              Configure your <span className="text-slate-200 font-medium">Gemini/OpenAI</span> API key and Shopee credentials in backend settings.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-xs border border-orange-500/30">
                BM
              </div>
              <span className="text-xs font-semibold text-slate-300">Beruangmadu</span>
            </div>

            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="px-8 py-6 flex items-center justify-between border-b border-slate-800/60 bg-[#090d16]/80 backdrop-blur-md sticky top-0 z-20">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white font-serif">
              Analytics Dashboard
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Track clicks, monitor performance, and optimize your affiliate strategy.
            </p>
          </div>

          {/* Action buttons on the top right */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRefresh}
              className="w-9 h-9 rounded-xl bg-[#121a2e] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Refresh Data"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-orange-400" : ""}`} />
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-9 h-9 rounded-xl bg-[#121a2e] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Toggle Theme"
            >
              {isDarkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
          </div>
        </header>

        {/* Dynamic View Body */}
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
