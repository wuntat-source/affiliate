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

  // Playwright Browser Login states
  const [browserUsername, setBrowserUsername] = useState("");
  const [browserPlatform, setBrowserPlatform] = useState<"THREADS" | "TWITTER">("THREADS");
  const [browserLoading, setBrowserLoading] = useState(false);
  const [browserWindowOpen, setBrowserWindowOpen] = useState(false);
  const [verifyingSession, setVerifyingSession] = useState(false);
  const [browserFeedback, setBrowserFeedback] = useState<{ success: boolean; msg: string } | null>(null);

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
        setBrowserFeedback({
          success: false,
          msg: data.error || data.message || "Gagal membuka jendela browser Chromium.",
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
        setIsSandbox(true);
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
            Social Media Accounts (Threads, X / Twitter)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Hubungkan akun Threads kamu langsung via Browser Automation (Playwright) atau gunakan Sandbox Mode tanpa API Token.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          + Tambah Akun Manual / Sandbox
        </button>
      </div>

      {/* Playwright Chromium Browser Login Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900/5 via-violet-900/5 to-purple-900/5 border border-indigo-200/60 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Login Threads via Browser Chromium
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Bypass Token API
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
                Ketik username Threads Anda, klik tombol buka browser, lalu login di jendela Chromium yang muncul. Sesi tersimpan permanen di komputer ini untuk auto-posting.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="flex-1 min-w-[200px] max-w-xs">
            <input
              type="text"
              value={browserUsername}
              onChange={(e) => setBrowserUsername(e.target.value)}
              placeholder="Username Threads (misal: pintulangitketujuh)"
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 font-mono shadow-2xs"
            />
          </div>

          <button
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
              onClick={handleVerifySession}
              disabled={verifyingSession}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50 animate-pulse"
            >
              {verifyingSession ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Memeriksa Sesi Login...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Selesai Login & Simpan Sesi
                </>
              )}
            </button>
          )}
        </div>

        {/* Step Guide if Browser is Open */}
        {browserWindowOpen && (
          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 space-y-1">
            <p className="font-semibold flex items-center gap-1.5 text-indigo-950">
              <Laptop className="w-4 h-4 text-indigo-600" />
              Jendela Google Chrome / Browser telah dibuka di layar Anda!
            </p>
            <p className="text-[11px] text-indigo-800">
              1. Beralih ke jendela browser baru yang muncul di desktop atau taskbar Windows Anda.<br />
              2. Masukkan username & password akun Threads Anda.<br />
              3. Setelah berhasil masuk ke beranda Threads, klik tombol hijau <strong>&quot;Selesai Login &amp; Simpan Sesi&quot;</strong> di atas.
            </p>
          </div>
        )}

        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
          <Laptop className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>
            <strong>Opsi Alternatif:</strong> Anda juga dapat membuka Windows Explorer di folder project ini dan klik ganda file <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono text-[10px]">login-threads.bat</code> untuk login langsung.
          </span>
        </div>

        {browserFeedback && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              browserFeedback.success
                ? "bg-emerald-50 text-emerald-850 border border-emerald-200"
                : "bg-rose-50 text-rose-850 border border-rose-200"
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
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading connected accounts...
        </div>
      ) : accounts.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
          <Users className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-semibold text-slate-800">Belum ada akun sosial media yang terhubung</p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Gunakan form di atas untuk login Threads via Playwright Browser atau tambahkan akun Sandbox untuk mulai menjadwalkan auto-posting.
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
                      className={`flex items-center gap-1 text-[11px] font-semibold ${
                        isSandboxAcc ? "text-amber-600" : "text-emerald-600"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isSandboxAcc ? "SANDBOX" : "BROWSER ACTIVE"}
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500 font-medium"
                >
                  <option value="THREADS">Threads</option>
                  <option value="TWITTER">Twitter / X</option>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="FACEBOOK">Facebook</option>
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
                  placeholder="e.g. Akun Threads Utama"
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
                    ? "Mode aman: simulasi posting tanpa membuka browser Chromium nyata."
                    : "Mode live: posting otomatis langsung ke akun melalui sesi Browser Chromium."}
                </p>
              </div>

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
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Simpan Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
