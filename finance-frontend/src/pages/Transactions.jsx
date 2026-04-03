import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import TransactionTable from "../components/TransactionTable";
import TransactionModal from "../components/TransactionModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { getErrorMessage } from "../utils/formatters";

const initialFilters = {
  type: "",
  category: "",
  startDate: "",
  endDate: "",
  search: "",
  limit: 10,
};

export default function Transactions() {
  const { role } = useAuth();
  const canManage = role === "ADMIN";
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [modalState, setModalState] = useState({ open: false, mode: "create", transaction: null });
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const queryParams = useMemo(() => {
    const params = { page, limit: filters.limit };

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && key !== "limit") {
        params[key] = value;
      }
    });

    return params;
  }, [filters, page]);

  const fetchTransactions = async () => {
    setLoading(true);

    try {
      const response = await api.get("/api/transactions", { params: queryParams });
      setTransactions(response.data.data || []);
      setPagination(response.data.pagination || null);
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Unable to load transactions."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, filters]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setDraftFilters((current) => ({ ...current, [name]: value }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setPage(1);
    setFilters({
      ...draftFilters,
      limit: Number(draftFilters.limit) || 10,
    });
  };

  const clearFilters = () => {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
    setPage(1);
  };

  const openCreateModal = () => setModalState({ open: true, mode: "create", transaction: null });
  const openEditModal = (transaction) => setModalState({ open: true, mode: "edit", transaction });
  const closeModal = () => setModalState({ open: false, mode: "create", transaction: null });

  const handleSubmit = async (payload) => {
    if (modalState.mode === "edit" && !Object.keys(payload).length) {
      toast("No changes to save.");
      closeModal();
      return;
    }

    setSubmitting(true);

    try {
      if (modalState.mode === "edit") {
        await api.put(`/api/transactions/${modalState.transaction.id}`, payload);
        toast.success("Transaction updated.");
      } else {
        await api.post("/api/transactions", payload);
        toast.success("Transaction created.");
      }

      closeModal();
      fetchTransactions();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Unable to save the transaction."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      return;
    }

    try {
      await api.delete(`/api/transactions/${confirmDelete.id}`);
      toast.success("Transaction deleted.");
      setConfirmDelete(null);
      fetchTransactions();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Unable to delete the transaction."));
    }
  };

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">Control center</p>
            <h3 className="mt-2 text-2xl font-extrabold text-text">Transaction registry</h3>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Filter by type, category, date range, or text search. Admins can create, edit, and
              soft delete records directly from this desk.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={fetchTransactions} className="secondary-button">
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </button>
            {canManage ? (
              <button type="button" onClick={openCreateModal} className="primary-button">
                <Plus size={16} className="mr-2" />
                Create Transaction
              </button>
            ) : null}
          </div>
        </div>

        <form className="grid gap-4 lg:grid-cols-2 xl:grid-cols-6" onSubmit={applyFilters}>
          <div className="xl:col-span-1">
            <label className="mb-2 block text-sm font-semibold text-text">Type</label>
            <select className="field-input" name="type" value={draftFilters.type} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </div>
          <div className="xl:col-span-1">
            <label className="mb-2 block text-sm font-semibold text-text">Category</label>
            <input className="field-input" type="text" name="category" value={draftFilters.category} onChange={handleFilterChange} placeholder="Rent, Salary..." />
          </div>
          <div className="xl:col-span-1">
            <label className="mb-2 block text-sm font-semibold text-text">Start date</label>
            <input className="field-input" type="date" name="startDate" value={draftFilters.startDate} onChange={handleFilterChange} />
          </div>
          <div className="xl:col-span-1">
            <label className="mb-2 block text-sm font-semibold text-text">End date</label>
            <input className="field-input" type="date" name="endDate" value={draftFilters.endDate} onChange={handleFilterChange} />
          </div>
          <div className="xl:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-text">Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <input className="field-input pl-11" type="text" name="search" value={draftFilters.search} onChange={handleFilterChange} placeholder="Search category, notes, or user" />
            </div>
          </div>

          <div className="xl:col-span-6 flex flex-wrap justify-between gap-3 pt-2">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-panel px-4 py-3 text-sm text-muted">
              <SlidersHorizontal size={16} />
              Rich light theme with role-aware transaction controls
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={clearFilters} className="secondary-button">
                Clear filters
              </button>
              <button type="submit" className="primary-button">
                Apply filters
              </button>
            </div>
          </div>
        </form>
      </section>

      {loading ? (
        <LoadingSpinner label="Loading transactions..." />
      ) : transactions.length ? (
        <TransactionTable
          transactions={transactions}
          pagination={pagination}
          page={page}
          loading={loading}
          canManage={canManage}
          onPageChange={(nextPage) => setPage(nextPage)}
          onEdit={openEditModal}
          onDelete={(transaction) => setConfirmDelete(transaction)}
        />
      ) : (
        <EmptyState
          title="No transactions found"
          description="Try widening your filters or add a new record to see your transaction registry populate."
          action={
            canManage ? (
              <button type="button" onClick={openCreateModal} className="primary-button">
                <Plus size={16} className="mr-2" />
                Add your first transaction
              </button>
            ) : null
          }
        />
      )}

      <TransactionModal
        open={modalState.open}
        mode={modalState.mode}
        transaction={modalState.transaction}
        submitting={submitting}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete transaction?"
        description="This action performs a soft delete. The record will disappear from the list but remain stored in the backend."
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
