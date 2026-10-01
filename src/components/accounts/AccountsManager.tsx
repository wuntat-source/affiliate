"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

interface Account {
  id: string;
  platform: string;
  accountName: string;
  username: string;
  status: "ACTIVE" | "EXPIRED" | "RATE_LIMITED" | "DISCONNECTED";
  _count?: { posts: number };
}

export const AccountsManager: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [platform, setPlatform] = useState<string>("THREADS");
  const [username, setUsername] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [isSandbox, setIsSandbox] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    try {
      const res = await fetch("/api/accounts");
      const data = await res.json();
      if (data.success) {
        setAccounts(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!username) return;

    setSaving(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          username,
          accountName: accountName || username,
          accessToken: isSandbox ? "sandbox_mode_mock_token" : accessToken,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setUsername("");
        setAccountName("");
        setAccessToken("");
        loadAccounts();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Social Media Accounts
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Connect Threads Graph API, Twitter/X API, or use Sandbox simulation mode.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Connect Social Account
        </button>
      </div>

      {/* Accounts Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading connected accounts...
        </div>
      ) : accounts.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
          <Users className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-semibold text-slate-800">No social accounts connected</p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Connect your Threads or Twitter/X account (or use built-in Sandbox mode) to begin automated publishing.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 shadow-xs space-y-4 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-mono font-bold">
                  {acc.platform}
                </span>
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {acc.status}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">{acc.accountName}</h3>
                <p className="text-xs text-slate-500 font-mono">@{acc.username}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Total Posts:</span>
                <span className="font-bold text-slate-900">{acc._count?.posts || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Connect Social Media Account
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value="THREADS">Threads (Meta Graph API)</option>
                  <option value="TWITTER">Twitter / X (API v2)</option>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="TIKTOK">TikTok</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username (@handle) *
                </label>
                <input
                  required
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. affiliate_daily_vibes"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. Curhat Review Harian"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Sandbox / Safe Test Mode
                  </span>
                  <input
                    type="checkbox"
                    checked={isSandbox}
                    onChange={(e) => setIsSandbox(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  {isSandbox
                    ? "Posts will be safely simulated without requiring live Meta API keys."
                    : "Live mode requires official API Access Token."}
                </p>
              </div>

              {!isSandbox && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    API Access Token
                  </label>
                  <input
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="EAAX..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              )}

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Connect Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
