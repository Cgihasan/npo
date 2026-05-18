"use client";

import { Sun, Moon, Bell } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar({ user }: { user?: any }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pageTitle = pathname === '/dashboard' ? 'Aqaba Trust' : 'NPO Accounting';

  return (
    <header className="sticky top-0 right-0 z-40 flex items-center justify-between h-16 px-8 border-b border-border bg-background/80 backdrop-blur-xl">
      <h2 className="text-2xl font-bold tracking-tight">{pageTitle}</h2>
      <div className="flex items-center gap-4">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-full hover:bg-accent transition-all"
        >
          {mounted ? (
            theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />
          ) : (
            <div className="h-5 w-5" />
          )}
        </button>
        <button className="p-2 rounded-full hover:bg-accent transition-all relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
        </button>
        {user && (
          <div className="flex items-center gap-3 border-l border-border pl-4">
            <div className="text-right">
              <p className="text-sm font-semibold">{user.name ?? user.email}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Principal</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm border border-border">
              {(user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
