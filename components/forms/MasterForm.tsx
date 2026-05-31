"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface MasterFormProps {
  type: "donor" | "vendor";
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
  submitAction: (dataOrId: any, data?: any) => Promise<any>;
}

export function MasterForm({ type, initialData, onSuccess, onCancel, submitAction }: MasterFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (initialData?.id) {
        await submitAction(initialData.id, { name, email, phone });
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully!`);
      } else {
        await submitAction({ name, email, phone });
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} created successfully!`);
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || `Failed to save ${type}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Enter name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
      </div>
      <div className="flex justify-end gap-2 pt-4 flex-wrap">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {isSubmitting ? "Saving..." : initialData ? `Update ${type}` : `Create ${type}`}
        </Button>
      </div>
    </form>
  );
}
