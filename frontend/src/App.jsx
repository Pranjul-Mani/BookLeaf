import React, { useState, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { LoginPage } from "./components/LoginPage";
import { AuthorDashboard } from "./components/AuthorPortal/AuthorDashboard";
import { AdminDashboard } from "./components/AdminPortal/AdminDashboard";
import { CheckCircle2, X } from "lucide-react";

function MainContent() {
  const { user, loading, isAdmin, isAuthor } = useAuth();
  const [authorTab, setAuthorTab] = useState("books"); // 'books' | 'tickets' | 'new-ticket'
  const [adminViewKey, setAdminViewKey] = useState(0);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleNavigateHome = () => {
    if (isAuthor) {
      setAuthorTab("books");
    } else if (isAdmin) {
      setAdminViewKey((k) => k + 1);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-mono">Initializing BookLeaf Portal...</span>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar
        activeTab={authorTab}
        setActiveTab={setAuthorTab}
        onNavigateHome={handleNavigateHome}
      />

      <main className="flex-1">
        {isAdmin && <AdminDashboard key={adminViewKey} currentUser={user} setToast={setToast} />}
        {isAuthor && (
          <AuthorDashboard
            activeTab={authorTab}
            setActiveTab={setAuthorTab}
            currentUser={user}
            setToast={setToast}
          />
        )}
      </main>

      {/* Global Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-6 z-[99999] flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-emerald-600 text-white shadow-2xl shadow-emerald-950/40 border border-emerald-400/40 transition-all duration-300 pointer-events-auto"
        >
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-wide pr-2">
            {toast}
          </span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/20 transition-colors cursor-pointer shrink-0 ml-auto"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Footer - Hidden for admin login */}
      {!isAdmin && (
        <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-400 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-center">
            <div>
              <strong className="text-slate-300">BookLeaf Publishing</strong> • Author Support & Communication Portal
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

