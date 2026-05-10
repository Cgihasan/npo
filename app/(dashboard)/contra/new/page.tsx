import { ContraForm } from "@/components/forms/ContraForm";

export default function NewContraPage() {
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-indigo-600">New Contra Entry</h2>
        <p className="text-muted-foreground">Move funds between internal accounts safely.</p>
      </div>
      
      <div className="max-w-4xl">
        <ContraForm />
      </div>
    </div>
  );
}
