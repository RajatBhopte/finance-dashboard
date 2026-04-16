import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ShieldCheck, UserCheck, UserRound, UserX } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import RoleBadge from "../components/RoleBadge";
import { formatDate, getErrorMessage } from "../utils/formatters";

function SummaryTile({ title, value, icon: Icon, tone }) {
  return (
    <div className="surface-card p-6">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}
        >
          <Icon size={20} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
            {title}
          </p>
          <p className="mt-1 text-3xl font-extrabold text-text">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      try {
        const response = await api.get("/api/dashboard/summary");
        setSummary(response.data.data || null);
      } catch (requestError) {
        toast.error(
          getErrorMessage(requestError, "Unable to load dashboard data."),
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading dashboard..." />;
  }

  if (!summary) {
    return (
      <EmptyState
        title="Dashboard unavailable"
        description="The dashboard data could not be loaded right now. Try refreshing after the backend is running."
      />
    );
  }

  const isDirectoryView = summary.dashboardView === "directory-control";

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">
          Role based dashboard
        </p>
        <h2 className="mt-2 text-2xl font-extrabold text-text">
          Welcome, {role}
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-muted">
          {summary.message ||
            "Use this workspace to manage users and maintain role-based access exactly as required."}
        </p>
      </section>

      {isDirectoryView ? (
        <>
          <section className="grid gap-5 lg:grid-cols-3">
            <SummaryTile
              title="Total users"
              value={summary.totals?.users ?? 0}
              icon={UserRound}
              tone="bg-accentSoft text-accent"
            />
            <SummaryTile
              title="Active users"
              value={summary.totals?.activeUsers ?? 0}
              icon={UserCheck}
              tone="bg-positiveSoft text-positive"
            />
            <SummaryTile
              title="Inactive users"
              value={summary.totals?.inactiveUsers ?? 0}
              icon={UserX}
              tone="bg-negativeSoft text-negative"
            />
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <div className="surface-card p-6">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">
                Role distribution
              </p>
              <div className="mt-4 grid gap-3">
                {[
                  { key: "ADMIN", count: summary.totals?.byRole?.ADMIN ?? 0 },
                  {
                    key: "MANAGER",
                    count: summary.totals?.byRole?.MANAGER ?? 0,
                  },
                  { key: "USER", count: summary.totals?.byRole?.USER ?? 0 },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between rounded-2xl border border-line bg-panel/60 px-4 py-3"
                  >
                    <RoleBadge role={item.key} />
                    <span className="text-lg font-bold text-text">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="surface-card p-6">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">
                Access shortcuts
              </p>
              <div className="mt-4 space-y-3">
                <Link
                  to="/users"
                  className="secondary-button w-full justify-start"
                >
                  Open user directory
                </Link>
                <Link
                  to="/profile"
                  className="secondary-button w-full justify-start"
                >
                  Update my profile
                </Link>
                {summary.permissions?.canCreateUsers ? (
                  <p className="rounded-2xl border border-line bg-panel/60 px-4 py-3 text-sm text-muted">
                    As ADMIN, you can create users, assign roles, and
                    activate/deactivate accounts.
                  </p>
                ) : (
                  <p className="rounded-2xl border border-line bg-panel/60 px-4 py-3 text-sm text-muted">
                    As MANAGER, you can view users and update non-admin user
                    details.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="surface-card overflow-hidden">
            <div className="border-b border-line/70 px-6 py-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">
                Audit visibility
              </p>
              <h3 className="mt-2 text-2xl font-extrabold text-text">
                Recently created users
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-panel/70 text-xs uppercase tracking-[0.24em] text-muted">
                  <tr>
                    {["Name", "Email", "Role", "Status", "Created"].map(
                      (heading) => (
                        <th key={heading} className="px-6 py-4 font-bold">
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(summary.recentUsers || []).map((item) => (
                    <tr key={item.id} className="border-t border-line/70">
                      <td className="px-6 py-4 text-sm font-semibold text-text">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted">
                        {item.email}
                      </td>
                      <td className="px-6 py-4">
                        <RoleBadge role={item.role} />
                      </td>
                      <td className="px-6 py-4 text-sm text-muted">
                        {item.isActive ? "Active" : "Inactive"}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted">
                        {formatDate(item.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <section className="surface-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accentSoft text-accent">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">
                My access
              </p>
              <h3 className="text-xl font-extrabold text-text">
                User self-service zone
              </h3>
            </div>
          </div>
          <p className="text-sm text-muted">
            You can view and update your own profile (name and password) from
            the My Profile page.
          </p>
          <div className="mt-5">
            <Link to="/profile" className="primary-button">
              Go to my profile
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
