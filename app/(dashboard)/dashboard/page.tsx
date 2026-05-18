import { OverviewChart } from "@/components/dashboard/OverviewChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { getDashboardStats } from "@/app/actions/reports";
import { TrendingUp, TrendingDown, Wallet, Landmark } from "lucide-react";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const kpis = [
    {
      title: "Total Receipts",
      value: stats.totalReceipts,
      icon: TrendingUp,
      accent: "emerald",
      trend: "+12.5% from last month",
    },
    {
      title: "Total Payments",
      value: stats.totalPayments,
      icon: TrendingDown,
      accent: "amber",
      trend: "-2.1% from last month",
    },
    {
      title: "Cash in Hand",
      value: stats.cashInHand,
      icon: Wallet,
      accent: "indigo",
      trend: "Available balance",
    },
    {
      title: "Bank Balance",
      value: stats.bankBalance,
      icon: Landmark,
      accent: "blue",
      trend: "Available balance",
    },
  ];

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, Admin</h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} • System status: Operational
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div
            key={kpi.title}
            className="group rounded-xl p-6 border border-border/50 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.08)] hover:border-emerald-500/20"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg bg-${kpi.accent}-500/10`}>
                <kpi.icon className={`h-5 w-5 text-${kpi.accent}-500`} />
              </div>
              <span className={`text-[10px] font-bold text-${kpi.accent}-500 bg-${kpi.accent}-500/10 px-2 py-0.5 rounded-full`}>
                {kpi.accent === "emerald" ? "+12.5%" : kpi.accent === "amber" ? "-3.2%" : "—"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">{kpi.title}</p>
            <p className="text-3xl font-bold">₹{kpi.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold">Income vs Expenses</h3>
              <p className="text-sm text-muted-foreground">Monthly treasury performance overview</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-xs font-medium">Income</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                <span className="text-xs font-medium">Expenses</span>
              </div>
            </div>
          </div>
          <OverviewChart />
        </div>

        <div className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm flex flex-col">
          <div className="p-4 border-b border-border/50 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
            <a href="/reports" className="text-xs font-medium text-primary hover:underline">View All</a>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px]">
            <RecentTransactions />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-lg font-semibold">Financial Audit Log</h3>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold ml-auto">Live Monitoring</span>
        </div>
        <AuditLogTable />
      </div>
    </div>
  );
}

async function AuditLogTable() {
  const { getTransactions } = await import("@/app/actions/reports");
  const transactions = await getTransactions();
  const auditLogs = transactions.slice(0, 6);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50 text-muted-foreground text-[11px] uppercase tracking-widest">
            <th className="px-6 py-4 text-left font-semibold">Timestamp</th>
            <th className="px-6 py-4 text-left font-semibold">Action</th>
            <th className="px-6 py-4 text-left font-semibold">Entity</th>
            <th className="px-6 py-4 text-left font-semibold">Status</th>
            <th className="px-6 py-4 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {auditLogs.map((tx: any) => {
            const isReceipt = tx.refType === "RECEIPT";
            const isPayment = tx.refType === "PAYMENT";
            const action = isReceipt ? "Receipt Created" : isPayment ? "Payment Made" : tx.refType === "JOURNAL" ? "Journal Entry" : "Contra Entry";
            const entity = tx.account?.name || tx.narration || "-";
            const status = isReceipt ? "Verified" : isPayment ? "Verified" : "Pending";
            const statusColor = status === "Verified" ? "bg-emerald-500" : "bg-amber-500";
            const amount = `₹${(tx.debit || tx.credit || 0).toLocaleString()}`;

            return (
              <tr key={tx.id} className="hover:bg-accent/30 transition-colors">
                <td className="px-6 py-4 text-xs text-muted-foreground font-mono">
                  {new Date(tx.date).toLocaleString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-6 py-4 font-medium">{action}</td>
                <td className="px-6 py-4 text-muted-foreground">{entity}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
                    <span>{status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-mono font-medium">{amount}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
