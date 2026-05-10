import { ReceiptForm } from "@/components/forms/ReceiptForm";

export default function NewReceiptPage() {
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-emerald-600">New Receipt</h2>
        <p className="text-muted-foreground">Create a new income entry for your organization.</p>
      </div>
      
      <div className="max-w-4xl">
        <ReceiptForm />
      </div>
    </div>
  );
}
