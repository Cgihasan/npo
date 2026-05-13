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
import { Plus, Search, FileText, MoreVertical, Printer, Edit, Trash } from "lucide-react";
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
import { toast } from "sonner";
import { deleteReceipt } from "@/app/actions/receipts";
import { format } from "date-fns";

export default function ReceiptsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [receipts, setReceipts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    async function loadReceipts() {
      try {
        const data = await getReceipts();
        setReceipts(data);
      } catch (error) {
        toast.error("Failed to load receipts.");
      } finally {
        setIsLoading(false);
      }
    }
    loadReceipts();
  }, []);

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
      setReceipts(receipts.filter(r => r.id !== selectedReceipt.id));
      toast.success("Receipt deleted successfully");
      setIsDeleteAlertOpen(false);
    } catch (error) {
      toast.error("Failed to delete receipt");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredReceipts = receipts.filter((receipt) => {
    const matchesSearch = 
      receipt.receiptNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.donor?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !dateFilter || receipt.date.startsWith(dateFilter);
    const matchesType = typeFilter === "all" || receipt.type === typeFilter;

    return matchesSearch && matchesDate && matchesType;
  });

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Receipts</h2>
          <p className="text-muted-foreground">Manage and track all income receipts.</p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link href="/receipts/new">
            <Plus className="mr-2 h-4 w-4" /> New Receipt
          </Link>
        </Button>
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
              <TableHead>Receipt No.</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Donor</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">Loading receipts...</TableCell>
              </TableRow>
            ) : filteredReceipts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No receipts found matching the filters.</TableCell>
              </TableRow>
            ) : (
              filteredReceipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell className="font-medium text-emerald-600">{receipt.receiptNo}</TableCell>
                  <TableCell>{format(new Date(receipt.date), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{receipt.donor?.name || "Unknown"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{receipt.type}</Badge>
                  </TableCell>
                  <TableCell className="font-bold">₹{Number(receipt.amount).toLocaleString()}</TableCell>
                  <TableCell>{receipt.paymentMode}</TableCell>
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
           <div className="py-4">
             <p className="text-sm text-muted-foreground">
               This action cannot be undone. This will permanently delete the receipt
               {selectedReceipt && <span className="font-bold"> {selectedReceipt.receiptNo}</span>} and remove its data from our servers.
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
