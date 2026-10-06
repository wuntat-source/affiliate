"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Zap,
  AlertCircle,
  Check,
} from "lucide-react";
import { getAuthHeaders } from "@/lib/auth";

interface Account {
  id: string;
  platform: string;
  accountName: string;
  username: string;
  status: "ACTIVE" | "EXPIRED" | "RATE_LIMITED" | "DISCONNECTED";
  accessToken?: string;
  _count?: { posts: number };
}

interface TestStatus {
  id: string;
  success: boolean;
  message: string;
  username?: string;
  metaUserId?: string;
}

export const AccountsManager: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Testing states
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<TestStatus | null>(null);
  const [modalTesting, setModalTesting] = useState(false);
  const [modalTestMsg, setModalTestMsg] = useState<{ success: boolean; text: string } | null>(null);

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
      const res = await fetch("/api/accounts", { headers: getAuthHeaders() });
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

  async function handleTestConnection(accId: string) {
    setTestingId(accId);
    setTestStatus(null);
    try {
      const res = await fetch("/api/accounts/test", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ accountId: accId }),
      });
      const data = await res.json();
      if (data.success) {
        setTestStatus({
          id: accId,
          success: true,
          message: data.message || "Koneksi berhasil diverifikasi!",
          username: data.username,
        });
      } else {
        setTestStatus({
          id: accId,
          success: false,
          message: data.error || "Gagal menghubungi server Meta Threads.",
        });
      }
    } catch (e: any) {
      setTestStatus({
        id: accId,
        success: false,
        message: e.message || "Terjadi kesalahan saat menguji koneksi.",
      });
    } finally {
      setTestingId(null);
    }
  }

  async function handleTestModalToken() {
    if (!accessToken.trim()) return;
    setModalTesting(true);
    setModalTestMsg(null);
    try {
      const res = await fetch("/api/accounts/test", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ accessToken, platform }),
      });
      const data = await res.json();
      if (data.success) {
        setModalTestMsg({
          success: true,
          text: data.message || `Token Valid! Terhubung ke @${data.username || "Threads"}`,
        });
      } else {
        setModalTestMsg({
          success: false,
          text: data.error || "Token tidak valid atau izin Threads belum aktif.",
        });
      }
    } catch (e: any) {
      setModalTestMsg({
        success: false,
        text: e.message || "Gagal menguji token.",
      });
    } finally {
      setModalTesting(false);
    }
  }

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!username) return;

    setSaving(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
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
        setIsSandbox(true);
        setModalTestMsg(null);
        loadAccounts();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount(id: string) {
    if (!confirm("Apakah kamu yakin ingin memutuskan/menghapus akun sosial ini?")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/accounts?id=${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        loadAccounts();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Social Media Accounts (Threads, IG & Facebook)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Hubungkan akun Threads (Meta Graph API), Instagram, Facebook, atau gunakan Sandbox Mode untuk auto-posting.
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddModal(true);
            setModalTestMsg(null);
          }}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          + Connect Social Account
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
          <p className="text-xs font-semibold text-slate-800">Belum ada akun sosial media yang terhubung</p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Hubungkan akun Threads, Instagram, atau Facebook kamu (atau gunakan mode Sandbox) untuk mulai menjadwalkan auto-posting.
          </p>
          <button
            onClick={() => {
              setShowAddModal(true);
              setModalTestMsg(null);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tambah Akun Threads / IG Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const isSandboxAcc = !acc.accessToken || acc.accessToken === "sandbox_mode_mock_token";
            const currentTest = testStatus?.id === acc.id ? testStatus : null;

            return (
              <div
                key={acc.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 shadow-xs space-y-3.5 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-mono font-bold">
                    {acc.platform}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex items-center gap-1 text-[11px] font-semibold ${
                        isSandboxAcc ? "text-amber-600" : "text-emerald-600"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isSandboxAcc ? "SANDBOX" : "LIVE ACTIVE"}
                    </span>
                    <button
                      onClick={() => handleDeleteAccount(acc.id)}
                      disabled={deletingId === acc.id}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                      title="Putuskan Akun"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">{acc.accountName}</h3>
                  <p className="text-xs text-slate-500 font-mono">@{acc.username}</p>
                </div>

                {/* Test Feedback Banner */}
                {currentTest && (
                  <div
                    className={`p-2.5 rounded-xl text-xs leading-relaxed ${
                      currentTest.success
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}
                  >
                    {currentTest.message}
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleTestConnection(acc.id)}
                    disabled={testingId === acc.id}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {testingId === acc.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    Tes Koneksi
                  </button>

                  <span className="text-[11px] text-slate-500 font-medium">
                    {acc._count?.posts || 0} posts terbit
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Hubungkan Akun Sosial Media
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Platform Sosial Media *
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500 font-medium"
                >
                  <option value="THREADS">Threads (Meta Graph API)</option>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="FACEBOOK">Facebook</option>
                  <option value="TWITTER">Twitter / X (API v2)</option>
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
                  placeholder="e.g. adminmbalap"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Tampilan Akun (Display Name)
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. Edogawa Threads Utama"
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
                    className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  {isSandbox
                    ? "Mode aman: simulasi posting tanpa memerlukan live token developer resmi Meta."
                    : "Mode live: posting otomatis langsung ke server resmi Meta Threads menggunakan Access Token."}
                </p>
              </div>

              {!isSandbox && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Meta API Access Token *
                  </label>
                  <div className="flex gap-2">
                    <input
                      required
                      type="password"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="EAAX..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleTestModalToken}
                      disabled={modalTesting || !accessToken.trim()}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {modalTesting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                      )}
                      Tes Token
                    </button>
                  </div>

                  {modalTestMsg && (
                    <div
                      className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                        modalTestMsg.success
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-rose-50 text-rose-800 border border-rose-200"
                      }`}
                    >
                      {modalTestMsg.success ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      )}
                      <span>{modalTestMsg.text}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Hubungkan Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
