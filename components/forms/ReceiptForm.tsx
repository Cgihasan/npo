"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarDatePicker } from "@/components/shared/CalendarDatePicker";
import {
  getDonors,
  getAccounts,
  findOrCreateAccountByLedger,
} from "@/app/actions/masters";
import { createReceipt, updateReceipt, getNextReceiptNumber } from "@/app/actions/receipts";
import {
  JournalAccountPicker,
  type JournalAccountValue,
} from "@/components/forms/JournalAccountPicker";
import { formatAccountFullLabel } from "@/components/forms/AccountForm";

const receiptFormSchema = z.object({
  receiptNo: z.string(),
  date: z.string(),
  donorId: z.string().optional(),
  type: z.string().min(1, "Please select or enter an income ledger."),
  category: z.string().optional(),
  accountType: z.string().optional(),
  eventName: z.string().optional(),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number.",
  }),
  paymentMode: z.string().min(1, "Please select a payment mode."),
  referenceNo: z.string().optional(),
  accountId: z.string().optional(),
  narration: z.string().optional(),
});

type ReceiptFormValues = z.infer<typeof receiptFormSchema>;

interface ReceiptFormProps {
  initialData?: any;
}

export function ReceiptForm({ initialData }: ReceiptFormProps) {
  const router = useRouter();
  const [donors, setDonors] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [depositAccount, setDepositAccount] = useState<JournalAccountValue>({
    accountId: initialData?.accountId || "",
    accountLabel: "",
  });
  const [incomeLedger, setIncomeLedger] = useState<JournalAccountValue>({
    accountId: "",
    accountLabel: initialData?.type || "",
  });

  const assetAccounts = useMemo(
    () => accounts.filter((a) => a.type === "CASH" || a.type === "BANK"),
    [accounts]
  );
  const incomeAccounts = useMemo(
    () => accounts.filter((a) => a.type === "INCOME"),
    [accounts]
  );

  useEffect(() => {
    async function loadData() {
      try {
        const [donorsList, accountsList] = await Promise.all([
          getDonors(),
          getAccounts(),
        ]);
        setDonors(donorsList);
        setAccounts(accountsList);
      } catch (error) {
        toast.error("Failed to load master data.");
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!accounts.length) return;
    if (initialData?.accountId) {
      const acc = accounts.find((a) => a.id === initialData.accountId);
      if (acc) {
        setDepositAccount({
          accountId: acc.id,
          accountLabel: formatAccountFullLabel(acc),
        });
      }
    }
    if (initialData?.type) {
      const match = incomeAccounts.find(
        (a) => a.accountType?.toLowerCase() === initialData.type.toLowerCase()
      );
      setIncomeLedger({
        accountId: match?.id || "",
        accountLabel: initialData.type,
      });
    }
  }, [accounts, incomeAccounts, initialData]);

  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptFormSchema),
    defaultValues: {
      receiptNo: initialData?.receiptNo || "Auto-generated",
      date: initialData?.date 
        ? new Date(initialData.date).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0],
      donorId: initialData?.donorId || "none",
      type: initialData?.type || "",
      category: initialData?.category || "",
      accountType: initialData?.accountType || "",
      eventName: initialData?.eventName || "None",
      amount: initialData?.amount?.toString() || "",
      paymentMode: initialData?.paymentMode || "",
      referenceNo: initialData?.referenceNo || "",
      accountId: initialData?.accountId || "",
      narration: initialData?.narration || "",
    },
  });

  const selectedDate = form.watch("date");

  useEffect(() => {
    async function updateReceiptNo() {
      if (selectedDate && !initialData) {
        try {
          const nextNo = await getNextReceiptNumber(selectedDate);
          form.setValue("receiptNo", nextNo);
        } catch (error) {
          console.error("Failed to fetch next receipt number:", error);
        }
      }
    }
    updateReceiptNo();
  }, [selectedDate, form, initialData]);

  const applyIncomeAccount = (account: {
    id: string;
    accountType?: string | null;
    category?: string | null;
  }) => {
    const ledger = account.accountType || "";
    form.setValue("type", ledger, { shouldValidate: true });
    form.setValue("category", account.category || "Direct Incomes", {
      shouldValidate: true,
    });
    form.setValue("accountType", ledger, { shouldValidate: true });
    setIncomeLedger({
      accountId: account.id,
      accountLabel: ledger,
    });
  };

  async function onSubmit(data: ReceiptFormValues) {
    try {
      setIsSubmitting(true);

      let accountId = data.accountId || depositAccount.accountId;
      if (!accountId && depositAccount.accountLabel.trim()) {
        const acc = await findOrCreateAccountByLedger(
          depositAccount.accountLabel.trim(),
          { hint: "asset" }
        );
        accountId = acc.id;
        setDepositAccount({
          accountId: acc.id,
          accountLabel: formatAccountFullLabel(acc),
        });
      }
      if (!accountId) {
        form.setError("accountId", {
          message: "Please select or enter a deposit account (Cash/Bank).",
        });
        return;
      }

      let type = data.type?.trim() || incomeLedger.accountLabel.trim();
      if (!type) {
        form.setError("type", {
          message: "Please select or enter an income ledger.",
        });
        return;
      }

      const incomeAcc = await findOrCreateAccountByLedger(type, { hint: "income" });
      const payload = {
        ...data,
        accountId,
        type: incomeAcc.accountType || type,
        category: incomeAcc.category || data.category || "Direct Incomes",
        accountType: incomeAcc.accountType || type,
      };

      if (initialData?.id) {
        await updateReceipt(initialData.id, payload);
        toast.success("Receipt updated successfully!");
      } else {
        await createReceipt(payload);
        toast.success("Receipt created successfully!");
      }
      router.push("/receipts");
      router.refresh();
    } catch (error) {
      toast.error(initialData?.id ? "Failed to update receipt." : "Failed to create receipt.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="receiptNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receipt No.</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly className="bg-muted font-mono" />
                    </FormControl>
                    <FormDescription>
                      Generated based on year and sequence.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <CalendarDatePicker
                        label=""
                        value={field.value ? new Date(field.value + "T00:00:00") : new Date()}
                        onChange={(date) => field.onChange(format(date, "yyyy-MM-dd"))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="donorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Received From Donor</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a donor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None / Anonymous</SelectItem>
                        {donors.map((donor) => (
                          <SelectItem key={donor.id} value={donor.id}>{donor.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Income Ledger</FormLabel>
                    <FormControl>
                      <JournalAccountPicker
                        accounts={incomeAccounts}
                        ledgerHint="income"
                        placeholder='e.g. Donation for Startup A/c'
                        value={incomeLedger}
                        onChange={(value) => {
                          setIncomeLedger(value);
                          field.onChange(value.accountLabel);
                          if (value.accountId) {
                            const acc = incomeAccounts.find(
                              (a) => a.id === value.accountId
                            );
                            if (acc) applyIncomeAccount(acc);
                          } else {
                            form.setValue("category", "", { shouldValidate: false });
                            form.setValue("accountType", "", { shouldValidate: false });
                          }
                        }}
                        onAccountCreated={(account) => {
                          setAccounts((prev) =>
                            prev.some((a) => a.id === account.id)
                              ? prev
                              : [...prev, account]
                          );
                          applyIncomeAccount(account);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Type a new income ledger or pick from the chart of accounts.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => <input type="hidden" {...field} />}
              />
              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => <input type="hidden" {...field} />}
              />
              <FormField
                control={form.control}
                name="eventName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select event (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Fund Raise For Islamic Books">Fund Raise For Islamic Books</SelectItem>
                        <SelectItem value="Fund Raise For Air Conditioner">Fund Raise For Air Conditioner</SelectItem>
                        <SelectItem value="Fund Raise For Islamic Class 1st">Fund Raise For Islamic Class 1st</SelectItem>
                        <SelectItem value="Fund Raise For NRC/CAA/NPR Seminar">Fund Raise For NRC/CAA/NPR Seminar</SelectItem>
                        <SelectItem value="Islamic Events 2023 - Madani Jan">Islamic Events 2023 - Madani Jan</SelectItem>
                        <SelectItem value="Islamic Events 2023 - Madani Feb">Islamic Events 2023 - Madani Feb</SelectItem>
                        <SelectItem value="Fundraise For Equipment 2023">Fundraise For Equipment 2023</SelectItem>
                        <SelectItem value="None">None</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Mode</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="referenceNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference No.</FormLabel>
                    <FormControl>
                      <Input placeholder="UTR / Check No." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deposit To (Cash / Bank)</FormLabel>
                    <FormControl>
                      <JournalAccountPicker
                        accounts={assetAccounts}
                        ledgerHint="asset"
                        placeholder="e.g. City Union Bank, Cash In Hand"
                        value={depositAccount}
                        onChange={(value) => {
                          setDepositAccount(value);
                          field.onChange(value.accountId);
                        }}
                        onAccountCreated={(account) => {
                          setAccounts((prev) =>
                            prev.some((a) => a.id === account.id)
                              ? prev
                              : [...prev, account]
                          );
                          setDepositAccount({
                            accountId: account.id,
                            accountLabel: formatAccountFullLabel(account),
                          });
                          field.onChange(account.id);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Type a new cash/bank ledger or select an existing one.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Additional Info</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="narration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Narration</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a brief description..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Receipt"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
