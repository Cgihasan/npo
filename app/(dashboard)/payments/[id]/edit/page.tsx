import { getPaymentById } from "@/app/actions/payments";
import { PaymentForm } from "@/components/forms/PaymentForm";
import { notFound } from "next/navigation";

export default async function EditPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payment = await getPaymentById(id);

  if (!payment) {
    notFound();
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-amber-600">Edit Payment</h2>
        <p className="text-muted-foreground">Update payment details for {payment.voucherNo}.</p>
      </div>
      
      <div className="max-w-4xl">
        <PaymentForm initialData={payment} />
      </div>
    </div>
  );
}
