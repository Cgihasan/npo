import db from "@/lib/db";
import { auth } from "@/lib/auth";
import VoucherRequestList from "@/app/components/voucher/VoucherRequestList";
import { ShieldAlert, Trash2 } from "lucide-react";

export default async function Page() {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold text-destructive">Access Denied</h2>
        <p className="text-muted-foreground mt-2">You need admin privileges to manage deletion requests.</p>
      </div>
    );
  }

  const requests = await db.deletionRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  const receiptCount = requests.filter((r) => r.voucherType === "RECEIPT").length;
  const paymentCount = requests.filter((r) => r.voucherType === "PAYMENT").length;
  const contraCount = requests.filter((r) => r.voucherType === "CONTRA").length;
  const journalCount = requests.filter((r) => r.voucherType === "JOURNAL").length;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Voucher Deletion Requests</h2>
        <p className="text-muted-foreground mt-1">
          Review and approve or reject requests from users to delete vouchers.
        </p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="rounded-xl border border-border/50 bg-card p-4 flex-1 min-w-[120px]">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Total Pending</p>
          <p className="text-2xl font-bold mt-1">{requests.length}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4 flex-1 min-w-[120px]">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Receipts</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{receiptCount}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4 flex-1 min-w-[120px]">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Payments</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{paymentCount}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4 flex-1 min-w-[120px]">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Contra</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{contraCount}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4 flex-1 min-w-[120px]">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Journal</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{journalCount}</p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Trash2 className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No pending requests</h3>
            <p className="text-sm text-muted-foreground">
              All deletion requests have been reviewed.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {requests.length} pending request{requests.length !== 1 ? "s" : ""}
            </p>
          </div>
          <VoucherRequestList requests={requests} />
        </div>
      )}
    </div>
  );
}
