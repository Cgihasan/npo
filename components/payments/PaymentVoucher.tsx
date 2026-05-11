import React from "react";
import { format } from "date-fns";

interface PaymentVoucherProps {
  payment: any;
}

export const PaymentVoucher = React.forwardRef<HTMLDivElement, PaymentVoucherProps>(
  ({ payment }, ref) => {
    return (
      <div
        ref={ref}
        className="p-10 bg-white text-black w-[210mm] min-h-[148mm] font-sans border shadow-sm"
        id="payment-voucher"
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-amber-600 pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-amber-700">Zinat Al Ruh</h1>
            <p className="text-sm text-gray-600">NPO Registration No: NPO-2024-5542</p>
            <p className="text-sm text-gray-600">123 Charity Lane, City Center, 400001</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-800">PAYMENT VOUCHER</h2>
            <p className="text-amber-600 font-mono font-bold">{payment.voucherNo}</p>
            <p className="text-sm text-gray-500">{format(new Date(payment.date), "PPP")}</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-500 font-medium">Payment Category:</span>
            <span className="text-gray-800 font-medium">{payment.category}</span>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-500 font-medium">Account Head:</span>
            <span className="text-gray-800">{payment.type}</span>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-500 font-medium">Payment Mode:</span>
            <span className="text-gray-800">{payment.paymentMode} {payment.chequeNo ? `(Chq: ${payment.chequeNo})` : ""}</span>
          </div>

          <div className="mt-10 p-6 bg-amber-50 rounded-lg border border-amber-100 flex justify-between items-center">
            <span className="text-amber-800 font-bold text-xl uppercase tracking-wider">Amount Paid</span>
            <span className="text-3xl font-black text-amber-700">₹{Number(payment.amount).toLocaleString()}</span>
          </div>

          <div className="mt-6">
            <p className="text-sm text-gray-500 italic">Narration:</p>
            <p className="text-gray-700">{payment.narration || "No additional notes provided."}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 flex justify-between items-end">
          <div className="space-y-12 w-48 text-center">
            <div className="border-t border-gray-400 pt-2">
              <p className="text-sm font-bold text-gray-800">Receiver's Signature</p>
            </div>
          </div>
          <div className="space-y-12 w-48 text-center">
            <div className="border-t border-gray-400 pt-2">
              <p className="text-sm font-bold text-gray-800">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

PaymentVoucher.displayName = "PaymentVoucher";
