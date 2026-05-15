"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Home, Receipt, Wallet, Banknote, BarChart2, Settings, Users, FileText } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/receipts', label: 'Receipts', icon: Receipt },
  { href: '/payments', label: 'Payments', icon: Wallet },
  { href: '/contra', label: 'Contra', icon: Banknote },
  { href: '/journal', label: 'Journal', icon: FileText },
  { href: '/accounts', label: 'Accounts', icon: BarChart2 },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/reports/receipts-payments', label: 'Receipts & Payments', icon: FileText },
  { href: '/masters', label: 'Masters', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <nav className="h-screen w-64 shrink-0 border-r border-sidebar-border bg-sidebar p-4">
      <div className="flex items-center mb-8">
        <h2 className="text-2xl font-bold text-sidebar-primary">NPO</h2>
      </div>
      {mounted && (
        <ul className="flex-1 space-y-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-md p-2 text-sm font-medium",
                  pathname === href
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
