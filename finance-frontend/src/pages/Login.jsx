import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { motion } from "framer-motion";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import FinanceAuthShell from "../components/FinanceAuthShell";
import AuthField from "../components/AuthField";
import { getErrorMessage } from "../utils/formatters";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (location.state?.successMessage) {
      toast.success(location.state.successMessage);
    }
  }, [location.state]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await api.post("/api/auth/login", form);
      login(response.data);
      toast.success("Welcome back.");
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      const message =
        requestError.response?.status === 429
          ? "Too many requests, please wait before trying again."
          : getErrorMessage(requestError, "Unable to sign in right now.");
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FinanceAuthShell
      variant="login"
      mobileTitle="Welcome back"
      formEyebrow="Secure sign in"
      formTitle="Welcome back"
      formDescription="Sign in to continue with role-based user management, secure profile updates, and access controls."
      footer={
        <>
          New here?{" "}
          <Link
            to="/register"
            className="font-medium text-blue-500 transition-colors hover:text-blue-400"
          >
            Create an account
          </Link>
        </>
      }
    >
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="space-y-5"
        onSubmit={handleSubmit}
      >
        <AuthField
          id="email"
          label="Email or Username"
          type="text"
          required
          icon={Mail}
          value={form.email}
          onChange={(event) =>
            setForm((current) => ({ ...current, email: event.target.value }))
          }
          placeholder="Enter your email or username"
        />

        <AuthField
          id="password"
          label="Password"
          required
          icon={LockKeyhole}
          toggleable
          visible={showPassword}
          onToggleVisibility={() => setShowPassword((current) => !current)}
          value={form.password}
          onChange={(event) =>
            setForm((current) => ({ ...current, password: event.target.value }))
          }
          placeholder="Enter your password"
        />

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        ) : null}

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.985 }}
          type="submit"
          className="group relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-base font-medium text-white transition-all duration-300 hover:from-blue-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-blue-500/25"
        >
          <span className="relative z-10 inline-flex items-center justify-center">
            {submitting ? "Signing in..." : "Sign in"}
            <ArrowRight size={18} className="ml-2" />
          </span>
          <span className="pointer-events-none absolute inset-y-0 left-[-30%] w-24 bg-gradient-to-r from-transparent via-white/25 to-transparent blur-lg transition-transform duration-700 group-hover:translate-x-[420%]" />
        </motion.button>
      </motion.form>
    </FinanceAuthShell>
  );
}
