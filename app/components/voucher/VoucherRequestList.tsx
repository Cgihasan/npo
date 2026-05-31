"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { XCircle, Clock, Trash2, FileText, User, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface DeletionRequest {
  id: string;
  voucherId: string;
  voucherType: string | null;
  requestedById: string;
  createdAt: Date;
}

const VOUCHER_BADGE_STYLES: Record<string, { label: string; className: string }> = {
  RECEIPT: { label: "Receipt", className: "border-emerald-500/30 text-emerald-600 bg-emerald-500/5" },
  PAYMENT: { label: "Payment", className: "border-amber-500/30 text-amber-600 bg-amber-500/5" },
  CONTRA: { label: "Contra", className: "border-blue-500/30 text-blue-600 bg-blue-500/5" },
  JOURNAL: { label: "Journal", className: "border-purple-500/30 text-purple-600 bg-purple-500/5" },
};

const STATUS_BADGE = {
  label: "Pending",
  className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
};

export default function VoucherRequestList({
  requests,
}: {
  requests: DeletionRequest[];
}) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    requestId: string;
    action: "approve" | "reject";
  } | null>(null);

  const executeAction = async (
    requestId: string,
    action: "approve" | "reject"
  ) => {
    setProcessingId(requestId);
    try {
      const res = await fetch("/api/admin/voucher-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to process request.");
        return;
      }
      toast.success(
        action === "approve"
          ? "Voucher deleted successfully."
          : "Deletion request rejected."
      );
      location.reload();
    } catch {
      toast.error("Failed to process request.");
    } finally {
      setProcessingId(null);
      setConfirmDialog(null);
    }
  };

  return (
    <>
      <div className="space-y-3">
        {requests.map((r) => {
          const voucherStyle = VOUCHER_BADGE_STYLES[r.voucherType ?? ""] ?? {
            label: r.voucherType ?? "Unknown",
            className: "border-gray-500/30 text-gray-600 bg-gray-500/5",
          };
          const isProcessing = processingId === r.id;

          return (
            <Card
              key={r.id}
              className={`overflow-hidden transition-all duration-200 ${
                isProcessing ? "opacity-60 pointer-events-none" : "hover:shadow-md"
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Info */}
                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={STATUS_BADGE.className}>
                        <Clock className="h-3 w-3 mr-1" />
                        {STATUS_BADGE.label}
                      </Badge>
                      <Badge variant="outline" className={voucherStyle.className}>
                        {voucherStyle.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">Voucher: <span className="font-mono font-medium text-foreground">{r.voucherId}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                        <User className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">Requested by: <span className="font-mono font-medium text-foreground">{r.requestedById}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {format(new Date(r.createdAt), "dd MMM yyyy HH:mm")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-[10px] uppercase tracking-widest font-semibold">Request ID:</span>
                        <span className="font-mono text-xs text-foreground">{r.id.slice(0, 8)}…</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setConfirmDialog({ requestId: r.id, action: "approve" })}
                      disabled={isProcessing}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      {isProcessing ? "Processing…" : "Approve & Delete"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDialog({ requestId: r.id, action: "reject" })}
                      disabled={isProcessing}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${confirmDialog?.action === "approve" ? "text-destructive" : "text-amber-500"}`} />
              {confirmDialog?.action === "approve" ? "Approve & Delete Voucher?" : "Reject Deletion Request?"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog?.action === "approve"
                ? "This will permanently delete the voucher and all its associated ledger entries. This action cannot be undone."
                : "The deletion request will be rejected and the voucher will remain in the system."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmDialog?.action === "approve" ? "destructive" : "default"}
              onClick={() => {
                if (confirmDialog) {
                  executeAction(confirmDialog.requestId, confirmDialog.action);
                }
              }}
            >
              {confirmDialog?.action === "approve" ? "Approve & Delete" : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
