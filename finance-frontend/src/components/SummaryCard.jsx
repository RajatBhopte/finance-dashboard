import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatCurrency, formatDisplayAmount } from "../utils/formatters";

export default function SummaryCard({ title, value, tone, trend, icon: Icon }) {
  const trendMeaning =
    tone === "negative"
      ? trend > 0
        ? "higher than last month"
        : trend < 0
          ? "lower than last month"
          : "same as last month"
      : trend > 0
        ? "higher than last month"
        : trend < 0
          ? "lower than last month"
          : "same as last month";

  const toneMap = {
    positive: "bg-positiveSoft text-positive",
    negative: "bg-negativeSoft text-negative",
    balance: (Number(value) >= 0) ? "bg-accentSoft text-accent" : "bg-negativeSoft text-negative",
  };

  return (
    <div className="surface-card relative overflow-hidden p-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent/80 via-sky-400/70 to-cyan-300/70" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted">{title}</p>
          <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-text">{formatCurrency(value)}</h3>
          <p className="mt-2 text-sm text-muted">Amount: {formatDisplayAmount(value)}</p>
        </div>
        <div className={`flex h-14 w-14 items-center justify-center rounded-3xl ${toneMap[tone]}`}>
          <Icon size={24} />
        </div>
      </div>
      {typeof trend === 'number' && (
        <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-muted">
          {trend > 0 ? (
            <ArrowUpRight size={16} className={tone === "negative" ? "text-negative" : "text-positive"} />
          ) : trend < 0 ? (
            <ArrowDownRight size={16} className={tone === "negative" ? "text-positive" : "text-negative"} />
          ) : null}
          <span className={
            trend > 0 
              ? (tone === "negative" ? "text-negative" : "text-positive")
              : trend < 0 
                ? (tone === "negative" ? "text-positive" : "text-negative")
                : "text-muted"
          }>
            {trend > 0 ? "+" : ""}{trend}%
          </span>
          <span className="ml-1 font-normal text-muted">{trendMeaning}</span>
        </div>
      )}
    </div>
  );
}
