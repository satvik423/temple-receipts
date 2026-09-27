import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ReceiptModel } from "@/models/Receipt";
import { setSequenceValue } from "@/models/Counter";

// Large enough to never collide with any real receiptNo while shifting a range
// out of the way (see the GBN renumbering step below).
const GBN_RENUMBER_OFFSET = 1_000_000_000;

// Permanently deletes a receipt, then closes the gap it leaves behind:
// - DBN (per business-date, no unique index) is decremented in place.
// - GBN/receiptNo (globally unique) is shifted out of range first, then back
//   down by one, so the unique index is never transiently violated regardless
//   of update order.
// Both counters are recomputed from the surviving data afterward so they stay
// correct even if they'd ever drifted from it.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  await connectToDatabase();

  const session = await mongoose.startSession();
  let found = false;

  try {
    await session.withTransaction(async () => {
      const receipt = await ReceiptModel.findById(id).session(session);
      if (!receipt) return;
      found = true;

      const { businessDate, dbn: deletedDbn, receiptNo: deletedReceiptNo } = receipt;

      await ReceiptModel.deleteOne({ _id: id }, { session });

      await ReceiptModel.updateMany(
        { businessDate, dbn: { $gt: deletedDbn } },
        { $inc: { dbn: -1 } },
        { session },
      );

      await ReceiptModel.updateMany(
        { receiptNo: { $gt: deletedReceiptNo } },
        { $inc: { receiptNo: GBN_RENUMBER_OFFSET } },
        { session },
      );
      await ReceiptModel.updateMany(
        { receiptNo: { $gt: GBN_RENUMBER_OFFSET } },
        { $inc: { receiptNo: -(GBN_RENUMBER_OFFSET + 1) } },
        { session },
      );

      const [dbnMax, gbnMax] = await Promise.all([
        ReceiptModel.findOne({ businessDate }).sort({ dbn: -1 }).session(session),
        ReceiptModel.findOne({}).sort({ receiptNo: -1 }).session(session),
      ]);

      await Promise.all([
        setSequenceValue(`dbn:${businessDate}`, dbnMax?.dbn ?? 0, { session }),
        setSequenceValue("receiptNo", gbnMax?.receiptNo ?? 0, { session }),
      ]);
    });
  } finally {
    await session.endSession();
  }

  if (!found) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
