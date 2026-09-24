import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ReceiptModel, ACTIVE_RECEIPT_FILTER } from "@/models/Receipt";

// Soft delete: unlike DELETE /api/sevas/[id], this marks the receipt inactive
// rather than removing the document, keeping it recoverable/auditable.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  await connectToDatabase();
  const receipt = await ReceiptModel.findOneAndUpdate(
    { _id: id, ...ACTIVE_RECEIPT_FILTER },
    { $set: { active: false } },
  );

  if (!receipt) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

// Restore: the inverse of the DELETE above. Filtering on active: false makes
// restoring an already-active (or already-restored) receipt 404 instead of
// silently no-op'ing.
export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  await connectToDatabase();
  const receipt = await ReceiptModel.findOneAndUpdate(
    { _id: id, active: false },
    { $set: { active: true } },
  );

  if (!receipt) {
    return NextResponse.json({ error: "Receipt not found or not deleted" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
