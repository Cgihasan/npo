"use client";

import { useEffect, useState } from "react";
import {
  getBudgets,
  deleteBudget,
} from "@/app/actions/budgets";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreVertical,
  Edit,
  Trash,
  Target,
  Search,
} from "lucide-react";
import { BudgetForm } from "@/components/forms/BudgetForm";
import { createBudget, updateBudget } from "@/app/actions/budgets";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getBudgets();
      setBudgets(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = budgets.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const accountName = b.account?.accountType || b.account?.type || "";
    return (
      accountName.toLowerCase().includes(q) ||
      b.fiscalYear.toString().includes(q) ||
      b.period.toLowerCase().includes(q)
    );
  });

  const openEditDialog = (budget: any) => {
    setEditingBudget(budget);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingBudget(null);
  };

  const handleDelete = async () => {
    if (!budgetToDelete) return;
    setIsDeleting(true);
    try {
      await deleteBudget(budgetToDelete.id);
      toast.success("Budget deleted successfully");
      setIsDeleteDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete budget");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalBudgeted = budgets.reduce((s, b) => s + b.totalAmount, 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget Management</h1>
          <p className="text-muted-foreground mt-1">
            Set and track spending limits across expense categories.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingBudget(null);
            setIsDialogOpen(true);
          }}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> New Budget
        </Button>
      </div>

      {/* Summary Cards */}
      {!isLoading && budgets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">
              Total Budgeted
            </p>
            <p className="text-2xl font-bold">
              ₹{totalBudgeted.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">
              Total Spent
            </p>
            <p className="text-2xl font-bold">
              ₹{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">
              Overall Utilization
            </p>
            <p className="text-2xl font-bold">
              {totalBudgeted > 0
                ? Math.round((totalSpent / totalBudgeted) * 100)
                : 0}
              <span className="text-lg text-muted-foreground font-normal">%</span>
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search budgets..."
          className="pl-9 rounded-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Budget Table */}
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h3 className="font-semibold">All Budgets</h3>
          <span className="text-xs text-muted-foreground">
            {filtered.length} budget{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead className="w-20">FY</TableHead>
                <TableHead className="w-24">Period</TableHead>
                <TableHead className="w-36 text-right">Budgeted</TableHead>
                <TableHead className="w-36 text-right">Spent</TableHead>
                <TableHead className="w-36 text-right">Remaining</TableHead>
                <TableHead className="w-44">Utilization</TableHead>
                <TableHead className="w-16 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-3 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="rounded-full bg-muted p-3">
                        <Target className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="font-semibold">
                        {search ? "No budgets found" : "No budgets created yet"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {search
                          ? "Try a different search term."
                          : "Create your first budget to start tracking expenses."}
                      </p>
                      {!search && (
                        <Button
                          onClick={() => {
                            setEditingBudget(null);
                            setIsDialogOpen(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="mt-2"
                        >
                          <Plus className="mr-2 h-4 w-4" /> New Budget
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((budget) => {
                  const percent = budget.utilizationPercent || 0;
                  const barColor =
                    percent < 50
                      ? "bg-emerald-500"
                      : percent < 80
                      ? "bg-amber-500"
                      : "bg-rose-500";

                  return (
                    <TableRow key={budget.id}>
                      <TableCell className="font-medium">
                        {budget.account?.accountType || budget.account?.type || "—"}
                        {budget.account?.category && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({budget.account.category})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {budget.fiscalYear}-{budget.fiscalYear + 1}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {budget.period}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        ₹{Number(budget.totalAmount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right font-mono text-amber-600 font-medium">
                        ₹{Number(budget.spent || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <span
                          className={
                            (budget.remaining || 0) < 0
                              ? "text-rose-600 font-medium"
                              : "text-emerald-600 font-medium"
                          }
                        >
                          ₹{Number(budget.remaining || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                              style={{ width: `${Math.min(percent, 100)}%` }}
                            />
                          </div>
                          <span
                            className={`text-xs font-semibold tabular-nums ${
                              percent < 50
                                ? "text-emerald-600"
                                : percent < 80
                                ? "text-amber-600"
                                : "text-rose-600"
                            }`}
                          >
                            {percent}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(budget)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setBudgetToDelete(budget);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBudget ? "Edit Budget" : "Create New Budget"}
            </DialogTitle>
            <DialogDescription>
              {editingBudget
                ? "Update the budget allocation for this account."
                : "Set a spending limit for an expense account for the fiscal year."}
            </DialogDescription>
          </DialogHeader>
          <BudgetForm
            initialData={editingBudget}
            onSuccess={() => {
              closeDialog();
              loadData();
            }}
            onCancel={closeDialog}
            submitAction={editingBudget ? updateBudget : createBudget}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will permanently delete the budget for{' '}
              <strong>
                {budgetToDelete?.account?.accountType || budgetToDelete?.account?.type}
              </strong>{' '}
              (FY {budgetToDelete?.fiscalYear}-{budgetToDelete?.fiscalYear + 1}).
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
