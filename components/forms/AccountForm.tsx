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
  onSuccess: () => void;
  onCancel: () => void;
  submitAction: (data: any) => Promise<any>;
}

export function AccountForm({ onSuccess, onCancel, submitAction }: AccountFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [balance, setBalance] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) {
      toast.error("Please select an account type");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitAction({ 
        name, 
        type, 
        balance: balance ? Number(balance) : 0 
      });
      toast.success("Account created successfully!");
      onSuccess();
    } catch (error) {
      toast.error("Failed to create account.");
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

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
          {isSubmitting ? "Creating..." : "Create Account"}
        </Button>
      </div>
    </form>
  );
}
