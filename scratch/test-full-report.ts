import { getReceiptPaymentStatement } from "../app/actions/reports";

async function main() {
  // Test 1: Jan 2018 period
  console.log("=== Jan 1-31, 2018 ===");
  const janResult = await getReceiptPaymentStatement("2018-01-01", "2018-01-31");
  console.log("Opening Balance:", JSON.stringify(janResult.openingBalance, null, 2));
  console.log("Direct Incomes:", JSON.stringify(janResult.directIncomes, null, 2));
  console.log("Payments Fixed Assets:", JSON.stringify(janResult.payments.fixedAssets, null, 2));
  console.log("Payments Current Assets:", JSON.stringify(janResult.payments.currentAssets, null, 2));
  console.log("Payments Indirect Expenses:", JSON.stringify(janResult.payments.indirectExpenses, null, 2));
  console.log("Closing Balance:", JSON.stringify(janResult.closingBalance, null, 2));
  console.log("Total Receipts:", janResult.totalReceipts);
  console.log("Total Payments:", janResult.totalPayments);

  // Test 2: FY 2017-18
  console.log("\n\n=== FY 2017-18 (Apr 1, 2017 - Mar 31, 2018) ===");
  const fyResult = await getReceiptPaymentStatement("2017-04-01", "2018-03-31");
  console.log("Opening Balance:", JSON.stringify(fyResult.openingBalance, null, 2));
  console.log("Direct Incomes:", JSON.stringify(fyResult.directIncomes, null, 2));
  console.log("Payments Fixed Assets:", JSON.stringify(fyResult.payments.fixedAssets, null, 2));
  console.log("Payments Current Assets:", JSON.stringify(fyResult.payments.currentAssets, null, 2));
  console.log("Payments Indirect Expenses:", JSON.stringify(fyResult.payments.indirectExpenses, null, 2));
  console.log("Closing Balance:", JSON.stringify(fyResult.closingBalance, null, 2));
  console.log("Total Receipts:", fyResult.totalReceipts);
  console.log("Total Payments:", fyResult.totalPayments);

  // Test 3: Dec 2017 period  
  console.log("\n\n=== Dec 1-31, 2017 ===");
  const decResult = await getReceiptPaymentStatement("2017-12-01", "2017-12-31");
  console.log("Opening Balance:", JSON.stringify(decResult.openingBalance, null, 2));
  console.log("Direct Incomes:", JSON.stringify(decResult.directIncomes, null, 2));
  console.log("Payments Fixed Assets:", JSON.stringify(decResult.payments.fixedAssets, null, 2));
  console.log("Payments Current Assets:", JSON.stringify(decResult.payments.currentAssets, null, 2));
  console.log("Payments Indirect Expenses:", JSON.stringify(decResult.payments.indirectExpenses, null, 2));
  console.log("Closing Balance:", JSON.stringify(decResult.closingBalance, null, 2));
  console.log("Total Receipts:", decResult.totalReceipts);
  console.log("Total Payments:", decResult.totalPayments);
}

main().catch(console.error);
