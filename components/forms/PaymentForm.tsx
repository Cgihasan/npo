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

import { useEffect, useState } from "react";
import { getVendors, getAssetAccounts } from "@/app/actions/masters";
import { createPayment, updatePayment, getNextVoucherNumber } from "@/app/actions/payments";

const paymentFormSchema = z.object({
  voucherNo: z.string(),
  date: z.string(),
  type: z.string().min(1, "Please select a payment type."),
  category: z.string().min(1, "Please select an account category."),
  accountType: z.string().min(1, "Please select an account type."),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number.",
  }),
  paymentMode: z.string().min(1, "Please select a payment mode."),
  chequeNo: z.string().optional(),
  bankName: z.string().optional(),
  accountId: z.string().min(1, "Please select an account head."),
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

  useEffect(() => {
    async function loadData() {
      try {
        const accountsList = await getAssetAccounts();
        setAccounts(accountsList);
      } catch (error) {
        toast.error("Failed to load master data.");
      }
    }
    loadData();
  }, []);

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
      narration: initialData?.narration || "",
    },
  });

  const selectedDate = form.watch("date");

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

  async function onSubmit(data: PaymentFormValues) {
    try {
      setIsSubmitting(true);
      if (initialData?.id) {
        await updatePayment(initialData.id, data);
        toast.success("Payment updated successfully!");
      } else {
        await createPayment(data);
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
                      <Input type="date" {...field} />
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
                    <FormLabel>Payment Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Registration & Paper Works">Registration & Paper Works</SelectItem>
                        <SelectItem value="Printing Expenese">Printing Expenese</SelectItem>
                        <SelectItem value="Office Expenses">Office Expenses</SelectItem>
                        <SelectItem value="Office Rent Advance">Office Rent Advance</SelectItem>
                        <SelectItem value="Office Stationery">Office Stationery</SelectItem>
                        <SelectItem value="Legal Advisor">Legal Advisor</SelectItem>
                        <SelectItem value="Tea Expenses">Tea Expenses</SelectItem>
                        <SelectItem value="Office Equipments">Office Equipments</SelectItem>
                        <SelectItem value="Furniture">Furniture</SelectItem>
                        <SelectItem value="Islamic Book Purchased">Islamic Book Purchased</SelectItem>
                        <SelectItem value="Delivery Charges">Delivery Charges</SelectItem>
                        <SelectItem value="Bank Charges">Bank Charges</SelectItem>
                        <SelectItem value="Office Rent">Office Rent</SelectItem>
                        <SelectItem value="Electricity">Electricity</SelectItem>
                        <SelectItem value="Telephone & Internet Bills">Telephone & Internet Bills</SelectItem>
                        <SelectItem value="Events Expenses">Events Expenses</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Indirect Expenses">Indirect Expenses</SelectItem>
                        <SelectItem value="Deposits (Assets)">Deposits (Assets)</SelectItem>
                        <SelectItem value="Fixed Assets">Fixed Assets</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Revenue Exp">Revenue Exp</SelectItem>
                        <SelectItem value="Other Exp">Other Exp</SelectItem>
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
                    <FormLabel>Pay From (Account Head)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>{acc.accountType || acc.type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

        <div className="flex justify-end gap-4">
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
