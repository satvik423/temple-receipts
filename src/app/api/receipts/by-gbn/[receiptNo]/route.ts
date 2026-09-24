import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ReceiptModel } from "@/models/Receipt";
import { toReceiptDTO } from "@/lib/dto";

// Deliberately does not use ACTIVE_RECEIPT_FILTER: this lookup must find
// soft-deleted receipts too, so an admin can review and restore them.
export async function GET(_request: Request, { params }: { params: Promise<{ receiptNo: string }> }) {
  await requireAdmin();
  const { receiptNo } = await params;
  const num = Number(receiptNo);

  if (!Number.isInteger(num)) {
    return NextResponse.json({ error: "Invalid GBN" }, { status: 400 });
  }

  await connectToDatabase();
  const receipt = await ReceiptModel.findOne({ receiptNo: num });

  if (!receipt) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  return NextResponse.json(toReceiptDTO(receipt));
}
