"use client";

import { Sun, Moon, Bell, LogOut, Menu } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useSidebar } from './SidebarContext';

export default function Navbar({ user }: { user?: any }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { toggle } = useSidebar();

  useEffect(() => {
    setMounted(true);
  }, []);

  const pageTitle = 'Aqaba Trust';

  return (
    <header className="sticky top-0 right-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">{pageTitle}</h2>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="flex items-center gap-2 md:gap-3 border-l border-border pl-3 md:pl-4 cursor-pointer">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold">{user.name ?? user.email}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Principal</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm border border-border">
                  {(user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-48">
              <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
