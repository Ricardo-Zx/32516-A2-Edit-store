/**
 * AuthContext — holds the signed-in user, bootstraps the profile from a
 * stored token, and exposes login / register / logout.
 *
 * @author Mengshan Wang
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import api, { describeError } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.access_token);
      setUser(data.user);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: describeError(error, "Login failed.") };
    }
  }, []);

  const register = useCallback(async (email, username, password) => {
    try {
      const { data } = await api.post("/auth/register", { email, username, password });
      localStorage.setItem("token", data.access_token);
      setUser(data.user);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: describeError(error, "Registration failed.") };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
