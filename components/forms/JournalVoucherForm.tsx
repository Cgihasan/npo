"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAccounts, findOrCreateAccountByLedger } from "@/app/actions/masters";
import { JournalEntryInput } from "@/app/actions/journal";
import {
  JournalAccountPicker,
  type JournalAccountValue,
} from "@/components/forms/JournalAccountPicker";
import { toast } from "sonner";
import { Plus, Trash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type JournalVoucherFormData = {
  date: string;
  narration: string;
  entries: JournalEntryInput[];
};

interface JournalVoucherFormProps {
  initialData?: {
    date: string;
    narration: string;
    transactions: {
      id: string;
      accountId: string;
      account?: {
        accountType?: string;
        type?: string;
      };
      debit: number;
      credit: number;
    }[];
  };
  onSubmit: (data: JournalVoucherFormData) => Promise<void>;
  submitButtonText?: string;
  isSubmitting?: boolean;
}

export function JournalVoucherForm({
  initialData,
  onSubmit,
  submitButtonText = "Save Voucher",
  isSubmitting = false,
}: JournalVoucherFormProps) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split("T")[0]);
  const [narration, setNarration] = useState(initialData?.narration || "");
  const [entries, setEntries] = useState<
    { id: number; accountId: string; accountLabel: string; debit: string; credit: string }[]
  >(
    initialData?.transactions
      ? initialData.transactions.map((t, index) => ({
          id: index,
          accountId: t.accountId,
          accountLabel: t.account?.accountType || t.account?.type || "",
          debit: t.debit.toString(),
          credit: t.credit.toString(),
        }))
      : [{ id: Date.now(), accountId: "", accountLabel: "", debit: "", credit: "" }]
  );

  useEffect(() => {
    async function loadData() {
      try {
        const accs = await getAccounts();
        setAccounts(accs);
      } catch (error) {
        toast.error("Failed to load accounts");
      }
    }
    loadData();
  }, []);

  // If initialData changes, update state
  useEffect(() => {
    if (initialData) {
      setDate(initialData.date);
      setNarration(initialData.narration);
      setEntries(
        initialData.transactions.map((t, index) => ({
          id: index,
          accountId: t.accountId,
          accountLabel: t.account?.accountType || t.account?.type || "",
          debit: t.debit.toString(),
          credit: t.credit.toString(),
        }))
      );
    }
  }, [initialData]);

  const handleAddRow = () => {
    setEntries([
      ...entries,
      { id: Date.now(), accountId: "", accountLabel: "", debit: "", credit: "" }
    ]);
  };

  const handleRemoveRow = (id: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  const updateEntry = (id: number, field: string, value: string) => {
    setEntries(entries.map(e => {
      if (e.id === id) {
        const updated = { ...e, [field]: value };
        if (field === "debit" && Number(value) > 0) {
          updated.credit = "";
        }
        if (field === "credit" && Number(value) > 0) {
          updated.debit = "";
        }
        return updated;
      }
      return e;
    }));
  };

  const updateEntryAccount = (id: number, account: JournalAccountValue) => {
    setEntries(entries.map(e =>
      e.id === id
        ? { ...e, accountId: account.accountId, accountLabel: account.accountLabel }
        : e
    ));
  };

  const handleAccountCreated = (account: { id: string; type: string; category?: string | null; accountType?: string | null }) => {
    setAccounts((prev) => {
      if (prev.some((a) => a.id === account.id)) return prev;
      return [...prev, account];
    });
  };

  const totalDebit = entries.reduce((sum, e) => sum + (Number(e.debit) || 0), 0);
  const totalCredit = entries.reduce((sum, e) => sum + (Number(e.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
  const hasAmount = totalDebit > 0;
  const isFormValid =
    isBalanced &&
    hasAmount &&
    date &&
    entries.every((e) => e.accountId !== "" || e.accountLabel.trim() !== "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error("Please ensure the journal is balanced and all accounts are selected.");
      return;
    }

    try {
      const resolvedEntries = await Promise.all(
        entries.map(async (e) => {
          let accountId = e.accountId;
          if (!accountId && e.accountLabel.trim()) {
            const account = await findOrCreateAccountByLedger(e.accountLabel.trim());
            accountId = account.id;
          }
          return {
            accountId,
            debit: Number(e.debit) || 0,
            credit: Number(e.credit) || 0,
          };
        })
      );

      await onSubmit({
        date,
        narration,
        entries: resolvedEntries,
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to process journal voucher");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Voucher Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="narration">Narration</Label>
            <Textarea
              id="narration"
              placeholder="Description of the transaction..."
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Entries</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={handleAddRow}>
            <Plus className="mr-2 h-4 w-4" /> Add Row
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground mb-2 hidden md:grid">
              <div className="col-span-5">Account</div>
              <div className="col-span-3 text-right">Debit</div>
              <div className="col-span-3 text-right">Credit</div>
              <div className="col-span-1"></div>
            </div>

            {entries.map((entry) => (
              <div key={entry.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end md:items-center p-4 md:p-0 border rounded-md md:border-0 bg-muted/20 md:bg-transparent">
                <div className="col-span-1 md:col-span-5 space-y-2 md:space-y-0">
                  <Label className="md:hidden">Account</Label>
                  <JournalAccountPicker
                    accounts={accounts}
                    value={{
                      accountId: entry.accountId,
                      accountLabel: entry.accountLabel,
                    }}
                    onChange={(account) => updateEntryAccount(entry.id, account)}
                    onAccountCreated={handleAccountCreated}
                  />
                </div>

                <div className="col-span-1 md:col-span-3 space-y-2 md:space-y-0">
                  <Label className="md:hidden">Debit</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="text-right"
                    value={entry.debit}
                    onChange={(e) => updateEntry(entry.id, "debit", e.target.value)}
                  />
                </div>

                <div className="col-span-1 md:col-span-3 space-y-2 md:space-y-0">
                  <Label className="md:hidden">Credit</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="text-right"
                    value={entry.credit}
                    onChange={(e) => updateEntry(entry.id, "credit", e.target.value)}
                  />
                </div>

                <div className="col-span-1 md:col-span-1 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive w-full md:w-auto"
                    onClick={() => handleRemoveRow(entry.id)}
                    disabled={entries.length === 1}
                  >
                    <Trash className="h-4 w-4 mr-2 md:mr-0" />
                    <span className="md:hidden">Remove Row</span>
                  </Button>
                </div>
              </div>
            ))}

            <div className="pt-4 border-t mt-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="col-span-1 md:col-span-4 text-left font-bold">
                    Total
                  </div>
                  <div className="col-span-1 md:col-span-4 text-right font-bold text-lg">
                    ₹{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="col-span-1 md:col-span-4 text-right font-bold text-lg">
                    ₹{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

              {!isBalanced && hasAmount && (
                <p className="text-destructive text-right mt-2 text-sm font-medium">
                  Difference: ₹{Math.abs(totalDebit - totalCredit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Debits must equal Credits)
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4 flex-wrap">
        <Button 
          type="submit" 
          className="bg-blue-600 hover:bg-blue-700" 
          disabled={isSubmitting || !isFormValid}
        >
          {isSubmitting ? "Processing..." : submitButtonText}
        </Button>
      </div>
    </form>
  );
}
