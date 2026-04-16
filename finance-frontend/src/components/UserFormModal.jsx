import { useEffect, useMemo, useState } from "react";

const initialCreateForm = {
  name: "",
  email: "",
  role: "USER",
  isActive: true,
  password: "",
  autoGeneratePassword: true,
};

function mapUserToForm(user) {
  if (!user) {
    return initialCreateForm;
  }

  return {
    name: user.name || "",
    email: user.email || "",
    role: user.role || "USER",
    isActive: Boolean(user.isActive),
    password: "",
    autoGeneratePassword: false,
  };
}

export default function UserFormModal({
  open,
  mode,
  user,
  submitting,
  canCreate = true,
  canManageRole = true,
  canManageStatus = true,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(initialCreateForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setError("");
    setForm(mode === "create" ? initialCreateForm : mapUserToForm(user));
  }, [open, mode, user]);

  const initialEditForm = useMemo(() => mapUserToForm(user), [user]);

  if (!open) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    const normalizedName = form.name.trim();
    const normalizedEmail = form.email.trim();

    if (!normalizedName || !normalizedEmail) {
      setError("Name and email are required.");
      return;
    }

    if (mode === "create") {
      if (!canCreate) {
        setError("Only admins can create users.");
        return;
      }

      if (!form.autoGeneratePassword && form.password.trim().length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }

      onSubmit({
        name: normalizedName,
        email: normalizedEmail,
        ...(canManageRole ? { role: form.role } : {}),
        ...(canManageStatus ? { isActive: form.isActive } : {}),
        autoGeneratePassword: form.autoGeneratePassword,
        ...(form.autoGeneratePassword
          ? {}
          : { password: form.password.trim() }),
      });
      return;
    }

    const payload = {};

    if (normalizedName !== initialEditForm.name) {
      payload.name = normalizedName;
    }

    if (
      normalizedEmail.toLowerCase() !==
      String(initialEditForm.email || "").toLowerCase()
    ) {
      payload.email = normalizedEmail;
    }

    if (canManageRole && form.role !== initialEditForm.role) {
      payload.role = form.role;
    }

    if (
      canManageStatus &&
      Boolean(form.isActive) !== Boolean(initialEditForm.isActive)
    ) {
      payload.isActive = Boolean(form.isActive);
    }

    if (form.password.trim()) {
      if (form.password.trim().length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }

      payload.password = form.password.trim();
    }

    onSubmit(payload);
  };

  const title = mode === "create" ? "Create user" : "Edit user";
  const submitLabel = mode === "create" ? "Create user" : "Save changes";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <div className="surface-card max-h-[92vh] w-full max-w-2xl overflow-y-auto p-6 sm:p-8">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted">
            User management
          </p>
          <h3 className="mt-2 text-2xl font-extrabold text-text">{title}</h3>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-text">
                Full name
              </label>
              <input
                className="field-input"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter full name"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-text">
                Email
              </label>
              <input
                className="field-input"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name@company.com"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-text">
                Role
              </label>
              {canManageRole ? (
                <select
                  className="field-input"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                >
                  <option value="USER">User</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              ) : (
                <div className="field-input flex items-center">{form.role}</div>
              )}
            </div>

            <div className="flex items-end">
              {canManageStatus ? (
                <label className="inline-flex items-center gap-3 rounded-2xl border border-line bg-panel px-4 py-3 text-sm font-semibold text-text">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    className="h-4 w-4"
                  />
                  Account is active
                </label>
              ) : (
                <p className="text-sm font-semibold text-muted">
                  Account status can be changed only by admins.
                </p>
              )}
            </div>
          </div>

          {mode === "create" ? (
            <div className="space-y-3 rounded-2xl border border-line bg-panel/60 p-4">
              <label className="inline-flex items-center gap-3 text-sm font-semibold text-text">
                <input
                  type="checkbox"
                  name="autoGeneratePassword"
                  checked={form.autoGeneratePassword}
                  onChange={handleChange}
                  className="h-4 w-4"
                />
                Auto-generate password
              </label>

              {!form.autoGeneratePassword ? (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-text">
                    Password
                  </label>
                  <input
                    className="field-input"
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter a secure password"
                    minLength={6}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted">
                  A secure temporary password will be generated and returned
                  after user creation.
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-semibold text-text">
                New password (optional)
              </label>
              <input
                className="field-input"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Leave empty to keep current password"
                minLength={6}
              />
            </div>
          )}

          {error ? (
            <div className="rounded-2xl border border-negative/40 bg-negativeSoft px-4 py-3 text-sm font-semibold text-negative">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="primary-button">
              {submitting ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
