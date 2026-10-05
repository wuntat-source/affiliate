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
import { checkAuth } from "@/lib/auth";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");
  const [resourceSubTab, setResourceSubTab] = useState<"products" | "links">("products");

  useEffect(() => {
    setIsAuthenticated(checkAuth());
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <AppLayout
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      onLogout={() => setIsAuthenticated(false)}
    >
      {currentTab === "dashboard" && (
        <DashboardOverview onNavigate={(tab) => setCurrentTab(tab)} />
      )}

      {currentTab === "generate" && <AIStudio />}

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

      {currentTab === "settings" && <SettingsManager />}
    </AppLayout>
  );
}
