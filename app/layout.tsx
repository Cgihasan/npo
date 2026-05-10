import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/utils';
import '@/app/globals.css';

export const metadata = {
  title: 'NPO Accounting System',
  description: 'Modern accounting platform for non‑profits',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-sans antialiased')} suppressHydrationWarning>
        <ThemeProvider attribute="class" enableSystem={true} defaultTheme="system">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
