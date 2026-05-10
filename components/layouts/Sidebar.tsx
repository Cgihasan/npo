"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Receipt, Wallet, Banknote, BarChart2, Settings, Users, FileText } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/receipts', label: 'Receipts', icon: Receipt },
  { href: '/payments', label: 'Payments', icon: Wallet },
  { href: '/contra', label: 'Contra', icon: Banknote },
  { href: '/accounts', label: 'Accounts', icon: BarChart2 },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/masters', label: 'Masters', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col w-64 h-full bg-sidebar border-r border-sidebar-border p-4" suppressHydrationWarning>
      <div className="flex items-center mb-8">
        <h2 className="text-2xl font-bold text-sidebar-primary">NPO</h2>
      </div>
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
    </nav>
  );
}
