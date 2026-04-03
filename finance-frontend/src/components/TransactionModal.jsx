import { useEffect, useMemo, useState } from "react";

const initialFormState = {
  amount: "",
  type: "INCOME",
  category: "",
  date: "",
  notes: "",
};

function mapTransactionToForm(transaction) {
  if (!transaction) {
    return initialFormState;
  }

  return {
    amount: transaction.amount ?? "",
    type: transaction.type ?? "INCOME",
    category: transaction.category ?? "",
    date: transaction.date ? transaction.date.slice(0, 10) : "",
    notes: transaction.notes ?? "",
  };
}

export default function TransactionModal({ open, mode, transaction, submitting, onClose, onSubmit }) {
  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    if (open) {
      setForm(mapTransactionToForm(transaction));
    }
  }, [open, transaction]);

  const initialForm = useMemo(() => mapTransactionToForm(transaction), [transaction]);

  if (!open) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (mode === "edit") {
      const payload = {};

      Object.entries(form).forEach(([key, value]) => {
        const normalizedValue = key === "amount" && value !== "" ? Number(value) : value;
        const previousValue =
          key === "amount" && initialForm[key] !== "" ? Number(initialForm[key]) : initialForm[key];

        if (`${normalizedValue ?? ""}` !== `${previousValue ?? ""}`) {
          payload[key] = normalizedValue;
        }
      });

      onSubmit(payload);
      return;
    }

    onSubmit({
      ...form,
      amount: Number(form.amount),
    });
  };

  const title = mode === "edit" ? "Edit transaction" : "Create transaction";
  const submitLabel = mode === "edit" ? "Save changes" : "Create transaction";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <div className="surface-card max-h-[92vh] w-full max-w-2xl overflow-y-auto p-6 sm:p-8">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted">Transaction desk</p>
          <h3 className="mt-2 text-2xl font-extrabold text-text">{title}</h3>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-text">Amount</label>
              <input className="field-input" type="number" min="0" step="0.01" name="amount" value={form.amount} onChange={handleChange} required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-text">Type</label>
              <select className="field-input" name="type" value={form.type} onChange={handleChange} required>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-text">Category</label>
              <input className="field-input" type="text" name="category" value={form.category} onChange={handleChange} placeholder="Salary, Rent, Groceries..." required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-text">Date</label>
              <input className="field-input" type="date" name="date" value={form.date} onChange={handleChange} required />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-text">Notes</label>
            <textarea className="field-textarea" rows="4" name="notes" value={form.notes} onChange={handleChange} placeholder="Optional notes for extra context" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="secondary-button" onClick={onClose}>
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
