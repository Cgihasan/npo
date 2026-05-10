"use client";

import { useEffect, useState } from "react";
import { getContraEntries } from "@/app/actions/contra";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRightLeft, MoreVertical, Trash } from "lucide-react";
import Link from "next/link";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export default function ContraPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadEntries() {
      try {
        const data = await getContraEntries();
        setEntries(data);
      } catch (error) {
        // toast error
      } finally {
        setIsLoading(false);
      }
    }
    loadEntries();
  }, []);
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Contra Entries</h2>
          <p className="text-muted-foreground">Transfer money between your own accounts.</p>
        </div>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
          <Link href="/contra/new">
            <Plus className="mr-2 h-4 w-4" /> New Contra Entry
          </Link>
        </Button>
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entry No.</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>From Account</TableHead>
              <TableHead></TableHead>
              <TableHead>To Account</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">Loading entries...</TableCell>
              </TableRow>
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No entries found.</TableCell>
              </TableRow>
            ) : (
              entries.map((entry: any) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium text-indigo-600">{entry.entryNo}</TableCell>
                  <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                  <TableCell>{entry.fromAccountId}</TableCell>
                  <TableCell>
                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell>{entry.toAccountId}</TableCell>
                  <TableCell className="font-bold">₹{Number(entry.amount).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive">
                          <Trash className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
