import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
});

const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
});

let refreshPromise = null;

function clearAuthState() {
  localStorage.removeItem("finance_token");
  localStorage.removeItem("finance_refresh_token");
  localStorage.removeItem("finance_user");
  window.dispatchEvent(new CustomEvent("auth:logout"));

  if (!["/login", "/register"].includes(window.location.pathname)) {
    window.location.href = "/login";
  }
}

function isRefreshEligibleRequest(config = {}) {
  const url = String(config.url || "");
  return ![
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/refresh",
    "/api/auth/logout",
  ].some((path) => url.includes(path));
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("finance_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      !isRefreshEligibleRequest(originalRequest)
    ) {
      return Promise.reject(error);
    }

    const storedRefreshToken = localStorage.getItem("finance_refresh_token");

    if (!storedRefreshToken) {
      clearAuthState();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshClient
          .post("/api/auth/refresh", {
            refreshToken: storedRefreshToken,
          })
          .then((response) => {
            const nextAccessToken =
              response.data?.token || response.data?.accessToken;
            const nextRefreshToken = response.data?.refreshToken;
            const nextUser = response.data?.user;

            if (!nextAccessToken) {
              throw new Error("Missing access token in refresh response.");
            }

            localStorage.setItem("finance_token", nextAccessToken);
            if (nextRefreshToken) {
              localStorage.setItem("finance_refresh_token", nextRefreshToken);
            }
            if (nextUser !== undefined) {
              localStorage.setItem("finance_user", JSON.stringify(nextUser));
            }

            window.dispatchEvent(
              new CustomEvent("auth:session-updated", {
                detail: {
                  token: nextAccessToken,
                  refreshToken: nextRefreshToken,
                  user: nextUser,
                },
              }),
            );

            return nextAccessToken;
          })
          .catch((refreshError) => {
            clearAuthState();
            throw refreshError;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const refreshedAccessToken = await refreshPromise;
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${refreshedAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

export default api;
