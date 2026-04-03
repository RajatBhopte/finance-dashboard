export default function LoadingSpinner({ label = "Loading...", className = "py-20" }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-line border-t-accent" />
      <p className="text-sm font-medium text-muted">{label}</p>
    </div>
  );
}
