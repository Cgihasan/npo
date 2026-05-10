import { PaymentForm } from "@/components/forms/PaymentForm";

export default function NewPaymentPage() {
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-amber-600">New Payment</h2>
        <p className="text-muted-foreground">Record a new expense payment.</p>
      </div>
      
      <div className="max-w-4xl">
        <PaymentForm />
      </div>
    </div>
  );
}
