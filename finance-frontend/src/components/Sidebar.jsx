import {
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  LogOut,
  ShieldCheck,
  X,
  WalletCards,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

const baseLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight },
];

export default function Sidebar({ open, onClose }) {
  const { role, logout, user } = useAuth();
  const links = role === "ADMIN" ? [...baseLinks, { to: "/users", label: "Users", icon: Users }] : baseLinks;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[296px] border-r border-line/80 bg-sidebar/90 px-5 py-5 shadow-luxe backdrop-blur-2xl transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent shadow-card" style={{ color: "rgb(var(--color-on-accent))" }}>
                <WalletCards size={20} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted">Finance Suite</p>
                <h1 className="text-lg font-extrabold text-text">Premium Desk</h1>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-surface lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mb-6 rounded-3xl border border-accent/30 bg-accent px-4 py-4 shadow-card">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/75 dark:text-[rgb(var(--color-on-accent))]/75">Current access</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-sm dark:text-[rgb(var(--color-on-accent))]">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="font-semibold text-white dark:text-[rgb(var(--color-on-accent))]">{user?.name || "Finance User"}</p>
                <p className="text-sm text-white/80 dark:text-[rgb(var(--color-on-accent))]/80">{role || "Guest"}</p>
              </div>
            </div>
          </div>

          <p className="mb-3 px-3 text-xs font-bold uppercase tracking-[0.25em] text-muted">Workspace</p>
          <nav className="space-y-2">
            {links.map((link) => {
              const Icon = link.icon;

              return (
                <NavLink key={link.to} to={link.to} onClick={onClose} className={({ isActive }) => `nav-pill ${isActive ? "active" : ""}`}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface">
                    <Icon size={18} />
                  </span>
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto space-y-4 pt-8">
            <div className="soft-panel flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-text">Theme</p>
                <p className="text-xs text-muted">Light first, dark ready</p>
              </div>
              <ThemeToggle />
            </div>
            <button type="button" onClick={() => logout()} className="nav-pill w-full justify-start border border-line bg-surface">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-negativeSoft text-negative">
                <LogOut size={18} />
              </span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
