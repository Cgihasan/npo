"use client";

import { useEffect, useState } from "react";
import { getPayments } from "@/app/actions/payments";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { PaymentVoucher } from "@/components/payments/PaymentVoucher";
import { exportToPDF } from "@/lib/export";
import { exportToExcel } from "@/lib/export-excel";
import { toast } from "sonner";
import { Printer } from "lucide-react";
import { deletePayment, deletePayments } from "@/app/actions/payments";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/shared/Pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PaymentsPage() {
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

  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Debounced fetch when filters or page change
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const result = await getPayments({
          page: currentPage,
          search: searchTerm || undefined,
          dateFilter: dateFilter || undefined,
          typeFilter,
        });
        setData(result);
      } catch (error) {
        toast.error("Failed to load payments.");
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
    if (!selectedPayment) return;
    try {
      setIsPrinting(true);
      await exportToPDF("payment-voucher", `Voucher_${selectedPayment.voucherNo}`);
      toast.success("PDF generated successfully!");
      setIsPreviewOpen(false);
    } catch (error) {
      toast.error("Failed to generate PDF.");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPayment) return;
    try {
      setIsDeleting(true);
      await deletePayment(selectedPayment.id);
      setData(prev => ({ ...prev, items: prev.items.filter(p => p.id !== selectedPayment.id), total: prev.total - 1 }));
      toast.success("Payment deleted successfully");
      setIsDeleteAlertOpen(false);
    } catch (error) {
      toast.error("Failed to delete payment");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPayments.length === 0) return;
    try {
      setIsBulkDeleting(true);
      await deletePayments(selectedPayments);
      setData(prev => ({ ...prev, items: prev.items.filter(p => !selectedPayments.includes(p.id)), total: prev.total - selectedPayments.length }));
      setSelectedPayments([]);
      toast.success("Payments deleted successfully");
      setIsBulkDeleteAlertOpen(false);
    } catch (error) {
      toast.error("Failed to delete payments");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleExport = () => {
    try {
      const exportData = data.items.map((p) => ({
        "Voucher No.": p.voucherNo,
        "Date": format(new Date(p.date), "dd/MM/yyyy"),
        "Type": p.type,
        "Event Name": p.eventName && p.eventName !== "None" ? p.eventName : "",
        "Amount": p.amount,
        "Payment Mode": p.paymentMode,
        "Narration": p.narration || "",
        "Status": "Paid",
      }));
      exportToExcel(exportData, `Payments_${format(new Date(), "yyyy-MM-dd")}`);
      toast.success("Excel exported successfully!");
    } catch (error) {
      toast.error("Failed to export Excel.");
    }
  };

  // No more client-side filteredPayments — filtering is server-side via getPayments()

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payments</h2>
          <p className="text-muted-foreground">Track and manage all expense payments</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedPayments.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={() => setIsBulkDeleteAlertOpen(true)}
            >
              <Trash className="mr-2 h-4 w-4" /> Delete Selected ({selectedPayments.length})
            </Button>
          )}
          <Button variant="outline" onClick={handleExport} disabled={data.total === 0}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button asChild className="bg-amber-600 hover:bg-amber-700">
            <Link href="/payments/new">
              <Plus className="mr-2 h-4 w-4" /> New Payment
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search narration or voucher no..."
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
              <SelectItem value="Registration & Paper Works">Registration & Paper Works</SelectItem>
              <SelectItem value="Printing Expenese">Printing Expenese</SelectItem>
              <SelectItem value="Office Expenses">Office Expenses</SelectItem>
              <SelectItem value="Office Rent Advance">Office Rent Advance</SelectItem>
              <SelectItem value="Office Stationery">Office Stationery</SelectItem>
              <SelectItem value="Legal Advisor">Legal Advisor</SelectItem>
              <SelectItem value="Tea Expenses">Tea Expenses</SelectItem>
              <SelectItem value="Office Equipments">Office Equipments</SelectItem>
              <SelectItem value="Furniture">Furniture</SelectItem>
              <SelectItem value="Islamic Book Purchased">Islamic Book Purchased</SelectItem>
              <SelectItem value="Delivery Charges">Delivery Charges</SelectItem>
              <SelectItem value="Bank Charges">Bank Charges</SelectItem>
              <SelectItem value="Office Rent">Office Rent</SelectItem>
              <SelectItem value="Electricity">Electricity</SelectItem>
              <SelectItem value="Telephone & Internet Bills">Telephone & Internet Bills</SelectItem>
              <SelectItem value="Events Expenses">Events Expenses</SelectItem>
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

      <div className="rounded-md border bg-card shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox 
                  checked={data.items.length > 0 && selectedPayments.length === data.items.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedPayments(data.items.map(p => p.id));
                    } else {
                      setSelectedPayments([]);
                    }
                  }}
                />
              </TableHead>
              <TableHead>Voucher No.</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
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
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Search className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground">No payments found</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {searchTerm || dateFilter || typeFilter !== "all"
                          ? "Try adjusting your search or filters."
                          : "Create your first payment to get started."}
                      </p>
                    </div>
                    {!searchTerm && !dateFilter && typeFilter === "all" && (
                      <Button asChild className="mt-2 bg-amber-600 hover:bg-amber-700">
                        <Link href="/payments/new">
                          <Plus className="mr-2 h-4 w-4" /> New Payment
                        </Link>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedPayments.includes(payment.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPayments([...selectedPayments, payment.id]);
                        } else {
                          setSelectedPayments(selectedPayments.filter(id => id !== payment.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-amber-600">{payment.voucherNo}</TableCell>
                  <TableCell>{format(new Date(payment.date), "dd/MM/yyyy")}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{payment.type}</Badge>
                  </TableCell>
                  <TableCell className="font-bold">₹{Number(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-500">
                      Paid
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    {payment.eventName && payment.eventName !== "None" ? (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 truncate block max-w-full">
                        {payment.eventName}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{payment.narration || "—"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedPayment(payment);
                          setIsPreviewOpen(true);
                        }}>
                          <Printer className="mr-2 h-4 w-4" /> Print Voucher
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/payments/${payment.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedPayment(payment);
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
            <DialogTitle>Payment Voucher Preview</DialogTitle>
            <DialogDescription>Preview of payment voucher details.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-4 bg-muted/30 rounded-lg overflow-x-auto">
            {selectedPayment && <PaymentVoucher payment={selectedPayment} />}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
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
              This action cannot be undone. This will permanently delete the payment
              {selectedPayment && <span className="font-bold"> {selectedPayment.voucherNo}</span>} and remove its data from our servers.
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
              This action cannot be undone. This will permanently delete {selectedPayments.length} selected payments and remove their data from our servers.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. This will permanently delete {selectedPayments.length} selected payments and remove their data from our servers.
            </p>
          </div>
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
