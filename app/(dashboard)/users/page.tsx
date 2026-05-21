"use client";

import { useEffect, useState, useCallback } from "react";
import { getUsers, updateUserRole, toggleUserActive, deleteUser } from "@/app/actions/users";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MoreVertical, Shield, ShieldOff, Trash, ShieldAlert, UserX, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: Date;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getUsers();
      if ("error" in result) {
        setError(result.error as string);
        if ((result.error as string).includes("Unauthorized")) {
          router.push("/dashboard");
        }
        return;
      }
      setUsers((result as any).users as User[]);
    } catch (err: any) {
      setError(err.message || "Failed to load users.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;
    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.set("userId", selectedUser.id);
      formData.set("role", newRole);
      const result = await updateUserRole(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(
          `${selectedUser.name} is now ${newRole === "ADMIN" ? "an Admin" : "a Viewer"}`
        );
        setIsRoleDialogOpen(false);
        loadUsers();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update role.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleActive = async () => {
    if (!selectedUser) return;
    setIsUpdating(true);
    const newActive = !selectedUser.active;
    try {
      const formData = new FormData();
      formData.set("userId", selectedUser.id);
      formData.set("active", String(newActive));
      const result = await toggleUserActive(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(
          newActive
            ? `${selectedUser.name} has been re-enabled.`
            : `${selectedUser.name} has been disabled.`
        );
        setIsDisableDialogOpen(false);
        loadUsers();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update user status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.set("userId", selectedUser.id);
      const result = await deleteUser(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`${selectedUser.name} has been deleted.`);
        setIsDeleteDialogOpen(false);
        loadUsers();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6 p-4 md:p-8">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-bold text-destructive">Access Denied</h2>
          <p className="text-muted-foreground mt-2">You need admin privileges to manage users.</p>
        </div>
      </div>
    );
  }

  const activeUsers = users.filter((u) => u.active);
  const disabledUsers = users.filter((u) => !u.active);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        <p className="text-muted-foreground">Manage user accounts, roles, and permissions.</p>
      </div>

      <div className="flex gap-4">
        <div className="rounded-xl border border-border/50 bg-card p-4 flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Total Users</p>
          <p className="text-2xl font-bold mt-1">{users.length}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4 flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Active</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{activeUsers.length}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4 flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Admins</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{users.filter((u) => u.role === "ADMIN").length}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4 flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Disabled</p>
          <p className="text-2xl font-bold text-muted-foreground mt-1">{disabledUsers.length}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {users.length} user{users.length !== 1 ? "s" : ""} registered.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className={!user.active ? "opacity-60" : ""}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      {user.role === "ADMIN" ? (
                        <Badge className="bg-amber-500 hover:bg-amber-600">
                          <Shield className="mr-1 h-3 w-3" />
                          ADMIN
                        </Badge>
                      ) : (
                        <Badge variant="secondary">VIEWER</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.active ? (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground border-border bg-muted/30">
                          Disabled
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(user.createdAt), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.role === "ADMIN" ? (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setNewRole("VIEWER");
                                setIsRoleDialogOpen(true);
                              }}
                            >
                              <ShieldOff className="mr-2 h-4 w-4" />
                              Demote to Viewer
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setNewRole("ADMIN");
                                setIsRoleDialogOpen(true);
                              }}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Promote to Admin
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          {user.active ? (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setIsDisableDialogOpen(true);
                              }}
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Disable Account
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={async () => {
                                setSelectedUser(user);
                                const formData = new FormData();
                                formData.set("userId", user.id);
                                formData.set("active", "true");
                                const result = await toggleUserActive(formData);
                                if (result?.error) {
                                  toast.error(result.error);
                                } else {
                                  toast.success(`${user.name} has been re-enabled.`);
                                  loadUsers();
                                }
                              }}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Re-enable Account
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Role Change Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newRole === "ADMIN" ? "Promote to Admin" : "Demote to Viewer"}
            </DialogTitle>
            <DialogDescription>
              {newRole === "ADMIN"
                ? `Are you sure you want to make ${selectedUser?.name} an admin? They will get full access to all features including user management.`
                : `Are you sure you want to demote ${selectedUser?.name} to viewer? They will lose admin privileges.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRoleChange}
              disabled={isUpdating}
              variant={newRole === "ADMIN" ? "default" : "destructive"}
            >
              {isUpdating
                ? "Updating..."
                : newRole === "ADMIN"
                  ? "Promote to Admin"
                  : "Demote to Viewer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable/Enable Dialog */}
      <Dialog open={isDisableDialogOpen} onOpenChange={setIsDisableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.active ? "Disable Account" : "Re-enable Account"}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.active
                ? `Are you sure you want to disable ${selectedUser?.name}? They will not be able to log in until re-enabled.`
                : `Are you sure you want to re-enable ${selectedUser?.name}? They will regain access to the system.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDisableDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleToggleActive}
              disabled={isUpdating}
              variant={selectedUser?.active ? "destructive" : "default"}
            >
              {isUpdating
                ? "Updating..."
                : selectedUser?.active
                  ? "Disable Account"
                  : "Re-enable Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete <strong>{selectedUser?.name}</strong>?
              This action cannot be undone. Their account and all associated data will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isUpdating}
            >
              {isUpdating ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
