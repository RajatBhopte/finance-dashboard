import ThemeToggle from "./ThemeToggle";

export default function Navbar({ title }) {
  return (
    <div className="flex w-full items-center justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted">Finance dashboard</p>
        <div className="mt-1 flex items-center gap-3">
          <h2 className="text-2xl font-extrabold tracking-tight text-text sm:text-3xl">{title}</h2>
          <div className="hidden rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold text-accent sm:inline-flex">
            Live analytics
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden lg:block">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
