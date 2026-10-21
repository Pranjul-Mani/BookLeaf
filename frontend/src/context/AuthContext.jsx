import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("bookleaf_token"));
  const [loading, setLoading] = useState(true);
  const [demoUsers, setDemoUsers] = useState({ authors: [], admins: [] });

  useEffect(() => {
    // Fetch available demo accounts
    api.getDemoUsers()
      .then((data) => {
        setDemoUsers({ authors: data.authors || [], admins: data.admins || [] });
      })
      .catch((err) => console.warn("Failed to load demo accounts:", err.message));

    // Restore user session if token exists
    if (token) {
      api.getMe()
        .then((data) => {
          setUser(data.user);
        })
        .catch(() => {
          localStorage.removeItem("bookleaf_token");
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem("bookleaf_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("bookleaf_token");
    setToken(null);
    setUser(null);
  };

  const quickSwitch = async (email) => {
    return login(email, "password123");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        quickSwitch,
        demoUsers,
        isAdmin: user?.role === "admin",
        isAuthor: user?.role === "author"
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
