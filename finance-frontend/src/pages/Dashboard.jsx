import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowLeftRight,
  Landmark,
  PiggyBank,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import SummaryCard from "../components/SummaryCard";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { formatCurrency, formatDate, formatMonth, getErrorMessage } from "../utils/formatters";

function ChartCard({ eyebrow, title, description, children, className = "" }) {
  return (
    <div className={`surface-card flex h-full flex-col p-6 ${className}`}>
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">{eyebrow}</p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <div>
          <h3 className="text-2xl font-extrabold text-text">{title}</h3>
          <p className="mt-2 text-sm text-muted">{description}</p>
        </div>
      </div>
      <div className="mt-6 flex-1 min-h-[320px]">{children}</div>
    </div>
  );
}

export default function Dashboard() {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [trends, setTrends] = useState([]);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      try {
        const requests = [api.get("/api/dashboard/summary"), api.get("/api/dashboard/category")];

        if (role === "ANALYST" || role === "ADMIN") {
          requests.push(api.get("/api/dashboard/trends"));
          requests.push(api.get("/api/dashboard/recent", { params: { limit: 10 } }));
        }

        const [summaryResponse, categoriesResponse, trendsResponse, recentResponse] = await Promise.all(
          requests
        );

        setSummary(summaryResponse.data.data);
        setCategories(categoriesResponse.data.data || []);
        setTrends(trendsResponse?.data?.data || []);
        setRecent(recentResponse?.data?.data || []);
      } catch (requestError) {
        toast.error(getErrorMessage(requestError, "Unable to load dashboard data."));
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [role]);

  if (loading) {
    return <LoadingSpinner label="Loading dashboard..." />;
  }

  if (!summary) {
    return (
      <EmptyState
        title="Dashboard unavailable"
        description="The dashboard data could not be loaded right now. Try refreshing after the backend is running."
      />
    );
  }

  const canSeeAnalystSections = role === "ANALYST" || role === "ADMIN";

  return (
    <div className="space-y-6">
      <section className="grid gap-5 lg:grid-cols-3">
        <SummaryCard title="Total Income" value={summary.totalIncome} tone="positive" trend={summary.trends?.income} icon={Landmark} />
        <SummaryCard title="Total Expenses" value={summary.totalExpense} tone="negative" trend={summary.trends?.expense} icon={ArrowLeftRight} />
        <SummaryCard title="Current Balance" value={summary.netBalance} tone="balance" trend={summary.trends?.netBalance} icon={PiggyBank} />
      </section>

      <section className={`grid items-stretch gap-6 ${canSeeAnalystSections ? "xl:grid-cols-[1.05fr,1.2fr]" : ""}`}>
        <ChartCard
          eyebrow="Spending overview"
          title="Money by category"
          description="See which categories bring in money and which ones cost the most."
        >
          {categories.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories} barGap={10}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.28)" />
                <XAxis dataKey="category" tickLine={false} axisLine={false} tick={{ fill: "currentColor", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "currentColor", fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    background: "rgb(var(--color-surface))",
                    borderRadius: "18px",
                    border: "1px solid rgb(var(--color-line))",
                  }}
                />
                <Legend />
                <Bar dataKey="income" radius={[10, 10, 0, 0]} fill="rgb(var(--color-positive))" />
                <Bar dataKey="expense" radius={[10, 10, 0, 0]} fill="rgb(var(--color-negative))" />
                <Bar dataKey="net" radius={[10, 10, 0, 0]} fill="rgb(var(--color-accent))" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No category data" description="Add some transactions to see category-wise income and spending here." />
          )}
        </ChartCard>

        {canSeeAnalystSections ? (
          <ChartCard
            eyebrow="Monthly view"
            title="Income vs expenses"
            description="Track how much money came in and went out over the last few months."
          >
            {trends.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.28)" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={formatMonth}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "currentColor", fontSize: 12 }}
                  />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "currentColor", fontSize: 12 }} />
                  <Tooltip
                    labelFormatter={formatMonth}
                    formatter={(value) => formatCurrency(value)}
                    cursor={{ stroke: "rgba(148, 163, 184, 0.18)", strokeWidth: 1 }}
                    contentStyle={{
                      background: "rgb(var(--color-surface))",
                      borderRadius: "18px",
                      border: "1px solid rgb(var(--color-line))",
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="rgb(var(--color-positive))" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="expense" stroke="rgb(var(--color-negative))" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="net" stroke="rgb(var(--color-accent))" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No monthly data" description="Monthly trends will appear after enough transactions are added." />
            )}
          </ChartCard>
        ) : null}
      </section>

      {canSeeAnalystSections ? (
        <section className="surface-card overflow-hidden">
          <div className="border-b border-line/70 px-6 py-5">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">Latest updates</p>
            <h3 className="mt-2 text-2xl font-extrabold text-text">Recent transactions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-panel/70 text-xs uppercase tracking-[0.24em] text-muted">
                <tr>
                  {["Date", "Category", "Type", "Amount", "Created by"].map((heading) => (
                    <th key={heading} className="px-6 py-4 font-bold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((item) => (
                  <tr key={item.id} className="border-t border-line/70">
                    <td className="px-6 py-4 text-sm text-text">{formatDate(item.date)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-text">{item.category}</td>
                    <td className="px-6 py-4 text-sm text-muted">{item.type}</td>
                    <td className="px-6 py-4 text-sm font-bold text-text">{formatCurrency(item.amount)}</td>
                    <td className="px-6 py-4 text-sm text-muted">{item.user?.name || item.user?.email || "--"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
