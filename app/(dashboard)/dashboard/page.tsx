import { OverviewChart } from "@/components/dashboard/OverviewChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Receipt, Wallet, Banknote, Landmark, ArrowUpRight, ArrowDownRight, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getDashboardStats } from "@/app/actions/reports";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const kpis = [
    { 
      title: "Total Receipts", 
      value: `₹${stats.totalReceipts.toLocaleString()}`, 
      icon: Receipt, 
      color: "text-emerald-500", 
      trend: "Overall" 
    },
    { 
      title: "Total Payments", 
      value: `₹${stats.totalPayments.toLocaleString()}`, 
      icon: Wallet, 
      color: "text-amber-500", 
      trend: "Overall" 
    },
    { 
      title: "Cash in Hand", 
      value: `₹${stats.cashInHand.toLocaleString()}`, 
      icon: Banknote, 
      color: "text-blue-500", 
      trend: "Available" 
    },
    { 
      title: "Bank Balance", 
      value: `₹${stats.bankBalance.toLocaleString()}`, 
      icon: Landmark, 
      color: "text-indigo-500", 
      trend: "Available" 
    },
  ];

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back! Here's an overview of your NPO's finances.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/receipts/new">
              <ArrowUpRight className="mr-2 h-4 w-4" /> New Receipt
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/payments/new">
              <ArrowDownRight className="mr-2 h-4 w-4" /> New Payment
            </Link>
          </Button>
          <Button variant="ghost" size="icon">
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <div className={`rounded-full p-2 bg-muted`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{kpi.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
            <CardDescription>Visualizing your cash flow for the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <OverviewChart />
          </CardContent>
        </Card>
        <Card className="col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest entries across all modules.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentTransactions />
            <Button variant="link" className="w-full mt-4 text-emerald-600" asChild>
              <Link href="/reports">View All Transactions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
