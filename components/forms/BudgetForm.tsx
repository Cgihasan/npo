"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getExpenseAccounts } from "@/app/actions/budgets";

interface BudgetFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
  submitAction: (dataOrId: any, data?: any) => Promise<any>;
}

export function BudgetForm({ initialData, onSuccess, onCancel, submitAction }: BudgetFormProps) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState(initialData?.accountId || "");
  const [fiscalYear, setFiscalYear] = useState(
    initialData?.fiscalYear?.toString() || new Date().getFullYear().toString()
  );
  const [totalAmount, setTotalAmount] = useState(
    initialData?.totalAmount?.toString() || ""
  );
  const [period, setPeriod] = useState(initialData?.period || "ANNUAL");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  useEffect(() => {
    async function loadAccounts() {
      try {
        const accs = await getExpenseAccounts();
        setAccounts(accs);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingAccounts(false);
      }
    }
    loadAccounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      toast.error("Please select an account.");
      return;
    }
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      toast.error("Please enter a valid budget amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        accountId,
        fiscalYear: parseInt(fiscalYear),
        totalAmount: parseFloat(totalAmount),
        period,
      };

      if (initialData?.id) {
        await submitAction(initialData.id, data);
        toast.success("Budget updated successfully!");
      } else {
        await submitAction(data);
        toast.success("Budget created successfully!");
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to save budget.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="account">Expense Account</Label>
        <Select
          value={accountId}
          onValueChange={setAccountId}
          disabled={isLoadingAccounts}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={isLoadingAccounts ? "Loading accounts..." : "Select an expense account"}
            />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>
                {acc.accountType || acc.type}
                {acc.category ? ` (${acc.category})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fiscalYear">Fiscal Year</Label>
          <Input
            id="fiscalYear"
            type="number"
            min={2020}
            max={2100}
            value={fiscalYear}
            onChange={(e) => setFiscalYear(e.target.value)}
            required
            placeholder="e.g., 2026"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="period">Period</Label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ANNUAL">Annual</SelectItem>
              <SelectItem value="QUARTERLY">Quarterly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Budget Amount (₹)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
          required
          placeholder="e.g., 500000"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 flex-wrap">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          {isSubmitting
            ? "Saving..."
            : initialData
            ? "Update Budget"
            : "Create Budget"}
        </Button>
      </div>
    </form>
  );
}
