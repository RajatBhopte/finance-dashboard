import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  tone = "negative",
}) {
  if (!open) {
    return null;
  }

  const toneClasses =
    tone === "negative"
      ? "bg-negative text-white hover:opacity-90"
      : "bg-accent hover:opacity-90";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
      <div className="surface-card w-full max-w-md p-6">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-negativeSoft text-negative">
          <AlertTriangle size={22} />
        </div>
        <h3 className="text-xl font-bold text-text">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="secondary-button">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition ${toneClasses}`}
            style={tone === "negative" ? undefined : { color: "rgb(var(--color-on-accent))" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
