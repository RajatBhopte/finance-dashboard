/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "rgb(var(--color-canvas) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        panel: "rgb(var(--color-panel) / <alpha-value>)",
        text: "rgb(var(--color-text) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
        sidebar: "rgb(var(--color-sidebar) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        accentSoft: "rgb(var(--color-accent-soft) / <alpha-value>)",
        positive: "rgb(var(--color-positive) / <alpha-value>)",
        positiveSoft: "rgb(var(--color-positive-soft) / <alpha-value>)",
        negative: "rgb(var(--color-negative) / <alpha-value>)",
        negativeSoft: "rgb(var(--color-negative-soft) / <alpha-value>)",
        admin: "rgb(var(--color-admin) / <alpha-value>)",
        manager: "rgb(var(--color-manager) / <alpha-value>)",
        user: "rgb(var(--color-user) / <alpha-value>)",
      },
      boxShadow: {
        luxe: "0 20px 60px rgba(15, 23, 42, 0.10)",
        card: "0 10px 30px rgba(148, 163, 184, 0.14)",
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "premium-glow":
          "radial-gradient(circle at top left, rgba(59,130,246,0.18), transparent 32%), radial-gradient(circle at top right, rgba(14,165,233,0.16), transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.96), rgba(244,247,251,0.95))",
      },
    },
  },
  plugins: [],
};
