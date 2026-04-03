import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { decodeToken } from "../utils/decodeToken";

const AuthContext = createContext(null);

function readStoredSession() {
  const token = localStorage.getItem("finance_token");
  const userJson = localStorage.getItem("finance_user");

  if (!token) {
    return {
      token: null,
      user: null,
      role: null,
      isAuthenticated: false,
    };
  }

  const decoded = decodeToken(token);
  const expired = decoded?.exp ? decoded.exp * 1000 < Date.now() : false;

  if (expired) {
    localStorage.removeItem("finance_token");
    localStorage.removeItem("finance_user");
    return {
      token: null,
      user: null,
      role: null,
      isAuthenticated: false,
    };
  }

  return {
    token,
    user: userJson ? JSON.parse(userJson) : null,
    role: decoded?.role || null,
    isAuthenticated: true,
  };
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [session, setSession] = useState(readStoredSession);

  const updateSession = (token, user) => {
    const decoded = decodeToken(token);
    const nextSession = {
      token,
      user,
      role: decoded?.role || user?.role || null,
      isAuthenticated: Boolean(token),
    };

    localStorage.setItem("finance_token", token);
    localStorage.setItem("finance_user", JSON.stringify(user ?? null));
    setSession(nextSession);
    return nextSession;
  };

  const login = (payload) => updateSession(payload.token, payload.user);

  const logout = (shouldNavigate = true) => {
    localStorage.removeItem("finance_token");
    localStorage.removeItem("finance_user");
    setSession({
      token: null,
      user: null,
      role: null,
      isAuthenticated: false,
    });

    if (shouldNavigate) {
      navigate("/login", { replace: true });
    }
  };

  useEffect(() => {
    const handleForcedLogout = () => logout(false);

    window.addEventListener("auth:logout", handleForcedLogout);
    return () => window.removeEventListener("auth:logout", handleForcedLogout);
  }, []);

  const value = useMemo(
    () => ({
      ...session,
      login,
      logout,
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
