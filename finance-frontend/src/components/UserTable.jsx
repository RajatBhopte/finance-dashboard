import RoleBadge from "./RoleBadge";
import { formatDate } from "../utils/formatters";

export default function UserTable({
  users,
  currentUserId,
  currentRole,
  loadingId,
  onViewDetails,
  onEdit,
  onStatusToggle,
  onHardDelete,
}) {
  return (
    <div className="table-shell">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-panel/70 text-xs uppercase tracking-[0.24em] text-muted">
            <tr>
              {[
                "Name",
                "Email",
                "Role",
                "Status",
                "Joined",
                "Updated",
                "Actions",
              ].map((heading) => (
                <th key={heading} className="px-5 py-4 font-bold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const busy = loadingId === user.id;
              const isSelf = currentUserId === user.id;
              const isAdminRow = user.role === "ADMIN";
              const canViewDetails = currentRole === "ADMIN" || !isAdminRow;
              const canEdit = currentRole === "ADMIN" || !isAdminRow;
              const canToggleStatus =
                currentRole === "ADMIN" && typeof onStatusToggle === "function";
              const canHardDelete =
                currentRole === "ADMIN" && typeof onHardDelete === "function";
              return (
                <tr key={user.id} className="border-t border-line/70">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-text">{user.name}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted">{user.email}</td>
                  <td className="px-5 py-4">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold tracking-[0.18em] ${
                        user.isActive
                          ? "bg-positiveSoft text-positive"
                          : "bg-negativeSoft text-negative"
                      }`}
                    >
                      {user.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-5 py-4 text-sm text-muted">
                    {formatDate(user.updatedAt)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        disabled={busy || !canViewDetails}
                        onClick={() => onViewDetails(user)}
                        className="secondary-button h-10 px-4 py-0"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        disabled={busy || !canEdit}
                        onClick={() => onEdit(user)}
                        className="secondary-button h-10 px-4 py-0"
                      >
                        Edit
                      </button>
                      {canToggleStatus ? (
                        <button
                          type="button"
                          disabled={busy || isSelf}
                          onClick={() => onStatusToggle(user)}
                          className={`h-10 rounded-2xl px-4 py-0 text-sm font-semibold transition ${
                            user.isActive
                              ? "bg-negative text-white hover:opacity-90"
                              : "bg-accent hover:opacity-90"
                          }`}
                          style={
                            user.isActive
                              ? undefined
                              : { color: "rgb(var(--color-on-accent))" }
                          }
                        >
                          {busy
                            ? "Updating..."
                            : user.isActive
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                      ) : null}
                      {canHardDelete ? (
                        <button
                          type="button"
                          disabled={busy || isSelf}
                          onClick={() => onHardDelete(user)}
                          className="h-10 rounded-2xl bg-negative px-4 py-0 text-sm font-semibold text-white transition hover:opacity-90"
                        >
                          {busy ? "Processing..." : "Delete"}
                        </button>
                      ) : null}
                    </div>
                    {canToggleStatus && isSelf ? (
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                        You cannot change your own status or delete your account
                        from this view.
                      </p>
                    ) : null}
                    {currentRole === "MANAGER" && isAdminRow ? (
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                        Managers can view or update only non-admin users.
                      </p>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
