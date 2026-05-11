import { getContraById } from "@/app/actions/contra";
import { ContraForm } from "@/components/forms/ContraForm";
import { notFound } from "next/navigation";

export default async function EditContraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contra = await getContraById(id);

  if (!contra) {
    notFound();
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-indigo-600">Edit Contra Entry</h2>
        <p className="text-muted-foreground">Update transfer details for {contra.entryNo}.</p>
      </div>
      
      <div className="max-w-4xl">
        <ContraForm initialData={contra} />
      </div>
    </div>
  );
}
