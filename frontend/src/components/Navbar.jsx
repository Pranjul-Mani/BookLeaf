import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  BookOpen,
  ShieldAlert,
  UserCheck,
  User,
  LogOut,
  Sparkles,
  ChevronDown,
  Layers
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar({ activeTab, setActiveTab, onNavigateHome }) {
  const { user, logout, quickSwitch, demoUsers, isAdmin, isAuthor } = useAuth();
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const switchMenuRef = useRef(null);
  const userMenuRef = useRef(null);

  const handleLogoClick = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else if (setActiveTab) {
      setActiveTab("books");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Close menus when clicking anywhere else or pressing Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (switchMenuRef.current && !switchMenuRef.current.contains(event.target)) {
        setShowSwitchMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setShowSwitchMenu(false);
        setShowUserMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Portal Identity - Clickable to navigate to main page */}
          <button
            type="button"
            onClick={handleLogoClick}
            className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer hover:opacity-95 transition-opacity"
            title="Go to main dashboard"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 group-hover:shadow-brand-500/30 transition-all">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white group-hover:text-brand-300 transition-colors">
                  BookLeaf
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium tracking-wide uppercase bg-slate-800 text-brand-400 border border-slate-700">
                  Publishing
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                {isAdmin ? (
                  <span className="text-amber-400 font-medium flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Ops & Triage Center
                  </span>
                ) : (
                  <span className="text-teal-400 font-medium flex items-center gap-1">
                    <UserCheck className="w-3 h-3" /> Author Portal
                  </span>
                )}
              </div>
            </div>
          </button>

          {/* Navigation Tabs for Authors */}
          {isAuthor && setActiveTab && (
            <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab("books")}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "books"
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                My Books & Royalties
              </button>
              <button
                onClick={() => setActiveTab("tickets")}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "tickets"
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Support Tickets
              </button>
              <button
                onClick={() => setActiveTab("new-ticket")}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === "new-ticket"
                    ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-sm font-semibold"
                    : "text-brand-300 hover:text-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Submit Query
              </button>
            </nav>
          )}

          {/* Right Controls: Real-time status, Demo switch, Profile */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <ThemeToggle showLabel={false} />

            {/* Quick Demo Switcher Dropdown */}
            <div ref={switchMenuRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowSwitchMenu((prev) => !prev);
                  setShowUserMenu(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-700 hover:border-brand-500/50 text-slate-200 transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-brand-400" />
                <span className="hidden sm:inline">Switch Persona</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showSwitchMenu && (
                <div
                  className="navbar-dropdown absolute right-0 mt-2 w-72 max-h-[80vh] overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50 text-xs"
                >
                  <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-bold text-black dark:text-slate-300 uppercase tracking-wider bg-slate-100/90 dark:bg-slate-800/50">
                    Operations Team (Admins)
                  </div>
                  {demoUsers.admins.map((adm) => (
                    <button
                      key={adm.email}
                      type="button"
                      onClick={() => {
                        quickSwitch(adm.email);
                        setShowSwitchMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer ${
                        user?.email === adm.email
                          ? "bg-brand-500/15 text-black dark:text-brand-300 font-semibold border-l-2 border-brand-500"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div>
                        <div className="text-black dark:text-white font-bold">{adm.name}</div>
                        <div className="text-[11px] text-slate-700 dark:text-slate-400 font-medium">{adm.email}</div>
                      </div>
                      <span className="text-[10px] bg-amber-500/20 text-amber-900 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 font-semibold">
                        Admin
                      </span>
                    </button>
                  ))}

                  <div className="px-3 py-1.5 border-b border-t border-slate-800 text-[11px] font-bold text-black dark:text-slate-300 uppercase tracking-wider mt-1 bg-slate-100/90 dark:bg-slate-800/50">
                    Sample Authors (from Dataset)
                  </div>
                  {demoUsers.authors.map((auth) => (
                    <button
                      key={auth.email}
                      type="button"
                      onClick={() => {
                        quickSwitch(auth.email);
                        setShowSwitchMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer ${
                        user?.email === auth.email
                          ? "bg-brand-500/15 text-black dark:text-brand-300 font-semibold border-l-2 border-brand-500"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div>
                        <div className="text-black dark:text-white font-bold">{auth.name}</div>
                        <div className="text-[11px] text-slate-700 dark:text-slate-400 font-medium">{auth.email}</div>
                      </div>
                      <span className="text-[10px] bg-slate-200/80 dark:bg-slate-800 text-black dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 font-semibold">
                        {auth.author_id}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile Dropdown Icon */}
            <div ref={userMenuRef} className="relative pl-1 border-l border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowUserMenu((prev) => !prev);
                  setShowSwitchMenu(false);
                }}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-brand-500/50 text-slate-200 transition-colors flex items-center gap-1.5 group focus:outline-none cursor-pointer"
                title="User Account Details"
                aria-label="User Account Details"
              >
                <div className="w-6 h-6 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 group-hover:scale-105 transition-transform">
                  <User className="w-3.5 h-3.5" />
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-200 transition-colors" />
              </button>

              {showUserMenu && (
                <div
                  className="navbar-dropdown absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-3 z-50 text-xs"
                >
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-sm">
                      {user?.name?.charAt(0) || "U"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-black dark:text-white truncate text-sm">{user?.name}</div>
                      <div className="text-[11px] text-slate-700 dark:text-slate-400 truncate font-medium">{user?.email}</div>
                    </div>
                  </div>

                  <div className="py-2.5 space-y-2 border-b border-slate-800 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Name</span>
                      <span className="font-bold text-black dark:text-slate-200">{user?.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Email</span>
                      <span className="font-bold text-black dark:text-slate-200 truncate max-w-[140px]">{user?.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Role</span>
                      <span className="font-bold px-2 py-0.5 rounded-full uppercase text-[10px] bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/30">
                        {user?.role}
                      </span>
                    </div>
                    {user?.author_id && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Author ID</span>
                        <span className="font-bold text-black dark:text-slate-200">{user.author_id}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full mt-2.5 py-2 px-3 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 font-bold transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
