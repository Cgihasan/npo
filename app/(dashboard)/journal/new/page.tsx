"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAccounts } from "@/app/actions/masters";
import { createJournalVoucher } from "@/app/actions/journal";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewJournalPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [narration, setNarration] = useState("");
  const [entries, setEntries] = useState([{ id: 1, accountId: "", debit: "", credit: "" }]);

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

  const handleAddRow = () => {
    setEntries([
      ...entries,
      { id: Date.now(), accountId: "", debit: "", credit: "" }
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
        // If user enters debit, clear credit and vice versa
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

  const totalDebit = entries.reduce((sum, e) => sum + (Number(e.debit) || 0), 0);
  const totalCredit = entries.reduce((sum, e) => sum + (Number(e.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
  const hasAmount = totalDebit > 0;
  const isFormValid = isBalanced && hasAmount && date && entries.every(e => e.accountId !== "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error("Please ensure the journal is balanced and all accounts are selected.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createJournalVoucher({
        date,
        narration,
        entries: entries.map(e => ({
          accountId: e.accountId,
          debit: Number(e.debit) || 0,
          credit: Number(e.credit) || 0
        }))
      });
      toast.success("Journal voucher created successfully");
      router.push("/journal");
    } catch (error: any) {
      toast.error(error.message || "Failed to create journal voucher");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/journal">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">New Journal Voucher</h2>
          <p className="text-muted-foreground">Create a new double-entry journal transaction.</p>
        </div>
      </div>

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
                <div className="col-span-6">Account</div>
                <div className="col-span-2 text-right">Debit</div>
                <div className="col-span-2 text-right">Credit</div>
                <div className="col-span-2"></div>
              </div>

              {entries.map((entry, index) => (
                <div key={entry.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end md:items-center p-4 md:p-0 border rounded-md md:border-0 bg-muted/20 md:bg-transparent">
                  <div className="col-span-1 md:col-span-6 space-y-2 md:space-y-0">
                    <Label className="md:hidden">Account</Label>
                    <Select
                      value={entry.accountId}
                      onValueChange={(value) => updateEntry(entry.id, "accountId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-1 md:col-span-2 space-y-2 md:space-y-0">
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

                  <div className="col-span-1 md:col-span-2 space-y-2 md:space-y-0">
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

                  <div className="col-span-1 md:col-span-2 text-right">
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
                  <div className="col-span-1 md:col-span-6 text-right font-bold">
                    Total
                  </div>
                  <div className="col-span-1 md:col-span-2 text-right font-bold text-lg">
                    ₹{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="col-span-1 md:col-span-2 text-right font-bold text-lg">
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

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/journal">Cancel</Link>
          </Button>
          <Button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700" 
            disabled={isSubmitting || !isFormValid}
          >
            {isSubmitting ? "Creating..." : "Save Voucher"}
          </Button>
        </div>
      </form>
    </div>
  );
}
