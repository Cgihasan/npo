"use client";

import { useEffect, useState } from "react";
import { 
  getDonors, getVendors, getAccounts,
  createDonor, createVendor, createAccount,
  updateDonor, updateVendor, updateAccount,
  deleteDonor, deleteVendor, deleteAccount
} from "@/app/actions/masters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical, Edit, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MasterForm } from "@/components/forms/MasterForm";
import { AccountForm, getAccountGroup, getAccountLedger } from "@/components/forms/AccountForm";

export default function MastersPage() {
  const [donors, setDonors] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDonorDialogOpen, setIsDonorDialogOpen] = useState(false);
  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);

  const [editingItem, setEditingItem] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: "donor" | "vendor" | "account" } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [d, v, a] = await Promise.all([
        getDonors(),
        getVendors(),
        getAccounts(),
      ]);
      setDonors(d);
      setVendors(v);
      setAccounts(a);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      if (itemToDelete.type === "donor") await deleteDonor(itemToDelete.id);
      if (itemToDelete.type === "vendor") await deleteVendor(itemToDelete.id);
      if (itemToDelete.type === "account") await deleteAccount(itemToDelete.id);
      toast.success(`${itemToDelete.type} deleted successfully`);
      setIsDeleteDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message || `Failed to delete ${itemToDelete.type}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditDialog = (item: any, type: "donor" | "vendor" | "account") => {
    setEditingItem(item);
    if (type === "donor") setIsDonorDialogOpen(true);
    if (type === "vendor") setIsVendorDialogOpen(true);
    if (type === "account") setIsAccountDialogOpen(true);
  };

  const closeDialogs = () => {
    setIsDonorDialogOpen(false);
    setIsVendorDialogOpen(false);
    setIsAccountDialogOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Master Data</h2>
        <p className="text-muted-foreground">Manage your donors, vendors, and account heads.</p>
      </div>

      <Tabs defaultValue="donors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="donors">Donors</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="donors">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Donors</CardTitle>
                <CardDescription>Individuals and organizations that contribute to your NPO.</CardDescription>
              </div>
              <Button onClick={() => { setEditingItem(null); setIsDonorDialogOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="mr-2 h-4 w-4" /> Add Donor
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
                  ) : donors.map((donor) => (
                    <TableRow key={donor.id}>
                      <TableCell className="font-medium">{donor.name}</TableCell>
                      <TableCell>{donor.email}</TableCell>
                      <TableCell>{donor.phone}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(donor, "donor")}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => {
                                setItemToDelete({ id: donor.id, type: "donor" });
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Vendors</CardTitle>
                <CardDescription>Suppliers and service providers.</CardDescription>
              </div>
              <Button onClick={() => { setEditingItem(null); setIsVendorDialogOpen(true); }} className="bg-amber-600 hover:bg-amber-700 text-white">
                <Plus className="mr-2 h-4 w-4" /> Add Vendor
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
                  ) : vendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium">{vendor.name}</TableCell>
                      <TableCell>{vendor.email}</TableCell>
                      <TableCell>{vendor.phone}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(vendor, "vendor")}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => {
                                setItemToDelete({ id: vendor.id, type: "vendor" });
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Account Heads</CardTitle>
                <CardDescription>Chart of accounts with group and ledger names.</CardDescription>
              </div>
              <Button onClick={() => { setEditingItem(null); setIsAccountDialogOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="mr-2 h-4 w-4" /> Add Account
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Group</TableHead>
                    <TableHead>Ledger</TableHead>
                    <TableHead className="text-right">Opening Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
                  ) : accounts.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No accounts found.</TableCell></TableRow>
                  ) : accounts.map((acc) => (
                    <TableRow key={acc.id}>
                      <TableCell>
                        <Badge variant="outline">{getAccountGroup(acc)}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {getAccountLedger(acc) ?? (
                          <span className="text-muted-foreground font-normal">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums">
                        ₹{Number(acc.balance).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(acc, "account")}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => {
                                setItemToDelete({ id: acc.id, type: "account" });
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDonorDialogOpen} onOpenChange={setIsDonorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Donor" : "Add New Donor"}</DialogTitle>
            <DialogDescription>{editingItem ? "Update donor details." : "Add a new donor to the system."}</DialogDescription>
          </DialogHeader>
          <MasterForm
            type="donor"
            initialData={editingItem}
            onSuccess={() => { closeDialogs(); loadData(); }} 
            onCancel={closeDialogs}
            submitAction={editingItem ? updateDonor : createDonor}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isVendorDialogOpen} onOpenChange={setIsVendorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Vendor" : "Add New Vendor"}</DialogTitle>
            <DialogDescription>{editingItem ? "Update vendor details." : "Add a new vendor to the system."}</DialogDescription>
          </DialogHeader>
          <MasterForm
            type="vendor"
            initialData={editingItem}
            onSuccess={() => { closeDialogs(); loadData(); }} 
            onCancel={closeDialogs}
            submitAction={editingItem ? updateVendor : createVendor}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Account" : "Add New Account"}</DialogTitle>
            <DialogDescription>{editingItem ? "Update account details." : "Add a new account head to the chart of accounts."}</DialogDescription>
          </DialogHeader>
          <AccountForm
            initialData={editingItem}
            onSuccess={() => { closeDialogs(); loadData(); }} 
            onCancel={closeDialogs}
            submitAction={editingItem ? updateAccount : createAccount}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the {itemToDelete?.type} and may fail if it is currently being used in any transactions or vouchers.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
