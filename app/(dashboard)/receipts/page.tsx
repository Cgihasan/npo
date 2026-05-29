"use client";

import { useEffect, useState } from "react";
import { getReceipts } from "@/app/actions/receipts";
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
import { Plus, Search, FileText, MoreVertical, Printer, Edit, Trash, Download } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { ReceiptVoucher } from "@/components/receipts/ReceiptVoucher";
import { exportToPDF } from "@/lib/export";
import { exportToExcel } from "@/lib/export-excel";
import { toast } from "sonner";
import { deleteReceipt, deleteReceipts } from "@/app/actions/receipts";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/shared/Pagination";

export default function ReceiptsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<{ items: any[]; total: number; totalPages: number }>({
    items: [],
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const [selectedReceipts, setSelectedReceipts] = useState<string[]>([]);
  const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Debounced fetch when filters or page change
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const result = await getReceipts({
          page: currentPage,
          search: searchTerm || undefined,
          dateFilter: dateFilter || undefined,
          typeFilter,
        });
        setData(result);
      } catch (error) {
        toast.error("Failed to load receipts.");
      } finally {
        setIsLoading(false);
      }
    }, searchTerm ? 300 : 0);
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm, dateFilter, typeFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter, typeFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrint = async () => {
    if (!selectedReceipt) return;
    try {
      setIsPrinting(true);
      await exportToPDF("receipt-voucher", `Receipt_${selectedReceipt.receiptNo}`);
      toast.success("PDF generated successfully!");
      setIsPreviewOpen(false);
    } catch (error) {
      toast.error("Failed to generate PDF.");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedReceipt) return;
    try {
      setIsDeleting(true);
      await deleteReceipt(selectedReceipt.id);
      setData(prev => ({ ...prev, items: prev.items.filter(r => r.id !== selectedReceipt.id), total: prev.total - 1 }));
      toast.success("Receipt deleted successfully");
      setIsDeleteAlertOpen(false);
    } catch (error) {
      toast.error("Failed to delete receipt");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReceipts.length === 0) return;
    try {
      setIsBulkDeleting(true);
      await deleteReceipts(selectedReceipts);
      setData(prev => ({ ...prev, items: prev.items.filter(r => !selectedReceipts.includes(r.id)), total: prev.total - selectedReceipts.length }));
      setSelectedReceipts([]);
      toast.success("Receipts deleted successfully");
      setIsBulkDeleteAlertOpen(false);
    } catch (error) {
      toast.error("Failed to delete receipts");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleExport = () => {
    try {
      const exportData = data.items.map((r) => ({
        "Receipt No.": r.receiptNo,
        "Date": format(new Date(r.date), "dd/MM/yyyy"),
        "Donor": r.donor?.name || "Anonymous",
        "Type": r.type,
        "Event Name": r.eventName && r.eventName !== "None" ? r.eventName : "",
        "Amount": r.amount,
        "Payment Mode": r.paymentMode,
        "Narration": r.narration || "",
      }));
      exportToExcel(exportData, `Receipts_${format(new Date(), "yyyy-MM-dd")}`);
      toast.success("Excel exported successfully!");
    } catch (error) {
      toast.error("Failed to export Excel.");
    }
  };


  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Receipts</h2>
          <p className="text-muted-foreground">Manage and track all income receipts.</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedReceipts.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={() => setIsBulkDeleteAlertOpen(true)}
            >
              <Trash className="mr-2 h-4 w-4" /> Delete Selected ({selectedReceipts.length})
            </Button>
          )}
          <Button variant="outline" onClick={handleExport} disabled={data.total === 0}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/receipts/new">
              <Plus className="mr-2 h-4 w-4" /> New Receipt
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search donor or receipt no..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Input 
            type="date" 
            className="w-full md:w-[200px]" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="General Donation">General Donation</SelectItem>
              <SelectItem value="Special Donation">Special Donation</SelectItem>
              <SelectItem value="Bank Charges">Bank Charges</SelectItem>
              <SelectItem value="Interest Capitalized From Bank">Interest Capitalized From Bank</SelectItem>
              <SelectItem value="Subscription">Subscription</SelectItem>
              <SelectItem value="Deposit Reverse">Deposit Reverse</SelectItem>
              <SelectItem value="Cancellation Reverse">Cancellation Reverse</SelectItem>
            </SelectContent>
          </Select>
          {(searchTerm || dateFilter || typeFilter !== "all") && (
            <Button variant="ghost" onClick={() => {
              setSearchTerm("");
              setDateFilter("");
              setTypeFilter("all");
            }}>
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox 
                  checked={data.items.length > 0 && selectedReceipts.length === data.items.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedReceipts(data.items.map(r => r.id));
                    } else {
                      setSelectedReceipts([]);
                    }
                  }}
                />
              </TableHead>
              <TableHead>Receipt No.</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Donor</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Event Name</TableHead>
              <TableHead>Narration</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Search className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground">No receipts found</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {searchTerm || dateFilter || typeFilter !== "all"
                          ? "Try adjusting your search or filters."
                          : "Create your first receipt to get started."}
                      </p>
                    </div>
                    {!searchTerm && !dateFilter && typeFilter === "all" && (
                      <Button asChild className="mt-2 bg-emerald-600 hover:bg-emerald-700">
                        <Link href="/receipts/new">
                          <Plus className="mr-2 h-4 w-4" /> New Receipt
                        </Link>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedReceipts.includes(receipt.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedReceipts([...selectedReceipts, receipt.id]);
                        } else {
                          setSelectedReceipts(selectedReceipts.filter(id => id !== receipt.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-emerald-600">{receipt.receiptNo}</TableCell>
                  <TableCell>{format(new Date(receipt.date), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{receipt.donor?.name || "Unknown"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{receipt.type}</Badge>
                  </TableCell>
                  <TableCell className="font-bold">₹{Number(receipt.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell>{receipt.paymentMode}</TableCell>
                  <TableCell className="max-w-[200px]">
                    {receipt.eventName && receipt.eventName !== "None" ? (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 truncate block max-w-full">
                        {receipt.eventName}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{receipt.narration || "—"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedReceipt(receipt);
                          setIsPreviewOpen(true);
                        }}>
                          <FileText className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedReceipt(receipt);
                          setIsPreviewOpen(true);
                        }}>
                          <Printer className="mr-2 h-4 w-4" /> Print Receipt
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/receipts/${receipt.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => {
                            setSelectedReceipt(receipt);
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receipt Preview</DialogTitle>
            <DialogDescription>Preview of receipt details.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-4 bg-muted/30 rounded-lg overflow-x-auto">
            {selectedReceipt && <ReceiptVoucher receipt={selectedReceipt} />}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700" 
              onClick={handlePrint}
              disabled={isPrinting}
            >
              <Printer className="mr-2 h-4 w-4" />
              {isPrinting ? "Generating PDF..." : "Download PDF"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the receipt
              {selectedReceipt && <span className="font-bold"> {selectedReceipt.receiptNo}</span>} and remove its data from our servers.
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

      <Dialog open={isBulkDeleteAlertOpen} onOpenChange={setIsBulkDeleteAlertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete {selectedReceipts.length} selected receipts and remove their data from our servers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsBulkDeleteAlertOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkDelete}
              variant="destructive"
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? "Deleting..." : "Delete All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
