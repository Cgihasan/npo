"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface AccountFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
  submitAction: (dataOrId: any, data?: any) => Promise<any>;
}

export function AccountForm({ initialData, onSuccess, onCancel, submitAction }: AccountFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [type, setType] = useState(initialData?.type || "");
  const [balance, setBalance] = useState(initialData?.balance !== undefined ? String(initialData.balance) : "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) {
      toast.error("Please select an account type");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { 
        name, 
        type, 
        balance: balance ? Number(balance) : 0,
        description
      };

      if (initialData?.id) {
        await submitAction(initialData.id, payload);
        toast.success("Account updated successfully!");
      } else {
        await submitAction(payload);
        toast.success("Account created successfully!");
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to save account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="name">Account Name</Label>
        <Input 
          id="name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
          placeholder="e.g., Rent Advance, Paint Expenses" 
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="type">Account Type</Label>
        <Select value={type} onValueChange={setType} required>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ASSET">Asset</SelectItem>
            <SelectItem value="LIABILITY">Liability</SelectItem>
            <SelectItem value="INCOME">Income</SelectItem>
            <SelectItem value="EXPENSE">Expense</SelectItem>
            <SelectItem value="BANK">Bank</SelectItem>
            <SelectItem value="CASH">Cash</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="balance">Opening Balance (Optional)</Label>
        <Input 
          id="balance" 
          type="number" 
          step="0.01" 
          value={balance} 
          onChange={(e) => setBalance(e.target.value)} 
          placeholder="0.00" 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add account details or notes"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
          {isSubmitting ? "Saving..." : initialData ? "Update Account" : "Create Account"}
        </Button>
      </div>
    </form>
  );
}
