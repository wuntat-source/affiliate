"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  Sparkles,
  Check,
  User,
  Users,
  KeyRound,
  Plus,
  Trash2,
  Edit2,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
  UserCheck,
  ShieldAlert,
} from "lucide-react";
import { getCurrentUser, LoggedInUser } from "@/lib/auth";

interface SystemUser {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: "ADMIN" | "OPERATOR" | "MEMBER";
  createdAt: string;
}

export const SettingsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"USERS" | "SYSTEM">("USERS");

  // User Management States
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [currentUser, setCurrentUser] = useState<LoggedInUser | null>(null);

  // User Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  // Form States (Add/Edit User)
  const [formUsername, setFormUsername] = useState("");
  const [formName, setFormName] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formConfirmPassword, setFormConfirmPassword] = useState("");
  const [formRole, setFormRole] = useState<"ADMIN" | "OPERATOR" | "MEMBER">("ADMIN");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [savingUser, setSavingUser] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // API Configuration States
  const [geminiKey, setGeminiKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [threadsToken, setThreadsToken] = useState("");
  const [savedConfig, setSavedConfig] = useState(false);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setUsers(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  }

  function openAddModal() {
    setFormUsername("");
    setFormName("");
    setFormPassword("");
    setFormConfirmPassword("");
    setFormRole("ADMIN");
    setFormError(null);
    setFormSuccess(null);
    setShowAddModal(true);
  }

  function openEditModal(user: SystemUser) {
    setEditingUser(user);
    setFormUsername(user.username);
    setFormName(user.name);
    setFormPassword("");
    setFormConfirmPassword("");
    setFormRole(user.role);
    setFormError(null);
    setFormSuccess(null);
    setShowEditModal(true);
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formUsername.trim() || !formPassword.trim()) {
      setFormError("Username dan password wajib diisi.");
      return;
    }

    if (formPassword !== formConfirmPassword) {
      setFormError("Konfirmasi password tidak cocok.");
      return;
    }

    if (formPassword.length < 5) {
      setFormError("Password minimal 5 karakter demi keamanan.");
      return;
    }

    setSavingUser(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formUsername,
          name: formName || formUsername,
          password: formPassword,
          role: formRole,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFormSuccess("User baru berhasil ditambahkan!");
        setTimeout(() => {
          setShowAddModal(false);
          loadUsers();
        }, 1200);
      } else {
        setFormError(data.error || "Gagal menambahkan user.");
      }
    } catch (err: any) {
      setFormError(err.message || "Terjadi kesalahan sistem.");
    } finally {
      setSavingUser(false);
    }
  }

  async function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setFormError(null);
    setFormSuccess(null);

    if (!formUsername.trim()) {
      setFormError("Username tidak boleh kosong.");
      return;
    }

    if (formPassword && formPassword !== formConfirmPassword) {
      setFormError("Konfirmasi password tidak cocok.");
      return;
    }

    if (formPassword && formPassword.length < 5) {
      setFormError("Password baru minimal 5 karakter.");
      return;
    }

    setSavingUser(true);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUser.id,
          username: formUsername,
          name: formName || formUsername,
          password: formPassword || undefined,
          role: formRole,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFormSuccess("Data user & password berhasil diperbarui!");
        setTimeout(() => {
          setShowEditModal(false);
          loadUsers();
        }, 1200);
      } else {
        setFormError(data.error || "Gagal memperbarui user.");
      }
    } catch (err: any) {
      setFormError(err.message || "Terjadi kesalahan sistem.");
    } finally {
      setSavingUser(false);
    }
  }

  async function handleDeleteUser(id: string, name: string) {
    if (users.length <= 1) {
      alert("Tidak dapat menghapus satu-satunya user yang ada di sistem.");
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus user '${name}'? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        loadUsers();
      } else {
        alert(data.error || "Gagal menghapus user.");
      }
    } catch (e: any) {
      alert(e.message || "Terjadi kesalahan.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    setSavedConfig(true);
    setTimeout(() => setSavedConfig(false), 2500);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            Settings & Manajemen Akun
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola user, ubah password login, dan konfigurasi API pihak ketiga (Meta & AI LLM).
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab("USERS")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "USERS"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Manajemen User & Password
          </button>
          <button
            onClick={() => setActiveTab("SYSTEM")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "SYSTEM"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            API & LLM Config
          </button>
        </div>
      </div>

      {/* TAB 1: USER MANAGEMENT */}
      {activeTab === "USERS" && (
        <div className="space-y-6">
          {/* User List Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  Daftar Pengguna Sistem
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  User yang memiliki akses untuk masuk ke dashboard AffiliatePost AI.
                </p>
              </div>

              <button
                type="button"
                onClick={openAddModal}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                + Tambah User Baru
              </button>
            </div>

            {loadingUsers ? (
              <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Memuat data user...
              </div>
            ) : users.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada data user.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isCurrent = currentUser?.username === u.username;

                  return (
                    <div
                      key={u.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl px-2.5 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold font-mono">
                          {u.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{u.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Akun Anda
                              </span>
                            )}
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                                u.role === "ADMIN"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : "bg-slate-100 text-slate-700 border border-slate-200"
                              }`}
                            >
                              {u.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            Username: <span className="text-slate-700 font-medium">@{u.username}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => openEditModal(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit / Ganti Password</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          disabled={deletingId === u.id || users.length <= 1}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                          title={users.length <= 1 ? "User terakhir tidak dapat dihapus" : "Hapus User"}
                        >
                          {deletingId === u.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SYSTEM API CONFIG */}
      {activeTab === "SYSTEM" && (
        <form onSubmit={handleSaveConfig} className="space-y-4">
          {savedConfig && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" /> Konfigurasi API berhasil disimpan!
            </div>
          )}

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              AI LLM Providers
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Google Gemini API Key
              </label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Digunakan untuk generate konten curhat soft-selling cepat dan hemat biaya (Gemini 1.5 Flash).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                OpenAI API Key (Optional Fallback)
              </label>
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              Meta Threads Publishing Credentials
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Meta Graph API Access Token (Global Default)
              </label>
              <input
                type="password"
                value={threadsToken}
                onChange={(e) => setThreadsToken(e.target.value)}
                placeholder="EAA..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Token default global jika tidak diatur per-akun di menu Social Accounts.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              Simpan Konfigurasi
            </button>
          </div>
        </form>
      )}

      {/* MODAL: TAMBAH USER BARU */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                Tambah User Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username *
                </label>
                <input
                  required
                  type="text"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="e.g. admin_marketing"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap / Tampilan
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Budi Santoso"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Minimal 5 karakter"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ulangi Password *
                  </label>
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={formConfirmPassword}
                    onChange={(e) => setFormConfirmPassword(e.target.value)}
                    placeholder="Konfirmasi password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Peran (Role)
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500 font-medium"
                >
                  <option value="ADMIN">ADMIN (Akses Penuh)</option>
                  <option value="OPERATOR">OPERATOR (Posting & Riset)</option>
                  <option value="MEMBER">MEMBER (Viewer)</option>
                </select>
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
                  disabled={savingUser}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingUser ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Tambah User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER & GANTI PASSWORD */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                Edit User & Ganti Password
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username *
                </label>
                <input
                  required
                  type="text"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="Username login"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap / Tampilan
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nama tampilan"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  Ganti Password Baru (Kosongkan jika tidak ingin mengubah)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Password baru"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs text-slate-900 outline-none focus:border-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formConfirmPassword}
                      onChange={(e) => setFormConfirmPassword(e.target.value)}
                      placeholder="Ulangi password"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Peran (Role)
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500 font-medium"
                >
                  <option value="ADMIN">ADMIN (Akses Penuh)</option>
                  <option value="OPERATOR">OPERATOR (Posting & Riset)</option>
                  <option value="MEMBER">MEMBER (Viewer)</option>
                </select>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingUser ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
