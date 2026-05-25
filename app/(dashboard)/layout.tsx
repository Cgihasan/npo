import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layouts/Sidebar";
import Navbar from "@/components/layouts/Navbar";
import { syncKindeUser } from "@/lib/kinde-sync";

import { PageTransition } from "@/components/providers/PageTransition";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = getKindeServerSession();
  const isUserAuthenticated = await isAuthenticated();

  if (!isUserAuthenticated) {
    redirect("/login");
  }

  const user = await syncKindeUser();
  if (!user) {
    redirect("/login");
  }

  const role = user.role;

  return (
    <div className="min-h-screen bg-background text-foreground" suppressHydrationWarning>
      <Sidebar role={role} />
      <div className="ml-64 flex flex-col min-h-screen">
        <Navbar user={user} />
        <main className="flex-1 overflow-auto">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
