import { ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "../utils/formatters";

function TypeBadge({ type }) {
  const tone = type === "INCOME" ? "bg-positiveSoft text-positive" : "bg-negativeSoft text-negative";

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold tracking-[0.18em] ${tone}`}>{type}</span>;
}

export default function TransactionTable({
  transactions,
  pagination,
  page,
  loading,
  canManage,
  onPageChange,
  onEdit,
  onDelete,
}) {
  return (
    <div className="table-shell">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-panel/70 text-xs uppercase tracking-[0.24em] text-muted">
            <tr>
              {["Date", "Category", "Type", "Amount", "Notes", "Created By", "Actions"].map((heading) => (
                <th key={heading} className="px-5 py-4 font-bold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="border-t border-line/70">
                <td className="px-5 py-4 text-sm font-medium text-text">{formatDate(transaction.date)}</td>
                <td className="px-5 py-4">
                  <div className="font-semibold text-text">{transaction.category}</div>
                </td>
                <td className="px-5 py-4">
                  <TypeBadge type={transaction.type} />
                </td>
                <td className="px-5 py-4 text-sm font-bold text-text">{formatCurrency(transaction.amount)}</td>
                <td className="max-w-[260px] px-5 py-4 text-sm text-muted">{transaction.notes || "No notes"}</td>
                <td className="px-5 py-4 text-sm text-muted">{transaction.user?.name || transaction.user?.email || "--"}</td>
                <td className="px-5 py-4">
                  {canManage ? (
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => onEdit(transaction)} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-surface text-text">
                        <Pencil size={16} />
                      </button>
                      <button type="button" onClick={() => onDelete(transaction)} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-surface text-negative">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-muted">View only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 border-t border-line/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          {loading ? "Refreshing data..." : `Page ${page} of ${pagination?.totalPages || 1} • ${pagination?.total || transactions.length} records`}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-surface"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= (pagination?.totalPages || 1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-surface"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
