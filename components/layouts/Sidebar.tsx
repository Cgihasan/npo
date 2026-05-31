"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { LayoutDashboard, Receipt, Wallet, Banknote, FileText, BarChart3, Users, Settings, ChevronDown, Heart, LogOut, Shield, ScrollText, Target, X } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useSidebar } from './SidebarContext';

const vouchersItems = [
  { href: '/receipts', label: 'Receipts', icon: Receipt },
  { href: '/payments', label: 'Payments', icon: Wallet },
  { href: '/contra', label: 'Contra', icon: Banknote },
  { href: '/journal', label: 'Journal', icon: FileText },
];

const reportItems = [
  { href: '/reports', label: 'Day Book' },
  { href: '/reports/receipts-payments-statement', label: 'Receipts & Payment' },
  { href: '/reports/balance-sheet', label: 'Balance Sheet' },
];

export default function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname();
  const { open, setOpen } = useSidebar();
  const [mounted, setMounted] = useState(false);
  const [vouchersOpen, setVouchersOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [activePath, setActivePath] = useState('');

  // Sync open states with current pathname after client mount
  useEffect(() => {
    setMounted(true);
    const path = pathname ?? '';
    setActivePath(path);
    setVouchersOpen(vouchersItems.some(item => path.startsWith(item.href)));
    setReportsOpen(reportItems.some(item => path.startsWith(item.href)));
  }, [pathname]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const currentPath = mounted ? activePath : '';

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      <nav
        className={cn(
          "fixed left-0 top-0 h-full w-64 flex flex-col border-r border-border bg-sidebar z-50 transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full py-6 px-4">
          <div className="mb-8 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Heart className="h-5 w-5 text-primary-foreground" fill="currentColor" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-sidebar-primary">NPO</h1>
                <p className="text-[11px] text-sidebar-foreground/60 font-medium">Management</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="lg:hidden p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-accent-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150",
                currentPath === '/dashboard'
                  ? "bg-primary/10 text-primary font-semibold shadow-[inset_0_0_0_1px_rgba(16,185,129,0.15)]"
                  : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
              )}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>

            {/* Vouchers */}
            <div>
              <button
                onClick={() => setVouchersOpen(!vouchersOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Receipt className="h-5 w-5" />
                  <span>Vouchers</span>
                </div>
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", vouchersOpen && "rotate-180")} />
              </button>
              {vouchersOpen && (
                <div className="flex flex-col gap-1 pl-8 pr-2 mt-1">
                  {vouchersItems.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex items-center px-4 py-2 rounded-lg text-sm transition-colors",
                        currentPath.startsWith(href)
                          ? "text-primary font-medium"
                          : "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
                      )}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Reports */}
            <div>
              <button
                onClick={() => setReportsOpen(!reportsOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5" />
                  <span>Reports</span>
                </div>
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", reportsOpen && "rotate-180")} />
              </button>
              {reportsOpen && (
                <div className="flex flex-col gap-1 pl-8 pr-2 mt-1">
                  {reportItems.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex items-center px-4 py-2 rounded-lg text-sm transition-colors",
                        currentPath.startsWith(href)
                          ? "text-primary font-medium"
                          : "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
                      )}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/budget"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                currentPath === '/budget'
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
              )}
            >
              <Target className="h-5 w-5" />
              <span>Budgets</span>
            </Link>

            <Link
              href="/masters"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                currentPath === '/masters'
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
              )}
            >
              <Users className="h-5 w-5" />
              <span>Masters</span>
            </Link>

            {role === "ADMIN" && (
              <>
                <div className="mt-4 mb-1 px-4">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-sidebar-foreground/40">Administration</p>
                </div>
                <Link
                  href="/admin/voucher-requests"
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    currentPath === '/admin/voucher-requests'
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <Shield className="h-5 w-5" />
                  <span>Voucher Requests</span>
                </Link>
                <Link
                  href="/users"
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    currentPath === '/users'
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <Shield className="h-5 w-5" />
                  <span>Users</span>
                </Link>
                <Link
                  href="/audit-log"
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    currentPath === '/audit-log'
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <ScrollText className="h-5 w-5" />
                  <span>Audit Log</span>
                </Link>
              </>
            )}
          </div>

          <div className="mt-auto space-y-1">
            <Link
              href="/settings"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                currentPath === '/settings'
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
              )}
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
