import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowRight, LockKeyhole, Mail, User2 } from "lucide-react";
import { motion } from "framer-motion";
import api from "../api/axios";
import FinanceAuthShell from "../components/FinanceAuthShell";
import AuthField from "../components/AuthField";
import { getErrorMessage } from "../utils/formatters";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await api.post("/api/auth/register", form);
      navigate("/login", {
        replace: true,
        state: {
          successMessage: "Account created successfully. You can sign in now.",
        },
      });
    } catch (requestError) {
      const message = getErrorMessage(
        requestError,
        "Unable to create your account.",
      );
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FinanceAuthShell
      variant="register"
      mobileTitle="Create your account"
      formEyebrow="New account"
      formTitle="Create your account"
      formDescription="Set up your account to start with USER access and manage your profile in a secure RBAC workflow."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-blue-500 transition-colors hover:text-blue-400"
          >
            Go to login
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
          id="name"
          label="Full name"
          required
          icon={User2}
          value={form.name}
          onChange={(event) =>
            setForm((current) => ({ ...current, name: event.target.value }))
          }
          placeholder="Enter your full name"
        />

        <AuthField
          id="email"
          label="Email"
          type="email"
          required
          icon={Mail}
          value={form.email}
          onChange={(event) =>
            setForm((current) => ({ ...current, email: event.target.value }))
          }
          placeholder="Enter your email address"
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
          placeholder="Create a strong password"
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
          <span className="inline-flex items-center justify-center">
            {submitting ? "Creating account..." : "Create account"}
            <ArrowRight size={18} className="ml-2" />
          </span>
          <span className="pointer-events-none absolute inset-y-0 left-[-30%] w-24 bg-gradient-to-r from-transparent via-white/25 to-transparent blur-lg transition-transform duration-700 group-hover:translate-x-[420%]" />
        </motion.button>
      </motion.form>
    </FinanceAuthShell>
  );
}
