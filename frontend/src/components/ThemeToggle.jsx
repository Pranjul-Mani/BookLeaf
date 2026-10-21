import React from "react";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ showLabel = false, className = "" }) {
  const { theme, toggleTheme, isLight } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500/50 ${
        isLight
          ? "bg-amber-50/80 hover:bg-amber-100/90 text-amber-900 border border-amber-300/80 shadow-sm shadow-amber-200/50"
          : "bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-brand-500/50"
      } ${className}`}
      title={isLight ? "Switch to Dark Theme" : "Switch to Light Theme (Yellow & Green)"}
      aria-label="Toggle light or dark theme"
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isLight ? (
          <Sun className="w-4 h-4 text-amber-500 animate-spin-slow transition-transform duration-500 rotate-0 group-hover:rotate-90 group-hover:scale-110" />
        ) : (
          <Moon className="w-4 h-4 text-teal-300 transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110" />
        )}
      </div>

      {showLabel && (
        <span className="font-medium tracking-tight">
          {isLight ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}
