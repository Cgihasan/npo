"use client";

import { useEffect, useState } from "react";
import { getJournalVouchers, deleteJournalVoucher } from "@/app/actions/journal";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, MoreVertical, Edit, Trash } from "lucide-react";
import Link from "next/link";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function JournalPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadVouchers() {
      try {
        const data = await getJournalVouchers();
        setVouchers(data);
      } catch (error) {
        toast.error("Failed to load journal vouchers.");
      } finally {
        setIsLoading(false);
      }
    }
    loadVouchers();
  }, []);

  const handleDelete = async () => {
    if (!selectedVoucher) return;
    try {
      setIsDeleting(true);
      await deleteJournalVoucher(selectedVoucher.id);
      setVouchers(vouchers.filter(v => v.id !== selectedVoucher.id));
      toast.success("Journal voucher deleted successfully");
      setIsDeleteAlertOpen(false);
    } catch (error) {
      toast.error("Failed to delete journal voucher");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredVouchers = vouchers.filter((voucher) => 
    voucher.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (voucher.narration || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Journal Vouchers</h2>
          <p className="text-muted-foreground">Manage and track adjusting entries and non-cash transfers.</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/journal/new">
            <Plus className="mr-2 h-4 w-4" /> New Journal Entry
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search voucher no or narration..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Voucher No.</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Narration</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">Loading vouchers...</TableCell>
              </TableRow>
            ) : filteredVouchers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No vouchers found.</TableCell>
              </TableRow>
            ) : (
              filteredVouchers.map((voucher) => (
                <TableRow key={voucher.id}>
                  <TableCell className="font-medium text-blue-600">{voucher.voucherNo}</TableCell>
                  <TableCell>{format(new Date(voucher.date), "dd/MM/yyyy")}</TableCell>
                  <TableCell className="max-w-xs truncate">{voucher.narration || "-"}</TableCell>
                  <TableCell className="text-right font-bold">₹{Number(voucher.totalAmount).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedVoucher(voucher);
                          setIsPreviewOpen(true);
                        }}>
                          <FileText className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => {
                            setSelectedVoucher(voucher);
                            setIsDeleteAlertOpen(true);
                          }}
                        >
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

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Journal Voucher Details</DialogTitle>
            <DialogDescription>
              {selectedVoucher?.voucherNo} • {selectedVoucher && format(new Date(selectedVoucher.date), "dd/MM/yyyy")}
            </DialogDescription>
          </DialogHeader>
          {selectedVoucher && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-md">
                <p className="text-sm font-semibold mb-2">Narration:</p>
                <p className="text-sm">{selectedVoucher.narration || "No narration provided."}</p>
              </div>

              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedVoucher.transactions?.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.account?.name}</TableCell>
                        <TableCell className="text-right">{t.debit > 0 ? `₹${t.debit.toLocaleString()}` : "-"}</TableCell>
                        <TableCell className="text-right">{t.credit > 0 ? `₹${t.credit.toLocaleString()}` : "-"}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30 font-bold">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">₹{selectedVoucher.totalAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">₹{selectedVoucher.totalAmount.toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the voucher
              {selectedVoucher && <span className="font-bold"> {selectedVoucher.voucherNo}</span>} and remove its ledger entries.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDeleteAlertOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDelete}
              variant="destructive"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
