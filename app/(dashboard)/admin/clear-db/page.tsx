"use server";

import { clearAllData } from "@/app/actions/admin";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Page component to clear all database records. Only accessible by ADMIN users.
 * WARNING: This action is irreversible.
 */
export default async function ClearDatabasePage() {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    // Non-admins are redirected to the dashboard.
    redirect("/dashboard");
    return null;
  }

  // If a POST request is made, clear the data.
  async function handleClear() {
    "use server";
    await clearAllData();
    // After clearing, redirect to dashboard with a simple message (could use a toast).
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-4 md:p-8">
      <h1 className="text-3xl font-bold text-red-800 mb-4">⚠️ Danger Zone</h1>
      <p className="mb-6 text-center text-red-700 max-w-lg px-2">
        This operation will <strong>permanently delete</strong> all records from the database, including users,
        financial data, and audit logs. This action cannot be undone. Ensure you have a backup before proceeding.
      </p>
      <form action={handleClear} className="bg-white shadow-md rounded px-4 md:px-8 pt-6 pb-8 mb-4 border border-red-200 w-full max-w-md mx-4 md:mx-0">
        <button
          type="submit"
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Delete All Data
        </button>
      </form>
    </div>
  );
}
