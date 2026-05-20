import React from "react";
import { format } from "date-fns";

interface ReceiptVoucherProps {
  receipt: any;
}

export const ReceiptVoucher = React.forwardRef<HTMLDivElement, ReceiptVoucherProps>(
  ({ receipt }, ref) => {
    return (
      <div
        ref={ref}
        className="p-10 bg-white text-black w-[210mm] min-h-[148mm] font-sans border shadow-sm"
        id="receipt-voucher"
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-emerald-700">Zinat Al Ruh</h1>
            <p className="text-sm text-gray-600">NPO Registration No: NPO-2024-5542</p>
            <p className="text-sm text-gray-600">123 Charity Lane, City Center, 400001</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-800">RECEIPT</h2>
            <p className="text-emerald-600 font-mono font-bold">{receipt.receiptNo}</p>
            <p className="text-sm text-gray-500">{format(new Date(receipt.date), "PPP")}</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-500 font-medium">Received From:</span>
            <span className="font-bold text-lg">{receipt.donor?.name || "N/A"}</span>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-500 font-medium">Payment For:</span>
            <span className="text-gray-800">{receipt.type}</span>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-500 font-medium">Payment Mode:</span>
            <span className="text-gray-800">{receipt.paymentMode} {receipt.referenceNo ? `(${receipt.referenceNo})` : ""}</span>
          </div>

          <div className="mt-10 p-6 bg-emerald-50 rounded-lg border border-emerald-100 flex justify-between items-center">
            <span className="text-emerald-800 font-bold text-xl uppercase tracking-wider">Amount Received</span>
            <span className="text-3xl font-black text-emerald-700">₹{Number(receipt.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div className="mt-6">
            <p className="text-sm text-gray-500 italic">Narration:</p>
            <p className="text-gray-700">{receipt.narration || "No additional notes provided."}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 flex justify-between items-end">
          <div className="text-xs text-gray-400">
            <p>Computer generated receipt.</p>
            <p>Date Generated: {format(new Date(), "PPpp")}</p>
          </div>
          <div className="text-center w-48">
            <div className="border-t border-gray-400 pt-2">
              <p className="text-sm font-bold text-gray-800">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ReceiptVoucher.displayName = "ReceiptVoucher";
