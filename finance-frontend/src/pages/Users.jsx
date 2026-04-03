import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Shield, UsersRound } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import UserTable from "../components/UserTable";
import { getErrorMessage } from "../utils/formatters";

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);

    try {
      const response = await api.get("/api/users");
      setUsers(response.data.data || []);
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Unable to load users."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (selectedUser, nextRole) => {
    if (selectedUser.role === nextRole) {
      return;
    }

    setLoadingId(selectedUser.id);

    try {
      await api.patch(`/api/users/${selectedUser.id}/role`, { role: nextRole });
      toast.success("User role updated.");
      fetchUsers();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Unable to update the user role."));
    } finally {
      setLoadingId(null);
    }
  };

  const handleStatusToggle = async (selectedUser) => {
    setLoadingId(selectedUser.id);

    try {
      await api.patch(`/api/users/${selectedUser.id}/status`, {
        isActive: !selectedUser.isActive,
      });
      toast.success(`User ${selectedUser.isActive ? "deactivated" : "activated"} successfully.`);
      fetchUsers();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Unable to update the user status."));
    } finally {
      setLoadingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading users..." />;
  }

  if (!users.length) {
    return (
      <EmptyState
        title="No users found"
        description="User accounts will appear here once they have registered in the backend."
      />
    );
  }

  const activeCount = users.filter((item) => item.isActive).length;
  const adminCount = users.filter((item) => item.role === "ADMIN").length;

  return (
    <div className="space-y-6">
      <section className="grid gap-5 md:grid-cols-2">
        <div className="surface-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-accentSoft text-accent">
              <UsersRound size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted">People in the system</p>
              <h3 className="mt-2 text-3xl font-extrabold text-text">{users.length}</h3>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted">{activeCount} currently active accounts with dashboard access.</p>
        </div>
        <div className="surface-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-admin/15 text-admin">
              <Shield size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted">Admin seats</p>
              <h3 className="mt-2 text-3xl font-extrabold text-text">{adminCount}</h3>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted">
            Backend safeguards prevent demoting or deactivating the final active admin.
          </p>
        </div>
      </section>

      <section className="surface-card p-6">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">Access management</p>
        <h3 className="mt-2 text-2xl font-extrabold text-text">Control roles and account status</h3>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Change roles inline, activate or deactivate accounts, and let the backend enforce the
          safety rules around self-updates and the final active admin.
        </p>
      </section>

      <UserTable
        users={users}
        currentUserId={user?.id}
        loadingId={loadingId}
        onRoleChange={handleRoleChange}
        onStatusToggle={handleStatusToggle}
      />
    </div>
  );
}
