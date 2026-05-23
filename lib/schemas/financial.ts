import { z } from "zod";

export const receiptSchema = z.object({
  receiptNo: z.string().optional(),
  date: z.string().or(z.date()),
  donorId: z.string().optional().nullable(),
  type: z.string().min(1, "Type is required"),
  category: z.string().optional().nullable(),
  accountType: z.string().optional().nullable(),
  eventName: z.string().optional().nullable(),
  amount: z.coerce.number().positive("Amount must be positive"),
  paymentMode: z.string().min(1, "Payment mode is required"),
  referenceNo: z.string().optional().nullable(),
  accountId: z.string().min(1, "Account is required"),
  narration: z.string().max(500, "Narration too long").optional().nullable(),
});

export const contraSchema = z.object({
  entryNo: z.string().optional(),
  date: z.string().or(z.date()),
  transferType: z.string().min(1, "Transfer type is required"),
  fromAccountId: z.string().min(1, "From Account is required"),
  toAccountId: z.string().min(1, "To Account is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  reference: z.string().optional().nullable(),
  narration: z.string().max(500, "Narration too long").optional().nullable(),
});

export const journalEntrySchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  debit: z.coerce.number().nonnegative(),
  credit: z.coerce.number().nonnegative(),
});

export const journalVoucherSchema = z.object({
  date: z.string().or(z.date()),
  narration: z.string().max(500, "Narration too long").optional().nullable(),
  entries: z.array(journalEntrySchema).min(2, "At least two entries are required"),
});

export const donorSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
});

export const vendorSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
});

export const accountSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  type: z.string().min(1, "Type is required"),
  balance: z.coerce.number().optional(),
});

export const paymentSchema = z.object({
  voucherNo: z.string().optional(),
  date: z.string().or(z.date()),
  type: z.string().min(1, "Type is required"),
  category: z.string().optional().nullable(),
  accountType: z.string().optional().nullable(),
  amount: z.coerce.number().positive("Amount must be positive"),
  paymentMode: z.string().min(1, "Payment mode is required"),
  chequeNo: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  accountId: z.string().min(1, "Account is required"),
  narration: z.string().max(500, "Narration too long").optional().nullable(),
});
