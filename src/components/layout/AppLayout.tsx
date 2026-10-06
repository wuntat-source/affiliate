"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Sparkles,
  Flame,
  History,
  Users,
  CalendarClock,
  Settings,
  LogOut,
  Sun,
  RotateCw,
  AlertCircle,
  Layers,
} from "lucide-react";
import { clearAuthSession, getCurrentUser, LoggedInUser } from "@/lib/auth";

export type NavTab =
  | "dashboard"
  | "resource-manager"
  | "generate"
  | "viral-replier"
  | "history"
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<LoggedInUser | null>(null);

  React.useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "auto-poster", label: "Social Accounts", icon: Users },
    { id: "resource-manager", label: "Resource Manager", icon: FolderKanban },
    { id: "generate", label: "Generate", icon: Sparkles },
    { id: "viral-replier", label: "Viral Replier", icon: Flame, badge: "Viral" },
    { id: "history", label: "History", icon: History },
    { id: "queue", label: "Queue", icon: CalendarClock },
    { id: "settings", label: "Settings", icon: Settings, adminOnly: true },
  ];

  const visibleNavItems = navItems.filter(
    (item) => !item.adminOnly || currentUser?.role === "ADMIN"
  );

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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row antialiased font-sans">
      {/* Left Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-xs">
        <div>
          {/* Logo Header */}
          <div className="p-5 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-base tracking-tight text-slate-900 flex items-center gap-1">
                  Affiliate<span className="text-orange-500">Claw</span>
                </h1>
                <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono">
                  Viral Generator
                </p>
              </div>
            </div>

            {/* Mobile toggle button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              <Layers className="w-5 h-5" />
            </button>
          </div>

          {/* Nav List */}
          <nav className={`p-3 space-y-1 mt-1 ${mobileMenuOpen ? "block" : "hidden md:block"}`}>
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id as NavTab);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                    isActive
                      ? "bg-orange-50 text-orange-600 border-l-4 border-orange-500 shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-orange-500" : "text-slate-400"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded font-mono ${
                        isActive
                          ? "bg-orange-500 text-white"
                          : "bg-orange-100 text-orange-700 border border-orange-200"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar info */}
        <div className="p-4 space-y-3">
          <div className="p-3.5 rounded-xl bg-orange-50/60 border border-orange-200/60 text-[11px] text-slate-600 leading-relaxed flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
            <p>
              Configure your <span className="text-slate-900 font-semibold">Gemini/OpenAI</span> API key and Shopee credentials in backend settings.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-xs border border-orange-200 shrink-0">
                {currentUser?.name
                  ? currentUser.name.slice(0, 2).toUpperCase()
                  : currentUser?.username
                  ? currentUser.username.slice(0, 2).toUpperCase()
                  : "BM"}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {currentUser?.name || currentUser?.username || "Beruangmadu"}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {currentUser?.role === "ADMIN" ? "Admin" : "User"}
                </p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer shrink-0 ml-1"
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
        <header className="px-8 py-5 flex items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-20 shadow-xs">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-serif capitalize">
              {currentTab === "auto-poster"
                ? "Social Accounts"
                : currentTab === "viral-replier"
                ? "Viral Replier (Popular Posts)"
                : currentTab.replace("-", " ")}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentTab === "dashboard" && "Track clicks, monitor performance, and optimize your affiliate strategy."}
              {currentTab === "resource-manager" && "Manage product catalog, pain points, USPs, and tracked affiliate short links."}
              {currentTab === "generate" && "Transform product data into high-converting organic curhat stories with automated reply links."}
              {currentTab === "viral-replier" && "Balas postingan Threads / X yang sedang viral dengan komentar bernilai tinggi berisi link afiliasi."}
              {currentTab === "history" && "View past posts, telemetry logs, and conversion performance."}
              {currentTab === "auto-poster" && "Hubungkan dan kelola akun Threads, Instagram, Facebook, dan X untuk auto-posting."}
              {currentTab === "queue" && "Monitor scheduled posts, background queues, and instant publication."}
              {currentTab === "settings" && "Configure AI API keys, Meta developer tokens, and automation settings."}
            </p>
          </div>

          {/* Action buttons on the top right */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRefresh}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer shadow-xs"
              title="Refresh Data"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-orange-500" : ""}`} />
            </button>
            <button
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer shadow-xs"
              title="Theme Toggle"
            >
              <Sun className="w-4 h-4 text-amber-500" />
            </button>
          </div>
        </header>

        {/* Dynamic View Body */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
