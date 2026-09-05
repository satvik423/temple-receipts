import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SevaModel } from "@/models/Seva";
import { ReceiptModel } from "@/models/Receipt";
import { getNextSequence } from "@/models/Counter";
import { getBusinessDate } from "@/lib/date";
import { toReceiptDTO } from "@/lib/dto";

type IncomingItem = {
  sevaId?: string;
  quantity?: number;
  amount?: number;
  bhaktaName?: string;
  bhaktaPhone?: string;
  remark?: string;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const incomingItems: IncomingItem[] = Array.isArray(body?.items) ? body.items : [];

  if (incomingItems.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  await connectToDatabase();

  const items = [];
  let total = 0;

  for (const incoming of incomingItems) {
    if (!incoming.sevaId) {
      return NextResponse.json({ error: "Missing seva" }, { status: 400 });
    }

    const seva = await SevaModel.findById(incoming.sevaId);
    if (!seva || !seva.active) {
      return NextResponse.json(
        { error: `${seva?.name ?? "A seva"} is no longer available` },
        { status: 400 },
      );
    }

    const isCustom = seva.price === null || seva.price === undefined;

    if (isCustom) {
      const amount = Number(incoming.amount);
      const bhaktaName = incoming.bhaktaName?.trim();
      const bhaktaPhone = incoming.bhaktaPhone?.trim();
      const remark = incoming.remark?.trim() || undefined;

      if (!Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json(
          { error: `Enter a valid amount for ${seva.name}` },
          { status: 400 },
        );
      }
      if (!bhaktaName) {
        return NextResponse.json(
          { error: `Name is required for ${seva.name}` },
          { status: 400 },
        );
      }

      items.push({
        sevaId: seva._id,
        sevaName: seva.name,
        sevaNameEn: seva.nameEn ?? undefined,
        quantity: 1,
        unitPrice: amount,
        amount,
        isCustom: true,
        bhaktaName,
        bhaktaPhone,
        isKanike: seva.category === "kanike",
        remark,
      });
      total += amount;
    } else {
      const quantity = Number(incoming.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        return NextResponse.json(
          { error: `Enter a valid quantity for ${seva.name}` },
          { status: 400 },
        );
      }

      const amount = seva.price! * quantity;
      items.push({
        sevaId: seva._id,
        sevaName: seva.name,
        sevaNameEn: seva.nameEn ?? undefined,
        quantity,
        unitPrice: seva.price!,
        amount,
        isCustom: false,
        isKanike: false,
      });
      total += amount;
    }
  }

  const businessDate = getBusinessDate();
  const [receiptNo, dbn] = await Promise.all([
    getNextSequence("receiptNo"),
    getNextSequence(`dbn:${businessDate}`),
  ]);

  const receipt = await ReceiptModel.create({
    receiptNo,
    dbn,
    businessDate,
    items,
    total,
  });

  return NextResponse.json(toReceiptDTO(receipt), { status: 201 });
}
