import { getReceiptById } from "@/app/actions/receipts";
import { ReceiptForm } from "@/components/forms/ReceiptForm";
import { notFound } from "next/navigation";

export default async function EditReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const receipt = await getReceiptById(id);

  if (!receipt) {
    notFound();
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-emerald-600">Edit Receipt</h2>
        <p className="text-muted-foreground">Update receipt details for {receipt.receiptNo}.</p>
      </div>
      
      <div className="max-w-4xl">
        <ReceiptForm initialData={receipt} />
      </div>
    </div>
  );
}
