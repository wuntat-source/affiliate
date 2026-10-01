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
import { LoginPage } from "@/components/auth/LoginPage";
import { checkAuth } from "@/lib/auth";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");

  useEffect(() => {
    setIsAuthenticated(checkAuth());
  }, []);

  // Avoid hydration flicker
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
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
      {currentTab === "ai-studio" && <AIStudio />}
      {currentTab === "products" && (
        <ProductManager
          onGenerateForProduct={() => {
            setCurrentTab("ai-studio");
          }}
        />
      )}
      {currentTab === "links" && <LinkManager />}
      {currentTab === "queue" && <QueueManager />}
      {currentTab === "accounts" && <AccountsManager />}
      {currentTab === "analytics" && <AnalyticsView />}
      {currentTab === "settings" && <SettingsManager />}
    </AppLayout>
  );
}
