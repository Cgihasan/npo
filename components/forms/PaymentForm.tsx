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
  getAccounts,
  findOrCreateAccountByLedger,
} from "@/app/actions/masters";
import { createPayment, updatePayment, getNextVoucherNumber } from "@/app/actions/payments";
import {
  JournalAccountPicker,
  type JournalAccountValue,
} from "@/components/forms/JournalAccountPicker";
import { formatAccountFullLabel } from "@/components/forms/AccountForm";

const paymentFormSchema = z.object({
  voucherNo: z.string(),
  date: z.string(),
  type: z.string().min(1, "Please select or enter an expense ledger."),
  category: z.string().optional(),
  accountType: z.string().optional(),
  eventName: z.string().optional(),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number.",
  }),
  paymentMode: z.string().min(1, "Please select a payment mode."),
  chequeNo: z.string().optional(),
  bankName: z.string().optional(),
  accountId: z.string().optional(),
  narration: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentFormProps {
  initialData?: any;
}

export function PaymentForm({ initialData }: PaymentFormProps) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payFromAccount, setPayFromAccount] = useState<JournalAccountValue>({
    accountId: initialData?.accountId || "",
    accountLabel: "",
  });
  const [expenseLedger, setExpenseLedger] = useState<JournalAccountValue>({
    accountId: "",
    accountLabel: initialData?.type || "",
  });

  const assetAccounts = useMemo(
    () => accounts.filter((a) => a.type === "CASH" || a.type === "BANK"),
    [accounts]
  );
  const expenseAccounts = useMemo(
    () => accounts.filter((a) => a.type === "EXPENSE"),
    [accounts]
  );

  useEffect(() => {
    async function loadData() {
      try {
        const accountsList = await getAccounts();
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
        setPayFromAccount({
          accountId: acc.id,
          accountLabel: formatAccountFullLabel(acc),
        });
      }
    }
    if (initialData?.type) {
      const match = expenseAccounts.find(
        (a) => a.accountType?.toLowerCase() === initialData.type.toLowerCase()
      );
      setExpenseLedger({
        accountId: match?.id || "",
        accountLabel: initialData.type,
      });
    }
  }, [accounts, expenseAccounts, initialData]);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      voucherNo: initialData?.voucherNo || "Auto-generated",
      date: initialData?.date 
        ? new Date(initialData.date).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0],
      type: initialData?.type || "",
      category: initialData?.category || "",
      accountType: initialData?.accountType || "",
      amount: initialData?.amount?.toString() || "",
      paymentMode: initialData?.paymentMode || "",
      chequeNo: initialData?.chequeNo || "",
      bankName: initialData?.bankName || "",
      accountId: initialData?.accountId || "",
      eventName: initialData?.eventName || "None",
      narration: initialData?.narration || "",
    },
  });

  const selectedDate = form.watch("date");
  const selectedType = form.watch("type");
  const showEventName = selectedType === "Events Expenses";

  useEffect(() => {
    if (!showEventName) {
      form.setValue("eventName", "None", { shouldValidate: false });
    }
  }, [showEventName, form]);

  useEffect(() => {
    async function updateVoucherNo() {
      if (selectedDate && !initialData) {
        try {
          const nextNo = await getNextVoucherNumber(selectedDate);
          form.setValue("voucherNo", nextNo);
        } catch (error) {
          console.error("Failed to fetch next voucher number:", error);
        }
      }
    }
    updateVoucherNo();
  }, [selectedDate, form, initialData]);

  const applyExpenseAccount = (account: {
    id: string;
    accountType?: string | null;
    category?: string | null;
  }) => {
    const ledger = account.accountType || "";
    form.setValue("type", ledger, { shouldValidate: true });
    form.setValue("category", account.category || "Indirect Expenses", {
      shouldValidate: true,
    });
    form.setValue("accountType", ledger, { shouldValidate: true });
    setExpenseLedger({
      accountId: account.id,
      accountLabel: ledger,
    });
  };

  async function onSubmit(data: PaymentFormValues) {
    try {
      setIsSubmitting(true);

      let accountId = data.accountId || payFromAccount.accountId;
      if (!accountId && payFromAccount.accountLabel.trim()) {
        const acc = await findOrCreateAccountByLedger(
          payFromAccount.accountLabel.trim(),
          { hint: "asset" }
        );
        accountId = acc.id;
        setPayFromAccount({
          accountId: acc.id,
          accountLabel: formatAccountFullLabel(acc),
        });
      }
      if (!accountId) {
        form.setError("accountId", {
          message: "Please select or enter a payment account (Cash/Bank).",
        });
        return;
      }

      let type = data.type?.trim() || expenseLedger.accountLabel.trim();
      if (!type) {
        form.setError("type", {
          message: "Please select or enter an expense ledger.",
        });
        return;
      }

      const expenseAcc = await findOrCreateAccountByLedger(type, {
        hint: "expense",
      });
      const payload = {
        ...data,
        accountId,
        type: expenseAcc.accountType || type,
        category: expenseAcc.category || data.category || "Indirect Expenses",
        accountType: expenseAcc.accountType || type,
      };

      if (initialData?.id) {
        await updatePayment(initialData.id, payload);
        toast.success("Payment updated successfully!");
      } else {
        await createPayment(payload);
        toast.success("Payment voucher created!");
      }
      router.push("/payments");
      router.refresh();
    } catch (error) {
      toast.error(initialData?.id ? "Failed to update payment." : "Failed to create payment.");
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
              <CardTitle>Voucher Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="voucherNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voucher No.</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly className="bg-muted font-mono" />
                    </FormControl>
                    <FormDescription>
                      Sequential based on year.
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expense Ledger</FormLabel>
                    <FormControl>
                      <JournalAccountPicker
                        accounts={expenseAccounts}
                        ledgerHint="expense"
                        placeholder="e.g. Office Rent, Staff Salaries"
                        value={expenseLedger}
                        onChange={(value) => {
                          setExpenseLedger(value);
                          field.onChange(value.accountLabel);
                          if (value.accountId) {
                            const acc = expenseAccounts.find(
                              (a) => a.id === value.accountId
                            );
                            if (acc) applyExpenseAccount(acc);
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
                          applyExpenseAccount(account);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Type a new expense ledger or pick from the chart of accounts.
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
              {showEventName && (
                <FormField
                  control={form.control}
                  name="eventName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Name</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select event" />
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
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financial Details</CardTitle>
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
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pay From (Cash / Bank)</FormLabel>
                    <FormControl>
                      <JournalAccountPicker
                        accounts={assetAccounts}
                        ledgerHint="asset"
                        placeholder="e.g. Cash In Hand, City Union Bank"
                        value={payFromAccount}
                        onChange={(value) => {
                          setPayFromAccount(value);
                          field.onChange(value.accountId);
                        }}
                        onAccountCreated={(account) => {
                          setAccounts((prev) =>
                            prev.some((a) => a.id === account.id)
                              ? prev
                              : [...prev, account]
                          );
                          setPayFromAccount({
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
            <CardTitle>Narration</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="narration"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Enter payment description..."
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

        <div className="flex justify-end gap-4 flex-wrap">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Payment"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
