"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

import { useEffect, useState } from 'react';

export default function Navbar({ user }: { user?: any }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="flex items-center justify-between border-b border-sidebar-border bg-sidebar p-4">
      <h1 className="text-xl font-semibold text-sidebar-primary-foreground">
        {pathname === '/dashboard' ? 'Dashboard' : 'NPO Accounting'}
      </h1>
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm font-medium text-sidebar-foreground">
            {user.name ?? user.email}
          </span>
        )}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-full bg-sidebar-accent hover:bg-sidebar-accent-foreground"
        >
          {mounted ? (
            theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
          ) : (
            <div className="h-4 w-4" /> // Placeholder
          )}
        </button>
        <Link
          href="/profile"
          className="text-sm font-medium text-sidebar-foreground hover:underline"
        >
          Profile
        </Link>
      </div>
    </header>
  );
}
