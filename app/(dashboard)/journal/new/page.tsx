"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createJournalVoucher } from "@/app/actions/journal";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { JournalVoucherForm } from "@/components/forms/JournalVoucherForm";

export default function NewJournalPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await createJournalVoucher(data);
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

      <JournalVoucherForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
