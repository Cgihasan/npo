"use client";

import { useEffect, useState, useCallback } from "react";
import { getAuditLogs } from "@/app/actions/users";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Search, RefreshCw, Shield, ShieldOff, Trash, UserX, UserCheck } from "lucide-react";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  action: string;
  performedById: string;
  targetUserId: string | null;
  targetEmail: string | null;
  details: string | null;
  createdAt: Date;
  performedBy: { name: string; email: string };
  targetUser: { name: string; email: string } | null;
}

const actionConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  USER_ROLE_CHANGED: {
    label: "Role Changed",
    icon: <Shield className="h-3.5 w-3.5" />,
    color: "bg-amber-100 text-amber-800 border-amber-200",
  },
  USER_DISABLED: {
    label: "Disabled",
    icon: <UserX className="h-3.5 w-3.5" />,
    color: "bg-red-100 text-red-800 border-red-200",
  },
  USER_ENABLED: {
    label: "Re-enabled",
    icon: <UserCheck className="h-3.5 w-3.5" />,
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  USER_DELETED: {
    label: "Deleted",
    icon: <Trash className="h-3.5 w-3.5" />,
    color: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

function parseDetails(details: string | null) {
  if (!details) return null;
  try {
    return JSON.parse(details) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function ActionBadge({ action }: { action: string }) {
  const config = actionConfig[action] || {
    label: action,
    icon: <ShieldAlert className="h-3.5 w-3.5" />,
    color: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge variant="outline" className={`gap-1 font-medium ${config.color}`}>
      {config.icon}
      {config.label}
    </Badge>
  );
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAuditLogs();
      if ("error" in result) {
        setError(result.error as string);
        if ((result.error as string).includes("Unauthorized")) {
          router.push("/dashboard");
        }
        return;
      }
      setLogs((result as any).logs as AuditLog[]);
    } catch (err: any) {
      setError(err.message || "Failed to load audit logs.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.performedBy.name.toLowerCase().includes(q) ||
      log.performedBy.email.toLowerCase().includes(q) ||
      (log.targetUser?.name || "").toLowerCase().includes(q) ||
      (log.targetUser?.email || "").toLowerCase().includes(q) ||
      (log.targetEmail || "").toLowerCase().includes(q)
    );
  });

  if (error) {
    return (
      <div className="space-y-6 p-4 md:p-8">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-bold text-destructive">Access Denied</h2>
          <p className="text-muted-foreground mt-2">You need admin privileges to view audit logs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audit Log</h2>
          <p className="text-muted-foreground">Track all admin actions — role changes, account status changes, and user deletions.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadLogs} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:flex gap-4">
        <div className="rounded-xl border border-border/50 bg-card p-4 flex-1 min-w-[120px]">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Total Events</p>
          <p className="text-2xl font-bold mt-1">{logs.length}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4 flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Role Changes</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{logs.filter((l) => l.action === "USER_ROLE_CHANGED").length}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4 flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Disables</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{logs.filter((l) => l.action === "USER_DISABLED").length}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4 flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Deletions</p>
          <p className="text-2xl font-bold text-destructive mt-1">{logs.filter((l) => l.action === "USER_DELETED").length}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <CardTitle>Event History</CardTitle>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or action..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Performed By</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    Loading audit logs...
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    {search ? "No matching events found." : "No audit events recorded yet."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => {
                  const details = parseDetails(log.details);
                  const targetName = log.targetUser?.name || (details?.targetName as string) || null;

                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <ActionBadge action={log.action} />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{log.performedBy.name}</div>
                        <div className="text-xs text-muted-foreground">{log.performedBy.email}</div>
                      </TableCell>
                      <TableCell>
                        {targetName ? (
                          <>
                            <div className="text-sm">{targetName}</div>
                            <div className="text-xs text-muted-foreground">
                              {log.targetUser?.email || log.targetEmail || "—"}
                            </div>
                          </>
                        ) : log.targetEmail ? (
                          <>
                            <div className="text-sm text-muted-foreground">(deleted user)</div>
                            <div className="text-xs text-muted-foreground">{log.targetEmail}</div>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {log.action === "USER_ROLE_CHANGED" && details ? (
                          <span>
                            <span className="font-medium">{details.targetName as string}</span>:
                            {" "}{(details.fromRole as string)?.replace("_", " ")}
                            {" → "}
                            {(details.toRole as string)?.replace("_", " ")}
                          </span>
                        ) : log.action === "USER_DELETED" ? (
                          <span className="text-destructive">Permanently removed</span>
                        ) : (
                          <span>—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.createdAt), "dd MMM yyyy HH:mm")}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
