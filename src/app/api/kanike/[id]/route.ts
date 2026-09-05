import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ReceiptModel } from "@/models/Receipt";
import { toReceiptDTO } from "@/lib/dto";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();

  const { id } = await params;
  const body = await request.json().catch(() => null);

  await connectToDatabase();
  const receipt = await ReceiptModel.findById(id);

  if (!receipt) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  if (receipt.items.length !== 1 || receipt.items[0].isKanike !== true) {
    return NextResponse.json({ error: "Not a kanike receipt" }, { status: 400 });
  }

  const bhaktaName = typeof body?.bhaktaName === "string" ? body.bhaktaName.trim() : "";
  if (!bhaktaName) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const bhaktaPhone = typeof body?.bhaktaPhone === "string" ? body.bhaktaPhone.trim() : "";
  const remark = typeof body?.remark === "string" ? body.remark.trim() : "";

  const item = receipt.items[0];
  item.bhaktaName = bhaktaName;
  item.bhaktaPhone = bhaktaPhone || undefined;
  item.remark = remark || undefined;

  await receipt.save();

  return NextResponse.json(toReceiptDTO(receipt));
}
