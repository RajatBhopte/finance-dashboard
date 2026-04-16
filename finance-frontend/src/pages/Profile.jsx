import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { KeyRound, UserCircle2 } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import RoleBadge from "../components/RoleBadge";
import { formatDate, getErrorMessage } from "../utils/formatters";

export default function Profile() {
  const { updateCurrentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  });

  const loadProfile = async () => {
    setLoading(true);

    try {
      const response = await api.get("/api/users/me");
      const userData = response.data.data;
      setProfile(userData);
      setLoadError("");
      setForm({
        name: userData?.name || "",
        password: "",
        confirmPassword: "",
      });
    } catch (requestError) {
      const message = getErrorMessage(
        requestError,
        "Unable to load your profile.",
      );
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!profile) {
      const message = "Unable to load your profile.";
      setLoadError(message);
      toast.error(message);
      return;
    }

    const payload = {};
    const normalizedName = form.name.trim();

    if (!normalizedName) {
      toast.error("Name cannot be empty.");
      return;
    }

    if (normalizedName && normalizedName !== profile.name) {
      payload.name = normalizedName;
    }

    if (form.password.trim()) {
      if (form.password.trim().length < 6) {
        toast.error("Password must be at least 6 characters long.");
        return;
      }

      if (form.password !== form.confirmPassword) {
        toast.error("Password and confirm password do not match.");
        return;
      }

      payload.password = form.password.trim();
    }

    if (!Object.keys(payload).length) {
      toast("No changes to save.");
      return;
    }

    setSaving(true);

    try {
      const response = await api.patch("/api/users/me", payload);
      const nextProfile = response.data.data;
      setProfile(nextProfile);
      setForm({
        name: nextProfile?.name || "",
        password: "",
        confirmPassword: "",
      });

      updateCurrentUser({
        id: nextProfile?.id,
        name: nextProfile?.name,
        email: nextProfile?.email,
        role: nextProfile?.role,
        isActive: nextProfile?.isActive,
      });

      toast.success("Profile updated successfully.");
    } catch (requestError) {
      toast.error(
        getErrorMessage(requestError, "Unable to update your profile."),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading profile..." />;
  }

  if (!profile) {
    return (
      <EmptyState
        title="Profile unavailable"
        description={
          loadError ||
          "Your profile could not be loaded. Please refresh and try again."
        }
        action={
          <button
            type="button"
            className="secondary-button"
            onClick={loadProfile}
          >
            Retry
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-5 lg:grid-cols-3">
        <div className="surface-card p-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">
            Identity
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accentSoft text-accent">
              <UserCircle2 size={22} />
            </div>
            <div>
              <p className="text-lg font-extrabold text-text">{profile.name}</p>
              <p className="text-sm text-muted">{profile.email}</p>
            </div>
          </div>
        </div>

        <div className="surface-card p-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">
            Role
          </p>
          <div className="mt-4">
            <RoleBadge role={profile.role} />
          </div>
          <p className="mt-3 text-sm text-muted">
            Only admins can change role assignments.
          </p>
        </div>

        <div className="surface-card p-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">
            Status
          </p>
          <p className="mt-4 text-2xl font-extrabold text-text">
            {profile.isActive ? "Active" : "Inactive"}
          </p>
          <p className="mt-3 text-sm text-muted">
            Joined on {formatDate(profile.createdAt)}
          </p>
        </div>
      </section>

      <section className="surface-card p-6">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">
          Audit trail
        </p>
        <h3 className="mt-2 text-2xl font-extrabold text-text">
          Who created and updated this profile
        </h3>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-panel/60 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
              Created By
            </p>
            <p className="mt-2 text-sm font-semibold text-text">
              {profile.audit?.createdBy?.name || "System"}
            </p>
            <p className="text-xs text-muted">
              {profile.audit?.createdBy?.email || "--"}
            </p>
            <p className="mt-2 text-xs text-muted">
              At {formatDate(profile.audit?.createdAt)}
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-panel/60 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
              Last Updated By
            </p>
            <p className="mt-2 text-sm font-semibold text-text">
              {profile.audit?.updatedBy?.name || "Not available"}
            </p>
            <p className="text-xs text-muted">
              {profile.audit?.updatedBy?.email || "--"}
            </p>
            <p className="mt-2 text-xs text-muted">
              At {formatDate(profile.audit?.updatedAt)}
            </p>
          </div>
        </div>
      </section>

      <section className="surface-card p-6">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">
          My profile
        </p>
        <h3 className="mt-2 text-2xl font-extrabold text-text">
          Update your name and password
        </h3>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          You can edit your display name and reset your password here. Role and
          access level are managed by administrators.
        </p>

        <form
          className="mt-6 grid gap-5 md:grid-cols-2"
          onSubmit={handleSubmit}
        >
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-text">
              Full name
            </label>
            <input
              className="field-input"
              type="text"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-text">
              New password
            </label>
            <div className="relative">
              <KeyRound
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                size={16}
              />
              <input
                className="field-input pl-11"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                placeholder="Leave empty to keep current password"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-text">
              Confirm new password
            </label>
            <input
              className="field-input"
              type="password"
              value={form.confirmPassword}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  confirmPassword: event.target.value,
                }))
              }
              placeholder="Re-enter new password"
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
