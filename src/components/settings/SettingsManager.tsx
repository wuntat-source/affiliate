"use client";

import React, { useState } from "react";
import { Settings, Shield, Sparkles, Check } from "lucide-react";

export const SettingsManager: React.FC = () => {
  const [geminiKey, setGeminiKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [threadsToken, setThreadsToken] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          System Settings & API Configuration
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Configure API keys for LLM copy generation (Gemini / OpenAI) and Meta Threads developer tokens.
        </p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" /> Settings updated successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
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
              Used for high-speed, cost-effective soft-selling curhat generation (Gemini 1.5 Flash).
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
              Meta Graph API Access Token
            </label>
            <input
              type="password"
              value={threadsToken}
              onChange={(e) => setThreadsToken(e.target.value)}
              placeholder="EAA..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Leave blank to keep using the local Sandbox Simulator mode.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
