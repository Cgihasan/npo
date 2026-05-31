"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { clearVouchers, requestVoucherDeletion } from '@/app/actions/voucherAdmin';
import { Shield, Trash2 } from 'lucide-react';

export default function DeleteButton() {
  const router = useRouter();
  const { data: sessionData } = useSession();
  const isAdmin = (sessionData?.user as any)?.role === 'ADMIN';

  const handleDelete = async () => {
    if (isAdmin) {
      // Admin: directly clear vouchers after confirmation
      if (confirm('Are you sure you want to permanently delete all vouchers?')) {
        try {
          await clearVouchers();
          alert('All vouchers have been deleted.');
          router.refresh();
        } catch (e) {
          console.error(e);
          alert('Failed to delete vouchers.');
        }
      }
    } else {
      // Non‑admin: request deletion
      if (confirm('Request deletion of all vouchers? An admin will review your request.')) {
        try {
          await requestVoucherDeletion();
          alert('Deletion request submitted for admin approval.');
        } catch (e) {
          console.error(e);
          alert('Failed to submit request.');
        }
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
    >
      <Trash2 className="h-4 w-4" />
      {isAdmin ? 'Delete All Vouchers' : 'Request Deletion'}
    </button>
  );
}
