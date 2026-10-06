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
  Globe,
  ExternalLink,
  Laptop,
  CheckCircle,
  Key,
  ChevronDown,
  ChevronUp,
  Server,
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
}

export const AccountsManager: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Testing states
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<TestStatus | null>(null);

  // Form states
  const [platform, setPlatform] = useState<string>("THREADS");
  const [username, setUsername] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isSandbox, setIsSandbox] = useState(true);
  const [saving, setSaving] = useState(false);

  // Connection mode: COOKIE (default, perfect for VPS & Local) vs BROWSER (GUI)
  const [connectionMode, setConnectionMode] = useState<"COOKIE" | "BROWSER">("COOKIE");

  // Playwright Browser Login states
  const [browserUsername, setBrowserUsername] = useState("pintulangitketujuh");
  const [browserPlatform, setBrowserPlatform] = useState<"THREADS" | "TWITTER">("THREADS");
  const [browserLoading, setBrowserLoading] = useState(false);
  const [browserWindowOpen, setBrowserWindowOpen] = useState(false);
  const [verifyingSession, setVerifyingSession] = useState(false);
  const [browserFeedback, setBrowserFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  // Manual Cookie Import state
  const [manualSessionId, setManualSessionId] = useState("");
  const [savingCookie, setSavingCookie] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  // Auto-poll login status every 2.5s while browser is open
  useEffect(() => {
    let interval: any;
    if (browserWindowOpen && browserUsername.trim()) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/browser-session/status?platform=${browserPlatform}&username=${encodeURIComponent(
              browserUsername.trim()
            )}`,
            { headers: getAuthHeaders() }
          );
          const data = await res.json();
          if (data.loggedIn || data.state === "success") {
            setBrowserWindowOpen(false);
            setBrowserFeedback({
              success: true,
              msg: data.message || "Sesi login berhasil diverifikasi & akun siap digunakan!",
            });
            loadAccounts();
          }
        } catch {}
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [browserWindowOpen, browserUsername, browserPlatform]);

  async function handleLaunchBrowserLogin() {
    if (!browserUsername.trim()) {
      setBrowserFeedback({
        success: false,
        msg: "Harap masukkan username Threads terlebih dahulu!",
      });
      return;
    }

    setBrowserLoading(true);
    setBrowserFeedback(null);

    try {
      const res = await fetch("/api/browser-session/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          platform: browserPlatform,
          username: browserUsername.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setBrowserWindowOpen(true);
        loadAccounts();
        setBrowserFeedback({
          success: true,
          msg: data.message || "Jendela Chromium terbuka. Silakan login ke Threads di jendela tersebut.",
        });
      } else {
        if (data.isHeadlessServer) {
          setConnectionMode("COOKIE");
        }
        setBrowserFeedback({
          success: false,
          msg: data.message || data.error || "Gagal membuka jendela browser Chromium.",
        });
      }
    } catch (err: any) {
      setBrowserFeedback({
        success: false,
        msg: err.message || "Terjadi kesalahan saat membuka browser Chromium.",
      });
    } finally {
      setBrowserLoading(false);
    }
  }

  async function handleVerifySession() {
    if (!browserUsername.trim()) return;

    setVerifyingSession(true);
    setBrowserFeedback(null);

    try {
      const res = await fetch(
        `/api/browser-session/status?platform=${browserPlatform}&username=${encodeURIComponent(
          browserUsername.trim()
        )}`,
        { headers: getAuthHeaders() }
      );

      const data = await res.json();
      if (data.loggedIn) {
        setBrowserWindowOpen(false);
        setBrowserFeedback({
          success: true,
          msg: data.message || "Sesi login berhasil diverifikasi & akun siap digunakan!",
        });
        loadAccounts();
      } else {
        setBrowserFeedback({
          success: false,
          msg: data.message || "Belum terdeteksi login. Pastikan Anda sudah masuk ke beranda Threads di jendela Chromium.",
        });
      }
    } catch (err: any) {
      setBrowserFeedback({
        success: false,
        msg: err.message || "Gagal memverifikasi sesi login.",
      });
    } finally {
      setVerifyingSession(false);
    }
  }

  async function handleSaveManualCookie(e?: React.FormEvent) {
    if (e) e.preventDefault();

    if (!browserUsername.trim()) {
      setBrowserFeedback({
        success: false,
        msg: "Harap masukkan username Threads (misal: pintulangitketujuh)!",
      });
      return;
    }

    if (!manualSessionId.trim()) {
      setBrowserFeedback({
        success: false,
        msg: "Harap masukkan nilai cookie sessionid atau seluruh cookie string!",
      });
      return;
    }

    setSavingCookie(true);
    setBrowserFeedback(null);

    try {
      const res = await fetch("/api/browser-session/save-cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          platform: browserPlatform,
          username: browserUsername.trim(),
          sessionId: manualSessionId.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setBrowserFeedback({
          success: true,
          msg: data.message || "✅ Cookie sesi berhasil disimpan dan akun langsung aktif!",
        });
        setManualSessionId("");
        await loadAccounts();
      } else {
        setBrowserFeedback({
          success: false,
          msg: data.error || "Gagal menyimpan cookie sesi.",
        });
      }
    } catch (err: any) {
      setBrowserFeedback({
        success: false,
        msg: err.message || "Terjadi kesalahan saat menyimpan cookie sesi.",
      });
    } finally {
      setSavingCookie(false);
    }
  }

  async function loadAccounts() {
    try {
      const res = await fetch("/api/accounts", { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setAccounts(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleTestConnection(accId: string, accUsername: string, accPlatform: string) {
    setTestingId(accId);
    setTestStatus(null);
    try {
      const res = await fetch("/api/accounts/test", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ accountId: accId, username: accUsername, platform: accPlatform }),
      });
      const data = await res.json();
      if (data.success) {
        setTestStatus({
          id: accId,
          success: true,
          message: data.message || "Koneksi & status sesi browser aktif!",
          username: data.username,
        });
      } else {
        setTestStatus({
          id: accId,
          success: false,
          message: data.error || "Sesi browser belum aktif.",
        });
      }
    } catch (e: any) {
      setTestStatus({
        id: accId,
        success: false,
        message: e.message || "Terjadi kesalahan saat menguji koneksi sesi browser.",
      });
    } finally {
      setTestingId(null);
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
          accessToken: isSandbox ? "sandbox_mode_mock_token" : "browser_session_auth",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setUsername("");
        setAccountName("");
        loadAccounts();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount(id: string) {
    if (!confirm("Apakah Anda yakin ingin memutuskan / menghapus akun ini?")) return;
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
            Social Media Accounts (Threads, X / Twitter)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Hubungkan akun Threads Anda untuk posting otomatis dengan AI. Mendukung server VPS dan komputer lokal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setLoading(true);
              loadAccounts();
            }}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            title="Refresh Akun"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Tambah Manual / Sandbox
          </button>
        </div>
      </div>

      {/* Main Connection Box with Mode Switcher */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Tab Selector */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setConnectionMode("COOKIE")}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              connectionMode === "COOKIE"
                ? "bg-white text-indigo-700 shadow-xs border border-slate-200/70"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
          >
            <Key className="w-4 h-4 text-indigo-600" />
            <span>Metode 1: Tempel Cookie <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold ml-1">Rekomendasi VPS / Server</span></span>
          </button>

          <button
            type="button"
            onClick={() => setConnectionMode("BROWSER")}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              connectionMode === "BROWSER"
                ? "bg-white text-indigo-700 shadow-xs border border-slate-200/70"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
          >
            <Laptop className="w-4 h-4 text-indigo-600" />
            <span>Metode 2: Buka Browser Otomatis <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold ml-1">Laptop / Windows Lokal</span></span>
          </button>
        </div>

        {/* Tab 1: Cookie Input (VPS / Direct) */}
        {connectionMode === "COOKIE" && (
          <div className="p-5 space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-600" />
                Hubungkan Akun Threads via Cookie sessionid (Instan &amp; Tanpa Layar GUI)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cocok untuk server VPS Linux, Docker, atau komputer lokal. Cukup salin cookie <code className="bg-slate-100 text-indigo-700 font-mono font-bold px-1.5 py-0.5 rounded">sessionid</code> dari browser Anda, akun langsung terhubung dan aktif permanen.
              </p>
            </div>

            {/* Quick 3-Step Guide */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1.5">
              <p className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                Cara Mengambil Cookie sessionid (Hanya 10 Detik):
              </p>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
                <li>Buka <a href="https://www.threads.net" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-semibold">https://www.threads.net</a> di Google Chrome laptop Anda dan pastikan sudah login.</li>
                <li>Tekan tombol <kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono text-[10px] font-bold text-slate-800">F12</kbd> &rarr; Buka tab <strong>Application</strong> (atau <strong>Storage</strong> di Firefox).</li>
                <li>Di menu kiri klik <strong>Cookies</strong> &rarr; <code className="bg-white px-1 rounded font-mono text-[10px]">https://www.threads.net</code> &rarr; Salin nilai kolom <strong>sessionid</strong>.</li>
              </ol>
            </div>

            <form onSubmit={handleSaveManualCookie} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username Threads *
                  </label>
                  <input
                    type="text"
                    value={browserUsername}
                    onChange={(e) => setBrowserUsername(e.target.value)}
                    placeholder="misal: pintulangitketujuh"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nilai Cookie sessionid (atau seluruh cookie string) *
                  </label>
                  <input
                    type="text"
                    value={manualSessionId}
                    onChange={(e) => setManualSessionId(e.target.value)}
                    placeholder="Tempel nilai sessionid di sini (contoh: 78192381290%3AsK12...)"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={savingCookie}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingCookie ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Menyimpan &amp; Menghubungkan...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Simpan &amp; Aktifkan Akun Threads
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Browser Login (Windows / GUI) */}
        {connectionMode === "BROWSER" && (
          <div className="p-5 space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Laptop className="w-4 h-4 text-indigo-600" />
                Login Threads Otomatis via Chromium (Khusus Komputer Lokal Windows)
              </h3>
              <p className="text-xs text-slate-600">
                Ketik username Threads Anda, klik tombol buka browser, lalu lakukan login di jendela browser Chromium yang muncul di desktop Anda.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[220px] max-w-sm">
                <input
                  type="text"
                  value={browserUsername}
                  onChange={(e) => setBrowserUsername(e.target.value)}
                  placeholder="Username Threads (misal: pintulangitketujuh)"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <button
                type="button"
                onClick={handleLaunchBrowserLogin}
                disabled={browserLoading || browserWindowOpen}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {browserLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Membuka Jendela Chromium...
                  </>
                ) : browserWindowOpen ? (
                  <>
                    <Globe className="w-4 h-4 text-emerald-400" />
                    Jendela Browser Terbuka
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4 text-indigo-400" />
                    Buka Browser Login Threads
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </>
                )}
              </button>

              {browserWindowOpen && (
                <button
                  type="button"
                  onClick={handleVerifySession}
                  disabled={verifyingSession}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50 animate-pulse"
                >
                  {verifyingSession ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Memeriksa Sesi...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Selesai Login &amp; Simpan Sesi
                    </>
                  )}
                </button>
              )}
            </div>

            {browserWindowOpen && (
              <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 space-y-1">
                <p className="font-semibold text-indigo-950">
                  Jendela Google Chrome / Chromium telah dibuka di desktop Anda:
                </p>
                <p className="text-[11px] text-indigo-800">
                  1. Masuk ke jendela browser baru yang muncul di desktop Anda.<br />
                  2. Lakukan login ke akun Threads Anda.<br />
                  3. Setelah masuk ke beranda, klik tombol hijau <strong>&quot;Selesai Login &amp; Simpan Sesi&quot;</strong> di atas.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Feedback Alert */}
        {browserFeedback && (
          <div
            className={`p-3.5 mx-5 mb-5 rounded-xl text-xs flex items-center gap-2 ${
              browserFeedback.success
                ? "bg-emerald-50 text-emerald-900 border border-emerald-200 font-medium"
                : "bg-rose-50 text-rose-900 border border-rose-200 font-medium"
            }`}
          >
            {browserFeedback.success ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{browserFeedback.msg}</span>
          </div>
        )}
      </div>

      {/* Accounts Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" /> Memuat daftar akun terhubung...
        </div>
      ) : accounts.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
          <Users className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-semibold text-slate-800">Belum ada akun sosial media yang terhubung</p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Gunakan form di atas (Metode Tempel Cookie atau Buka Browser) untuk menghubungkan akun Threads Anda ke sistem.
          </p>
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
                      className={`flex items-center gap-1 text-[11px] font-bold ${
                        isSandboxAcc ? "text-amber-600" : "text-emerald-600"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isSandboxAcc ? "SANDBOX" : "ACTIVE & TERHUBUNG"}
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
                  <h3 className="text-sm font-bold text-slate-900">{acc.accountName || `@${acc.username}`}</h3>
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
                    onClick={() => handleTestConnection(acc.id, acc.username, acc.platform)}
                    disabled={testingId === acc.id}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {testingId === acc.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    Tes Sesi Browser
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
                Tambah Akun Sosial Media
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500"
                >
                  <option value="THREADS">Threads (Meta)</option>
                  <option value="TWITTER">X / Twitter</option>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="FACEBOOK">Facebook Page</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username Akun *
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: pintulangitketujuh"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Label / Nama Tampilan Akun (Opsional)
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Contoh: Akun Curhat Gadget"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <input
                  type="checkbox"
                  id="sandboxMode"
                  checked={isSandbox}
                  onChange={(e) => setIsSandbox(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="sandboxMode" className="text-xs text-slate-700 cursor-pointer">
                  Mode Simulasi / Sandbox (Tanpa Posting Nyata)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
