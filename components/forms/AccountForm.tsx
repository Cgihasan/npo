"use client";

import { useState } from "react";
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

interface AccountFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
  submitAction: (dataOrId: any, data?: any) => Promise<any>;
}

const CATEGORY_OPTIONS: Record<string, string[]> = {
  INCOME: ["Direct Incomes", "Indirect Incomes"],
  EXPENSE: ["Indirect Expenses", "Fixed Assets", "Deposits (Assets)"],
};

const ACCOUNT_TYPE_OPTIONS: Record<string, string[]> = {
  INCOME: ["Donation A/C", "Bank Interest", "Revesal Charges"],
  EXPENSE: ["Revenue Exp", "Other Exp"],
};

const TYPE_OPTIONS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK", label: "Bank" },
  { value: "INCOME", label: "Income" },
  { value: "EXPENSE", label: "Expense" },
  { value: "ASSET", label: "Asset" },
  { value: "LIABILITY", label: "Liability" },
];

const TYPE_LABELS = Object.fromEntries(TYPE_OPTIONS.map((o) => [o.value, o.label]));

export function getAccountGroup(acc: { type: string; category?: string | null }) {
  if (acc.category) return acc.category;
  return TYPE_LABELS[acc.type] || acc.type;
}

export function getAccountLedger(acc: {
  type: string;
  category?: string | null;
  accountType?: string | null;
}) {
  if (acc.accountType) return acc.accountType;
  return null;
}

function formatAccountLabel(acc: any) {
  const ledger = getAccountLedger(acc);
  if (ledger) return ledger;
  return getAccountGroup(acc);
}

export function formatAccountFullLabel(acc: {
  type: string;
  category?: string | null;
  accountType?: string | null;
}) {
  if (acc.type === "CASH" || acc.type === "BANK") {
    return acc.accountType || acc.type;
  }
  return [acc.type, acc.category, acc.accountType].filter(Boolean).join(" - ");
}

export { formatAccountLabel };

export function AccountForm({ initialData, onSuccess, onCancel, submitAction }: AccountFormProps) {
  const [type, setType] = useState(initialData?.type || "");
  const [category, setCategory] = useState(initialData?.category || "");
  const [accountType, setAccountType] = useState(initialData?.accountType || "");
  const [balance, setBalance] = useState(initialData?.balance !== undefined ? String(initialData.balance) : "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCashOrBank = type === "CASH" || type === "BANK";
  const showCategory = !isCashOrBank && type !== "ASSET" && type !== "LIABILITY";
  const showAccountTypeSelect = type === "INCOME" || type === "EXPENSE";
  const showAccountTypeInput = isCashOrBank;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) {
      toast.error("Please select a type");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = { 
        type,
        balance: balance ? Number(balance) : 0 
      };

      if (showCategory) {
        payload.category = category || null;
      }
      if (showAccountTypeSelect || showAccountTypeInput) {
        payload.accountType = accountType || null;
      }

      if (initialData?.id) {
        await submitAction(initialData.id, payload);
        toast.success("Account updated successfully!");
      } else {
        await submitAction(payload);
        toast.success("Account created successfully!");
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to save account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select value={type} onValueChange={(v) => { setType(v); setCategory(""); setAccountType(""); }} required>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showCategory && (
        <div className="space-y-2">
          <Label htmlFor="category">Group</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select group" />
            </SelectTrigger>
            <SelectContent>
              {(CATEGORY_OPTIONS[type] || []).map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showAccountTypeInput && (
        <div className="space-y-2">
          <Label htmlFor="accountType">Ledger</Label>
          <Input
            id="accountType"
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            placeholder={type === "BANK" ? "e.g., City Union Bank" : "e.g., Cash In Hand"}
          />
        </div>
      )}

      {showAccountTypeSelect && (
        <div className="space-y-2">
          <Label htmlFor="accountType">Ledger</Label>
          <Select value={accountType} onValueChange={setAccountType}>
            <SelectTrigger>
              <SelectValue placeholder="Select ledger" />
            </SelectTrigger>
            <SelectContent>
              {(ACCOUNT_TYPE_OPTIONS[type] || []).map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="balance">Opening Balance (Optional)</Label>
        <Input 
          id="balance" 
          type="number" 
          step="0.01" 
          value={balance} 
          onChange={(e) => setBalance(e.target.value)} 
          placeholder="0.00" 
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
          {isSubmitting ? "Saving..." : initialData ? "Update Account" : "Create Account"}
        </Button>
      </div>
    </form>
  );
}
