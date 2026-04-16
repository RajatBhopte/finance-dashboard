import RoleBadge from "./RoleBadge";
import { formatDate } from "../utils/formatters";

function DetailRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-line bg-panel/55 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-text">{value || "--"}</p>
    </div>
  );
}

export default function UserDetailsModal({ open, user, onClose }) {
  if (!open || !user) {
    return null;
  }

  const createdBy = user.audit?.createdBy;
  const updatedBy = user.audit?.updatedBy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <div className="surface-card max-h-[92vh] w-full max-w-3xl overflow-y-auto p-6 sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted">
              User details
            </p>
            <h3 className="mt-2 text-2xl font-extrabold text-text">
              {user.name}
            </h3>
            <p className="mt-1 text-sm text-muted">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <RoleBadge role={user.role} />
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold tracking-[0.18em] ${
                user.isActive
                  ? "bg-positiveSoft text-positive"
                  : "bg-negativeSoft text-negative"
              }`}
            >
              {user.isActive ? "ACTIVE" : "INACTIVE"}
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <DetailRow label="Joined" value={formatDate(user.createdAt)} />
          <DetailRow label="Last Updated" value={formatDate(user.updatedAt)} />
          <DetailRow
            label="Created By"
            value={
              createdBy
                ? `${createdBy.name || "Unknown"} (${createdBy.email || "no-email"})`
                : "System"
            }
          />
          <DetailRow
            label="Updated By"
            value={
              updatedBy
                ? `${updatedBy.name || "Unknown"} (${updatedBy.email || "no-email"})`
                : "Not available"
            }
          />
        </div>

        <div className="mt-6 flex justify-end">
          <button type="button" className="secondary-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
