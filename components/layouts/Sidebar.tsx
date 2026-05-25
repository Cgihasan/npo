"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { LayoutDashboard, Receipt, Wallet, Banknote, FileText, BarChart3, Users, Settings, ChevronDown, Heart, LogOut, Shield, ScrollText } from 'lucide-react';
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";

const vouchersItems = [
  { href: '/receipts', label: 'Receipts', icon: Receipt },
  { href: '/payments', label: 'Payments', icon: Wallet },
  { href: '/contra', label: 'Contra', icon: Banknote },
  { href: '/journal', label: 'Journal', icon: FileText },
];

const reportItems = [
  { href: '/reports/receipts-payments-statement', label: 'Receipts & Payment' },
];

export default function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname();
  const [vouchersOpen, setVouchersOpen] = useState(
    () => vouchersItems.some(item => pathname.startsWith(item.href))
  );
  const [reportsOpen, setReportsOpen] = useState(
    () => reportItems.some(item => pathname.startsWith(item.href))
  );

  return (
    <nav className="fixed left-0 top-0 h-full w-64 flex flex-col border-r border-border bg-sidebar z-50">
      <div className="flex flex-col h-full py-6 px-4">
        <div className="mb-10 px-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <Heart className="h-5 w-5 text-primary-foreground" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-sidebar-primary">NPO</h1>
            <p className="text-[11px] text-sidebar-foreground/60 font-medium">Management</p>
          </div>
        </div>

        <div className="flex flex-col gap-1 flex-1">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150",
              pathname === '/dashboard'
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
                      pathname.startsWith(href)
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
                      pathname.startsWith(href)
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
            href="/masters"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
              pathname === '/masters'
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
                href="/users"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  pathname === '/users'
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
                  pathname === '/audit-log'
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
              pathname === '/settings'
                ? "bg-primary/10 text-primary font-semibold"
                : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
            )}
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
          <LogoutLink className="w-full">
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </LogoutLink>
        </div>
      </div>
    </nav>
  );
}
