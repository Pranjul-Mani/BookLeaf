import React, { useState } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { LoginPage } from "./components/LoginPage";
import { AuthorDashboard } from "./components/AuthorPortal/AuthorDashboard";
import { AdminDashboard } from "./components/AdminPortal/AdminDashboard";

function MainContent() {
  const { user, loading, isAdmin, isAuthor } = useAuth();
  const [authorTab, setAuthorTab] = useState("books"); // 'books' | 'tickets' | 'new-ticket'
  const [adminViewKey, setAdminViewKey] = useState(0);

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
        {isAdmin && <AdminDashboard key={adminViewKey} currentUser={user} />}
        {isAuthor && (
          <AuthorDashboard
            activeTab={authorTab}
            setActiveTab={setAuthorTab}
            currentUser={user}
          />
        )}
      </main>

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

