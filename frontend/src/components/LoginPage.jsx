import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  BookOpen, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function LoginPage() {
  const { login, demoUsers } = useAuth();
  const [email, setEmail] = useState("test@bookleaf.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || "Login failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (userEmail) => {
    setEmail(userEmail);
    setPassword("password123");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-200">
      {/* Top Bar Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle showLabel={true} />
      </div>

      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center shadow-xl shadow-brand-500/25">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              BookLeaf
              <span className="text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-brand-500/20 text-brand-400 border border-brand-500/30">
                Portal
              </span>
            </h1>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 max-w-sm mx-auto">
          Author Support & Communication System powered by AI-Assisted Triage and Real-Time Ops.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10 px-4">
        <div className="glass-panel p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-800">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[11px] text-slate-500 font-mono">Default: password123</span>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              {loading ? "Authenticating..." : "Sign In to Portal"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-Click Persona Pre-fills */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" /> 1-Click Fast Login Pre-fills
              </span>
              <span className="text-[11px] text-brand-400">Select any test role</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickSelect("test@bookleaf.com")}
                className="login-prefill-btn p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/40 hover:border-amber-500 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300 group-hover:text-amber-800 dark:group-hover:text-amber-200">
                    Test User
                  </span>
                  <span className="text-[10px] font-mono bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-500/30 font-semibold">
                    Admin (Full Access)
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">test@bookleaf.com • password123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect("rohit.kapoor@email.com")}
                className="login-prefill-btn p-2.5 rounded-xl bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-300">
                    Rohit Kapoor
                  </span>
                  <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-transparent">
                    AUTH002
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">2 books • Pending royalties query</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect("priya.sharma@email.com")}
                className="login-prefill-btn p-2.5 rounded-xl bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-300">
                    Priya Sharma
                  </span>
                  <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-transparent">
                    AUTH001
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">2 books • Literary Fiction</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect("sneha.kulkarni@email.com")}
                className="login-prefill-btn p-2.5 rounded-xl bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-300">
                    Sneha Kulkarni
                  </span>
                  <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-transparent">
                    AUTH007
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">3 books • Cover Design in prod.</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
