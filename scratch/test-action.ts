import { getNextReceiptNumber } from "../app/actions/receipts";

async function test() {
  try {
    const nextNo = await getNextReceiptNumber("2026-05-10");
    console.log("Success:", nextNo);
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
