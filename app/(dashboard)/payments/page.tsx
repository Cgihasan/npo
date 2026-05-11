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
import { Plus, Search, FileText, MoreVertical, Edit, Trash } from "lucide-react";
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
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { PaymentVoucher } from "@/components/payments/PaymentVoucher";
import { exportToPDF } from "@/lib/export";
import { toast } from "sonner";
import { Printer } from "lucide-react";
import { deletePayment } from "@/app/actions/payments";

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
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    async function loadPayments() {
      try {
        const data = await getPayments();
        setPayments(data);
      } catch (error) {
        toast.error("Failed to load payments.");
      } finally {
        setIsLoading(false);
      }
    }
    loadPayments();
  }, []);

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
      setPayments(payments.filter(p => p.id !== selectedPayment.id));
      toast.success("Payment deleted successfully");
      setIsDeleteAlertOpen(false);
    } catch (error) {
      toast.error("Failed to delete payment");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = 
      payment.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.narration?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !dateFilter || payment.date.startsWith(dateFilter);
    const matchesType = typeFilter === "all" || payment.type === typeFilter;

    return matchesSearch && matchesDate && matchesType;
  });

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payments</h2>
          <p className="text-muted-foreground">Track and manage all expense payments.</p>
        </div>
        <Button asChild className="bg-amber-600 hover:bg-amber-700">
          <Link href="/payments/new">
            <Plus className="mr-2 h-4 w-4" /> New Payment
          </Link>
        </Button>
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

      <div className="rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Voucher No.</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">Loading payments...</TableCell>
              </TableRow>
            ) : filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No payments found matching the filters.</TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium text-amber-600">{payment.voucherNo}</TableCell>
                  <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{payment.type}</Badge>
                  </TableCell>
                  <TableCell className="font-bold">₹{Number(payment.amount).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-500">
                      Paid
                    </Badge>
                  </TableCell>
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

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Voucher Preview</DialogTitle>
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
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. This will permanently delete the payment
              {selectedPayment && <span className="font-bold"> {selectedPayment.voucherNo}</span>} and remove its data from our servers.
            </p>
          </div>
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
