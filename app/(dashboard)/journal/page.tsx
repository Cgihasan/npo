"use client";

import { useEffect, useState } from "react";
import { getJournalVouchers, deleteJournalVoucher, updateJournalVoucher } from "@/app/actions/journal";
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
import { Plus, Search, FileText, MoreVertical, Edit, Trash, Download } from "lucide-react";
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
import { JournalVoucherForm } from "@/components/forms/JournalVoucherForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/shared/Pagination";
import { exportToExcel } from "@/lib/export-excel";

export default function JournalPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<{ items: any[]; total: number; totalPages: number }>({
    items: [],
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Debounced fetch when search or page changes
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const result = await getJournalVouchers({
          page: currentPage,
          search: searchTerm || undefined,
        });
        setData(result);
      } catch (error) {
        toast.error("Failed to load journal vouchers.");
      } finally {
        setIsLoading(false);
      }
    }, searchTerm ? 300 : 0);
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDelete = async () => {
    if (!selectedVoucher) return;
    try {
      setIsDeleting(true);
      const res = await deleteJournalVoucher(selectedVoucher.id);
      if (res.requested) {
        toast.success("Deletion request submitted for admin approval");
      } else {
        setData(prev => ({ ...prev, items: prev.items.filter(v => v.id !== selectedVoucher.id), total: prev.total - 1 }));
        toast.success("Journal voucher deleted successfully");
      }
      setIsDeleteAlertOpen(false);
    } catch (error) {
      toast.error("Failed to delete journal voucher");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSubmit = async (data: any) => {
    if (!selectedVoucher) return;
    setIsEditing(true);
    try {
      await updateJournalVoucher(selectedVoucher.id, data);
      toast.success("Journal voucher updated successfully");
      setIsEditOpen(false);
      const updatedVouchers = await getJournalVouchers({
        page: currentPage,
        search: searchTerm || undefined,
      });
      setData({ items: updatedVouchers.items, total: updatedVouchers.total, totalPages: updatedVouchers.totalPages });
      setCurrentPage(updatedVouchers.page);
    } catch (error: any) {
      toast.error(error.message || "Failed to update journal voucher");
    } finally {
      setIsEditing(false);
    }
  };

  const handleExport = () => {
    try {
      const exportData = data.items.map((v) => ({
        "Voucher No.": v.voucherNo,
        "Date": format(new Date(v.date), "dd/MM/yyyy"),
        "Narration": v.narration || "",
        "Total Amount": v.totalAmount,
        "Entries": (v.transactions || []).length,
      }));
      exportToExcel(exportData, `Journal_${format(new Date(), "yyyy-MM-dd")}`);
      toast.success("Excel exported successfully!");
    } catch (error) {
      toast.error("Failed to export Excel.");
    }
  };

  // No more client-side filtering — filtering is server-side via getJournalVouchers()

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Journal Vouchers</h2>
          <p className="text-muted-foreground">Manage and track adjusting entries and non-cash transfers.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleExport} disabled={data.total === 0}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/journal/new">
              <Plus className="mr-2 h-4 w-4" /> New Journal Entry
            </Link>
          </Button>
        </div>
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

      <div className="rounded-md border bg-card shadow-sm overflow-x-auto">
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
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Search className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground">No vouchers found</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {searchTerm
                          ? "Try a different search term."
                          : "Create your first journal entry to get started."}
                      </p>
                    </div>
                    {!searchTerm && (
                      <Button asChild className="mt-2 bg-blue-600 hover:bg-blue-700">
                        <Link href="/journal/new">
                          <Plus className="mr-2 h-4 w-4" /> New Journal Entry
                        </Link>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((voucher) => (
                <TableRow key={voucher.id}>
                  <TableCell className="font-medium text-blue-600">{voucher.voucherNo}</TableCell>
                  <TableCell>{format(new Date(voucher.date), "dd/MM/yyyy")}</TableCell>
                  <TableCell className="max-w-xs truncate">{voucher.narration || "-"}</TableCell>
                  <TableCell className="text-right font-bold">₹{Number(voucher.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
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
                        <DropdownMenuItem onClick={() => {
                          setSelectedVoucher(voucher);
                          setIsEditOpen(true);
                        }}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
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

      <Pagination
        currentPage={currentPage}
        totalPages={data.totalPages}
        total={data.total}
        pageSize={20}
        onPageChange={handlePageChange}
      />

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
                        <TableCell className="font-medium">{t.account?.accountType || t.account?.type || "-"}</TableCell>
                        <TableCell className="text-right">{t.debit > 0 ? `₹${t.debit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}</TableCell>
                        <TableCell className="text-right">{t.credit > 0 ? `₹${t.credit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30 font-bold">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">₹{selectedVoucher.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right">₹{selectedVoucher.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
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

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Journal Voucher</DialogTitle>
            <DialogDescription>
              Modify the details of {selectedVoucher?.voucherNo}
            </DialogDescription>
          </DialogHeader>
          {selectedVoucher && (
            <JournalVoucherForm 
              initialData={{
                date: format(new Date(selectedVoucher.date), "yyyy-MM-dd"),
                narration: selectedVoucher.narration,
                transactions: selectedVoucher.transactions
              }}
              onSubmit={handleEditSubmit}
              isSubmitting={isEditing}
              submitButtonText="Update Voucher"
            />
          )}
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
