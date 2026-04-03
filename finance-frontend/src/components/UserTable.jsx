import RoleBadge from "./RoleBadge";
import { formatDate } from "../utils/formatters";

export default function UserTable({ users, currentUserId, loadingId, onRoleChange, onStatusToggle }) {
  return (
    <div className="table-shell">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-panel/70 text-xs uppercase tracking-[0.24em] text-muted">
            <tr>
              {["Name", "Email", "Role", "Status", "Joined", "Actions"].map((heading) => (
                <th key={heading} className="px-5 py-4 font-bold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const busy = loadingId === user.id;
              return (
                <tr key={user.id} className="border-t border-line/70">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-text">{user.name}</div>
                    <p className="text-sm text-muted">{user._count?.transactions ?? 0} transactions</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted">{user.email}</td>
                  <td className="px-5 py-4">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold tracking-[0.18em] ${
                        user.isActive ? "bg-positiveSoft text-positive" : "bg-negativeSoft text-negative"
                      }`}
                    >
                      {user.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted">{formatDate(user.createdAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select
                        className="field-input h-10 min-w-[140px]"
                        value={user.role}
                        disabled={busy}
                        onChange={(event) => onRoleChange(user, event.target.value)}
                      >
                        <option value="VIEWER">Viewer</option>
                        <option value="ANALYST">Analyst</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <button
                        type="button"
                        disabled={busy || currentUserId === user.id}
                        onClick={() => onStatusToggle(user)}
                        className="secondary-button h-10 px-4 py-0"
                      >
                        {busy ? "Updating..." : user.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
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
