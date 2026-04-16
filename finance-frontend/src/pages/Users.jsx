import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Shield, UsersRound } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import UserTable from "../components/UserTable";
import UserFormModal from "../components/UserFormModal";
import UserDetailsModal from "../components/UserDetailsModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { getErrorMessage } from "../utils/formatters";

const defaultPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

export default function Users() {
  const { user, role } = useAuth();
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [loadingId, setLoadingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState(defaultPagination);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [formState, setFormState] = useState({
    open: false,
    mode: "create",
    user: null,
  });
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    user: null,
    action: "status",
  });

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(searchInput.trim());
    }, 350);

    return () => {
      clearTimeout(debounceTimer);
    };
  }, [searchInput]);

  const fetchUsers = async () => {
    if (loading) {
      setLoading(true);
    } else {
      setFetching(true);
    }

    const normalizedRole = roleFilter === "ALL" ? undefined : roleFilter;
    const normalizedStatus =
      statusFilter === "ALL" ? undefined : statusFilter === "ACTIVE";
    const requestParams = {
      page,
      limit,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(normalizedRole ? { role: normalizedRole } : {}),
      ...(normalizedStatus !== undefined ? { isActive: normalizedStatus } : {}),
    };

    try {
      const response = await api.get("/api/users", {
        params: requestParams,
      });

      const responseUsers = response.data.data || [];
      const nextPagination = {
        ...defaultPagination,
        ...(response.data.pagination || {}),
      };

      if (nextPagination.totalPages > 0 && page > nextPagination.totalPages) {
        setPage(nextPagination.totalPages);
        return;
      }

      setUsers(responseUsers);
      setPagination(nextPagination);
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Unable to load users."));
    } finally {
      setLoading(false);
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [debouncedSearch, roleFilter, statusFilter, page, limit]);

  const activeCount = useMemo(
    () => users.filter((item) => item.isActive).length,
    [users],
  );

  const adminCount = useMemo(
    () => users.filter((item) => item.role === "ADMIN").length,
    [users],
  );

  const openCreateModal = () => {
    if (!isAdmin) {
      toast.error("Only admins can create users.");
      return;
    }

    setFormState({
      open: true,
      mode: "create",
      user: null,
    });
  };

  const openEditModal = (selectedUser) => {
    setFormState({
      open: true,
      mode: "edit",
      user: selectedUser,
    });
  };

  const closeFormModal = () => {
    setFormState({
      open: false,
      mode: "create",
      user: null,
    });
  };

  const handleFormSubmit = async (payload) => {
    const mode = formState.mode;
    const targetUser = formState.user;
    let submissionPayload = { ...(payload || {}) };

    if (mode === "create" && !isAdmin) {
      toast.error("Only admins can create users.");
      return;
    }

    if (mode === "edit" && isManager) {
      if (targetUser?.role === "ADMIN") {
        toast.error("Managers can only update non-admin users.");
        return;
      }

      submissionPayload = Object.fromEntries(
        Object.entries(submissionPayload).filter(([key]) =>
          ["name", "email", "password"].includes(key),
        ),
      );
    }

    if (mode === "edit" && !Object.keys(submissionPayload).length) {
      toast("No changes to save.");
      return;
    }

    setSubmitting(true);

    try {
      if (mode === "create") {
        const response = await api.post("/api/users", submissionPayload);
        const generatedPassword = response.data?.meta?.generatedPassword;

        if (generatedPassword) {
          toast.success(
            `User created. Temporary password: ${generatedPassword}`,
          );
        } else {
          toast.success("User created successfully.");
        }

        closeFormModal();
        if (page !== 1) {
          setPage(1);
        } else {
          fetchUsers();
        }
        return;
      }

      await api.patch(`/api/users/${targetUser.id}`, submissionPayload);
      toast.success("User updated successfully.");
      closeFormModal();
      fetchUsers();

      if (detailsOpen && selectedDetails?.id === targetUser.id) {
        const detailsResponse = await api.get(`/api/users/${targetUser.id}`);
        setSelectedDetails(detailsResponse.data.data || null);
      }
    } catch (requestError) {
      toast.error(
        getErrorMessage(requestError, "Unable to save user details."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDetails = async (selectedUser) => {
    if (isManager && selectedUser.role === "ADMIN") {
      toast.error("Managers can only view details for non-admin users.");
      return;
    }

    try {
      const response = await api.get(`/api/users/${selectedUser.id}`);
      setSelectedDetails(response.data.data || null);
      setDetailsOpen(true);
    } catch (requestError) {
      toast.error(
        getErrorMessage(requestError, "Unable to load user details."),
      );
    }
  };

  const handleRequestStatusToggle = (selectedUser) => {
    if (!isAdmin) {
      toast.error("Only admins can change account status.");
      return;
    }

    setConfirmState({
      open: true,
      user: selectedUser,
      action: "status",
    });
  };

  const handleRequestHardDelete = (selectedUser) => {
    if (!isAdmin) {
      toast.error("Only admins can permanently delete users.");
      return;
    }

    setConfirmState({
      open: true,
      user: selectedUser,
      action: "hardDelete",
    });
  };

  const closeConfirm = () => {
    setConfirmState({
      open: false,
      user: null,
      action: "status",
    });
  };

  const handleStatusToggle = async () => {
    if (!isAdmin) {
      toast.error("Only admins can change account status.");
      return;
    }

    const selectedUser = confirmState.user;

    if (!selectedUser) {
      return;
    }

    setLoadingId(selectedUser.id);

    try {
      if (selectedUser.isActive) {
        await api.delete(`/api/users/${selectedUser.id}`);
        toast.success("User deactivated successfully.");
      } else {
        await api.patch(`/api/users/${selectedUser.id}/status`, {
          isActive: true,
        });
        toast.success("User activated successfully.");
      }

      closeConfirm();
      fetchUsers();

      if (detailsOpen && selectedDetails?.id === selectedUser.id) {
        const detailsResponse = await api.get(`/api/users/${selectedUser.id}`);
        setSelectedDetails(detailsResponse.data.data || null);
      }
    } catch (requestError) {
      toast.error(
        getErrorMessage(requestError, "Unable to update the user status."),
      );
    } finally {
      setLoadingId(null);
    }
  };

  const handleHardDelete = async () => {
    if (!isAdmin) {
      toast.error("Only admins can permanently delete users.");
      return;
    }

    const selectedUser = confirmState.user;

    if (!selectedUser) {
      return;
    }

    setLoadingId(selectedUser.id);

    try {
      await api.delete(`/api/users/${selectedUser.id}/hard`);
      toast.success("User permanently deleted.");
      closeConfirm();

      if (detailsOpen && selectedDetails?.id === selectedUser.id) {
        setDetailsOpen(false);
        setSelectedDetails(null);
      }

      fetchUsers();
    } catch (requestError) {
      toast.error(
        getErrorMessage(requestError, "Unable to permanently delete the user."),
      );
    } finally {
      setLoadingId(null);
    }
  };

  const clearFilters = () => {
    setSearchInput("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
    setPage(1);
    setLimit(10);
  };

  if (loading) {
    return <LoadingSpinner label="Loading users..." />;
  }

  if (!users.length && pagination.total === 0) {
    return (
      <EmptyState
        title="No users found for this view"
        description={
          isAdmin
            ? "Start by creating a user or adjust your filters to see available accounts."
            : "Adjust your filters or refresh to view available user accounts."
        }
        action={
          isAdmin ? (
            <button
              type="button"
              className="primary-button"
              onClick={openCreateModal}
            >
              <Plus size={16} className="mr-2" />
              Create user
            </button>
          ) : (
            <button
              type="button"
              className="secondary-button"
              onClick={fetchUsers}
            >
              Refresh list
            </button>
          )
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-5 lg:grid-cols-3">
        <div className="surface-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-accentSoft text-accent">
              <UsersRound size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted">
                Users matching this query
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-text">
                {pagination.total}
              </h3>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted">
            Showing page {pagination.page} of {pagination.totalPages}.
          </p>
        </div>

        <div className="surface-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-admin/15 text-admin">
              <Shield size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted">
                Current page insights
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-text">
                {activeCount} active / {adminCount} admin
              </h3>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted">
            Backend safeguards prevent deleting or deactivating the final active
            admin.
          </p>
        </div>

        {isAdmin ? (
          <div className="surface-card flex items-center justify-between gap-4 p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">
                Admin action
              </p>
              <h3 className="mt-2 text-2xl font-extrabold text-text">
                Create a new account
              </h3>
              <p className="mt-2 text-sm text-muted">
                Add users with role assignment and optional auto-generated
                password.
              </p>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={openCreateModal}
            >
              <Plus size={16} className="mr-2" />
              Create user
            </button>
          </div>
        ) : (
          <div className="surface-card p-6">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">
              Manager access
            </p>
            <h3 className="mt-2 text-2xl font-extrabold text-text">
              Manage non-admin profiles
            </h3>
            <p className="mt-2 text-sm text-muted">
              Managers can view the user list and update profile details for
              non-admin users.
            </p>
          </div>
        )}
      </section>

      <section className="surface-card p-6">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">
          Directory controls
        </p>
        <h3 className="mt-2 text-2xl font-extrabold text-text">
          Search, filter and paginate users
        </h3>

        <div className="mt-5 grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <label className="mb-2 block text-sm font-semibold text-text">
              Search by name or email
            </label>
            <input
              className="field-input"
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="e.g. ramesh or ramesh@company.com"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-text">
              Role
            </label>
            <select
              className="field-input"
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All roles</option>
              <option value="USER">User</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-text">
              Status
            </label>
            <select
              className="field-input"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-text">
              Rows per page
            </label>
            <select
              className="field-input"
              value={limit}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          <div className="flex items-end lg:col-span-1">
            <button
              type="button"
              className="secondary-button h-12 w-full px-0"
              onClick={clearFilters}
            >
              Reset
            </button>
          </div>
        </div>

        {fetching ? (
          <p className="mt-3 text-sm font-semibold text-muted">
            Refreshing users...
          </p>
        ) : null}
      </section>

      {users.length ? (
        <>
          <UserTable
            users={users}
            currentUserId={user?.id}
            currentRole={role}
            loadingId={loadingId}
            onViewDetails={handleOpenDetails}
            onEdit={openEditModal}
            onStatusToggle={isAdmin ? handleRequestStatusToggle : undefined}
            onHardDelete={isAdmin ? handleRequestHardDelete : undefined}
          />

          <section className="surface-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <p className="text-sm text-muted">
              Showing {users.length} of {pagination.total} users
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="secondary-button h-10 px-4 py-0"
                disabled={pagination.page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </button>
              <div className="rounded-2xl border border-line bg-panel px-4 py-2 text-sm font-semibold text-text">
                Page {pagination.page} / {pagination.totalPages}
              </div>
              <button
                type="button"
                className="secondary-button h-10 px-4 py-0"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  setPage((current) =>
                    Math.min(pagination.totalPages, current + 1),
                  )
                }
              >
                Next
              </button>
            </div>
          </section>
        </>
      ) : (
        <EmptyState
          title="No users match these filters"
          description="Try changing your search text, role, status, or reset filters to view more users."
        />
      )}

      <UserFormModal
        open={formState.open}
        mode={formState.mode}
        user={formState.user}
        submitting={submitting}
        canCreate={isAdmin}
        canManageRole={isAdmin}
        canManageStatus={isAdmin}
        onClose={closeFormModal}
        onSubmit={handleFormSubmit}
      />

      <UserDetailsModal
        open={detailsOpen}
        user={selectedDetails}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedDetails(null);
        }}
      />

      {isAdmin ? (
        <ConfirmDialog
          open={confirmState.open}
          title={
            confirmState.action === "hardDelete"
              ? "Delete user permanently"
              : confirmState.user?.isActive
                ? "Deactivate user"
                : "Activate user"
          }
          description={
            confirmState.action === "hardDelete"
              ? `This will permanently remove ${confirmState.user?.name}'s account and cannot be undone.`
              : confirmState.user?.isActive
                ? `This will disable ${confirmState.user?.name}'s access to the dashboard.`
                : `This will restore ${confirmState.user?.name}'s dashboard access.`
          }
          confirmLabel={
            confirmState.action === "hardDelete"
              ? "Delete permanently"
              : confirmState.user?.isActive
                ? "Deactivate"
                : "Activate"
          }
          tone={
            confirmState.action === "hardDelete" || confirmState.user?.isActive
              ? "negative"
              : "positive"
          }
          onCancel={closeConfirm}
          onConfirm={
            confirmState.action === "hardDelete"
              ? handleHardDelete
              : handleStatusToggle
          }
        />
      ) : null}
    </div>
  );
}
