import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
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
  return (
    <div className="flex min-h-screen bg-background text-foreground" suppressHydrationWarning>
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Navbar user={session.user} />
        <main className="flex-1 p-6 overflow-auto">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
