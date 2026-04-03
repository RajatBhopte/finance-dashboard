import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("finance_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("finance_token");
      localStorage.removeItem("finance_user");
      window.dispatchEvent(new CustomEvent("auth:logout"));

      if (!["/login", "/register"].includes(window.location.pathname)) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
