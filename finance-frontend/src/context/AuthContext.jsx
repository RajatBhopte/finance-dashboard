import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { decodeToken } from "../utils/decodeToken";

const AuthContext = createContext(null);

function revokeSessionOnServer(token, refreshToken) {
  if (!token && !refreshToken) {
    return;
  }

  const baseUrl = import.meta.env.VITE_API_URL || "";

  fetch(`${baseUrl}/api/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(
      refreshToken
        ? {
            refreshToken,
          }
        : {},
    ),
    keepalive: true,
  }).catch(() => {
    // Ignore network errors on logout; local session is still cleared.
  });
}

function readStoredSession() {
  const token = localStorage.getItem("finance_token");
  const refreshToken = localStorage.getItem("finance_refresh_token");
  const userJson = localStorage.getItem("finance_user");

  if (!token && !refreshToken) {
    return {
      token: null,
      refreshToken: null,
      user: null,
      role: null,
      isAuthenticated: false,
    };
  }

  let storedUser = null;

  if (userJson) {
    try {
      storedUser = JSON.parse(userJson);
    } catch (_error) {
      localStorage.removeItem("finance_user");
    }
  }

  const decoded = token ? decodeToken(token) : null;
  const expired = decoded?.exp ? decoded.exp * 1000 < Date.now() : false;

  if (expired && !refreshToken) {
    localStorage.removeItem("finance_token");
    localStorage.removeItem("finance_user");
    return {
      token: null,
      refreshToken: null,
      user: null,
      role: null,
      isAuthenticated: false,
    };
  }

  return {
    token,
    refreshToken,
    user: storedUser,
    role: decoded?.role || storedUser?.role || null,
    isAuthenticated: Boolean(token || refreshToken),
  };
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [session, setSession] = useState(readStoredSession);

  const updateSession = (token, user, refreshToken) => {
    const decoded = decodeToken(token);
    const nextRefreshToken =
      refreshToken || localStorage.getItem("finance_refresh_token") || null;
    const nextSession = {
      token,
      refreshToken: nextRefreshToken,
      user,
      role: decoded?.role || user?.role || null,
      isAuthenticated: Boolean(token || nextRefreshToken),
    };

    if (token) {
      localStorage.setItem("finance_token", token);
    } else {
      localStorage.removeItem("finance_token");
    }
    localStorage.setItem("finance_user", JSON.stringify(user ?? null));
    if (refreshToken) {
      localStorage.setItem("finance_refresh_token", refreshToken);
    }
    setSession(nextSession);
    return nextSession;
  };

  const login = (payload) =>
    updateSession(
      payload.token || payload.accessToken,
      payload.user,
      payload.refreshToken,
    );

  const updateCurrentUser = (nextUser) => {
    setSession((current) => {
      const mergedUser = nextUser
        ? { ...(current.user || {}), ...nextUser }
        : null;
      localStorage.setItem("finance_user", JSON.stringify(mergedUser));

      return {
        ...current,
        user: mergedUser,
        role: current.role || mergedUser?.role || null,
      };
    });
  };

  const logout = (shouldNavigate = true, revokeOnServer = true) => {
    const activeToken = session.token || localStorage.getItem("finance_token");
    const activeRefreshToken =
      session.refreshToken || localStorage.getItem("finance_refresh_token");

    if (revokeOnServer) {
      revokeSessionOnServer(activeToken, activeRefreshToken);
    }

    localStorage.removeItem("finance_token");
    localStorage.removeItem("finance_refresh_token");
    localStorage.removeItem("finance_user");
    setSession({
      token: null,
      refreshToken: null,
      user: null,
      role: null,
      isAuthenticated: false,
    });

    if (shouldNavigate) {
      navigate("/login", { replace: true });
    }
  };

  useEffect(() => {
    const handleForcedLogout = () => logout(false, false);
    const handleSessionUpdate = (event) => {
      const details = event.detail || {};
      const nextToken =
        details.token ||
        details.accessToken ||
        localStorage.getItem("finance_token") ||
        null;
      const nextRefreshToken =
        details.refreshToken ||
        localStorage.getItem("finance_refresh_token") ||
        null;

      if (!nextToken && !nextRefreshToken) {
        return;
      }

      const decoded = nextToken ? decodeToken(nextToken) : null;
      let nextUser = null;

      if (details.user !== undefined) {
        nextUser = details.user;
      } else {
        const storedUser = localStorage.getItem("finance_user");
        if (storedUser) {
          try {
            nextUser = JSON.parse(storedUser);
          } catch (_error) {
            nextUser = null;
          }
        }
      }

      setSession((current) => ({
        ...current,
        token: nextToken || current.token,
        refreshToken: nextRefreshToken || current.refreshToken,
        user: nextUser,
        role: decoded?.role || nextUser?.role || current.role || null,
        isAuthenticated: true,
      }));
    };

    window.addEventListener("auth:logout", handleForcedLogout);
    window.addEventListener("auth:session-updated", handleSessionUpdate);
    return () => {
      window.removeEventListener("auth:logout", handleForcedLogout);
      window.removeEventListener("auth:session-updated", handleSessionUpdate);
    };
  }, []);

  const value = useMemo(
    () => ({
      ...session,
      login,
      updateCurrentUser,
      logout,
    }),
    [session],
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
