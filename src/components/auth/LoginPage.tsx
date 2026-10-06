"use client";

import React, { useState } from "react";
import { Zap, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, RefreshCw } from "lucide-react";
import { setAuthSession } from "@/lib/auth";

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success && data.user) {
        setAuthSession(data.user);
        onLoginSuccess();
      } else {
        setError(data.error || "Username atau password salah. Silakan periksa kembali.");
      }
    } catch (err: any) {
      // Fallback local check
      if (username.trim() === "kenzieganteng" && password.trim() === "AmeeraKenzie190613") {
        setAuthSession({
          id: "usr_admin_kenzie",
          username: "kenzieganteng",
          name: "Kenzie Ganteng",
          role: "ADMIN",
        });
        onLoginSuccess();
      } else {
        setError("Gagal terhubung ke server autentikasi.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleQuickFill() {
    setUsername("kenzieganteng");
    setPassword("AmeeraKenzie190613");
    setError(null);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12 antialiased">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/20 mx-auto">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            AFFILIATEPOST <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono font-semibold border border-indigo-100">AI</span>
          </h1>
          <p className="text-xs text-slate-500">
            Masuk ke panel otomasi posting affiliate Threads & X
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  required
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-indigo-500 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-indigo-500 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick autofill shortcut for user convenience */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Akun default:</span>
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
            >
              Isi Otomatis
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-400">
          AFFILIATEPOST AI Platform &copy; 2026
        </p>
      </div>
    </div>
  );
};
