import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarProvider } from "@/components/layouts/SidebarContext";
import Sidebar from "@/components/layouts/Sidebar";
import Navbar from "@/components/layouts/Navbar";

import { PageTransition } from "@/components/providers/PageTransition";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  const role = (session.user as any)?.role;

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground" suppressHydrationWarning>
        <Sidebar role={role} />
        <div className="lg:ml-64 flex flex-col min-h-screen">
          <Navbar user={session.user} />
          <main className="flex-1 overflow-auto">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
