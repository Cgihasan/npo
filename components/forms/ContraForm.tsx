"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { ArrowRight, Landmark, Banknote } from "lucide-react";
import { motion } from "framer-motion";

import { useEffect, useState } from "react";
import { getAssetAccounts } from "@/app/actions/masters";
import { createContra, updateContra } from "@/app/actions/contra";

const contraFormSchema = z.object({
  entryNo: z.string(),
  date: z.string(),
  transferType: z.enum(["CASH_TO_BANK", "BANK_TO_CASH"]),
  fromAccountId: z.string().min(1, "Required"),
  toAccountId: z.string().min(1, "Required"),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number.",
  }),
  reference: z.string().optional(),
  narration: z.string().optional(),
});

type ContraFormValues = z.infer<typeof contraFormSchema>;

interface ContraFormProps {
  initialData?: any;
}

export function ContraForm({ initialData }: ContraFormProps) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const accountsList = await getAssetAccounts();
        setAccounts(accountsList);
        
        if (!initialData) {
          // Find default cash/bank accounts only for new entries
          const cashAcc = accountsList.find((a: any) => a.type === "CASH");
          const bankAcc = accountsList.find((a: any) => a.type === "BANK");
          
          if (cashAcc && bankAcc) {
            form.setValue("fromAccountId", cashAcc.id);
            form.setValue("toAccountId", bankAcc.id);
          }
        }
      } catch (error) {
        toast.error("Failed to load accounts.");
      }
    }
    loadData();
  }, [initialData]);

  const form = useForm<ContraFormValues>({
    resolver: zodResolver(contraFormSchema),
    defaultValues: {
      entryNo: initialData?.entryNo || `CON-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      date: initialData?.date 
        ? new Date(initialData.date).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0],
      transferType: initialData?.transferType || "CASH_TO_BANK",
      fromAccountId: initialData?.fromAccountId || "",
      toAccountId: initialData?.toAccountId || "",
      amount: initialData?.amount?.toString() || "",
      reference: initialData?.reference || "",
      narration: initialData?.narration || "",
    },
  });

  const transferType = form.watch("transferType");

  async function onSubmit(data: ContraFormValues) {
    try {
      setIsSubmitting(true);
      if (initialData?.id) {
        await updateContra(initialData.id, data);
        toast.success("Contra entry updated!");
      } else {
        await createContra(data);
        toast.success("Contra entry saved!");
      }
      router.push("/contra");
      router.refresh();
    } catch (error) {
      toast.error(initialData?.id ? "Failed to update contra entry." : "Failed to save contra entry.");
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
              <CardTitle>Transfer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="transferType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transfer Type</FormLabel>
                    <Select 
                      onValueChange={(val) => {
                        field.onChange(val);
                        const cashAcc = accounts.find((a: any) => a.type === "CASH");
                        const bankAcc = accounts.find((a: any) => a.type === "BANK");
                        if (val === "CASH_TO_BANK" && cashAcc && bankAcc) {
                          form.setValue("fromAccountId", cashAcc.id);
                          form.setValue("toAccountId", bankAcc.id);
                        } else if (val === "BANK_TO_CASH" && cashAcc && bankAcc) {
                          form.setValue("fromAccountId", bankAcc.id);
                          form.setValue("toAccountId", cashAcc.id);
                        }
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CASH_TO_BANK">Cash to Bank</SelectItem>
                        <SelectItem value="BANK_TO_CASH">Bank to Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg border border-dashed">
                <div className="flex flex-col items-center gap-2">
                  {transferType === "CASH_TO_BANK" ? <Banknote className="h-8 w-8 text-emerald-500" /> : <Landmark className="h-8 w-8 text-indigo-500" />}
                  <span className="text-xs font-medium">{transferType === "CASH_TO_BANK" ? "Cash Account" : "Bank Account"}</span>
                </div>
                
                <motion.div
                  animate={{ x: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                </motion.div>

                <div className="flex flex-col items-center gap-2">
                  {transferType === "CASH_TO_BANK" ? <Landmark className="h-8 w-8 text-indigo-500" /> : <Banknote className="h-8 w-8 text-emerald-500" />}
                  <span className="text-xs font-medium">{transferType === "CASH_TO_BANK" ? "Bank Account" : "Cash Account"}</span>
                </div>
              </div>

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount to Transfer (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Entry Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="entryNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry No.</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly />
                    </FormControl>
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
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference (e.g. Deposit Slip No.)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
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
                      placeholder="Details about the transfer..."
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
          <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Confirm Transfer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
