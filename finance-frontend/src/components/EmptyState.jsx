export default function EmptyState({ title, description, action }) {
  return (
    <div className="surface-card flex min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accentSoft text-accent">
        <div className="h-3 w-3 rounded-full bg-current" />
      </div>
      <h3 className="text-xl font-bold text-text">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
