import { Moon, SunMedium } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-surface text-text transition hover:border-accent/30 hover:bg-accentSoft/60"
      aria-label="Toggle color theme"
    >
      {theme === "light" ? <Moon size={18} /> : <SunMedium size={18} />}
    </button>
  );
}
