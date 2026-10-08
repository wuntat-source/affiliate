"use client";

import React, { useState, useEffect } from "react";
import { AppLayout, NavTab } from "@/components/layout/AppLayout";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { AIStudio } from "@/components/ai-studio/AIStudio";
import { ProductManager } from "@/components/products/ProductManager";
import { LinkManager } from "@/components/links/LinkManager";
import { QueueManager } from "@/components/queue/QueueManager";
import { AccountsManager } from "@/components/accounts/AccountsManager";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { SettingsManager } from "@/components/settings/SettingsManager";
import { ViralReplier } from "@/components/viral-replier/ViralReplier";
import { LoginPage } from "@/components/auth/LoginPage";
import { checkAuth, getCurrentUser, LoggedInUser } from "@/lib/auth";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<LoggedInUser | null>(null);
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");
  const [resourceSubTab, setResourceSubTab] = useState<"products" | "links">("products");

  useEffect(() => {
    const authed = checkAuth();
    setIsAuthenticated(authed);
    if (authed) {
      setCurrentUser(getCurrentUser());
    }
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={() => {
          setIsAuthenticated(true);
          setCurrentUser(getCurrentUser());
        }}
      />
    );
  }

  return (
    <AppLayout
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      onLogout={() => {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }}
    >
      {currentTab === "dashboard" && (
        <DashboardOverview onNavigate={(tab) => setCurrentTab(tab)} />
      )}

      {currentTab === "generate" && <AIStudio onViewQueue={() => setCurrentTab("queue")} />}

      {currentTab === "viral-replier" && <ViralReplier />}

      {currentTab === "history" && <AnalyticsView />}

      {currentTab === "resource-manager" && (
        <div className="space-y-6">
          <div className="flex gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setResourceSubTab("products")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                resourceSubTab === "products"
                  ? "bg-orange-500 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
              }`}
            >
              Product Catalog
            </button>
            <button
              onClick={() => setResourceSubTab("links")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                resourceSubTab === "links"
                  ? "bg-orange-500 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
              }`}
            >
              Affiliate Links
            </button>
          </div>

          {resourceSubTab === "products" ? (
            <ProductManager onGenerateForProduct={() => setCurrentTab("generate")} />
          ) : (
            <LinkManager />
          )}
        </div>
      )}

      {currentTab === "auto-poster" && <AccountsManager />}

      {currentTab === "queue" && <QueueManager />}

      {currentTab === "settings" &&
        (currentUser?.role === "ADMIN" ? (
          <SettingsManager />
        ) : (
          <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center max-w-lg mx-auto mt-10 space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
              🔒
            </div>
            <h3 className="font-bold text-base text-slate-800">Akses Terbatas</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Hanya akun dengan hak akses <span className="font-semibold text-orange-600">ADMIN</span> yang dapat melihat dan mengatur konfigurasi sistem, API key, serta data user.
            </p>
            <button
              onClick={() => setCurrentTab("dashboard")}
              className="mt-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              Kembali ke Dashboard
            </button>
          </div>
        ))}
    </AppLayout>
  );
}
