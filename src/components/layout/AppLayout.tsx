"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  Sparkles,
  Package,
  Link as LinkIcon,
  CalendarClock,
  Users,
  BarChart3,
  Settings,
  Layers,
  Zap,
  LogOut,
  UserCheck,
} from "lucide-react";
import { clearAuthSession } from "@/lib/auth";

export type NavTab =
  | "dashboard"
  | "ai-studio"
  | "products"
  | "links"
  | "queue"
  | "accounts"
  | "analytics"
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

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "ai-studio", label: "AI Content Studio", icon: Sparkles, badge: "AI" },
    { id: "products", label: "Product Catalog", icon: Package },
    { id: "links", label: "Affiliate Links", icon: LinkIcon },
    { id: "queue", label: "Post Queue & Scheduler", icon: CalendarClock },
    { id: "accounts", label: "Social Accounts", icon: Users },
    { id: "analytics", label: "Analytics & Tracking", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  function handleSignOut() {
    clearAuthSession();
    onLogout();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row antialiased">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-xs">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xs">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-tight text-slate-900 flex items-center gap-1.5">
                  AFFILIATEPOST <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-mono font-semibold">AI</span>
                </h1>
                <p className="text-[11px] text-slate-500">Social Media Automation</p>
              </div>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              <Layers className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className={`p-3 space-y-1 ${mobileMenuOpen ? "block" : "hidden md:block"}`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id as NavTab);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-indigo-50 text-indigo-700 border border-indigo-100"
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

        {/* User Account & Logout Footer */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                BM
              </div>
              <div className="leading-tight">
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  Beruangmadu
                </p>
                <p className="text-[10px] text-emerald-600 font-medium">Online</p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
              title="Keluar / Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Workspace
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-slate-800 capitalize">
              {currentTab.replace("-", " ")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onTabChange("ai-studio")}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate Content
            </button>
          </div>
        </header>

        {/* Dynamic View Body */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
