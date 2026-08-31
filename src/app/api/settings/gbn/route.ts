import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getSequenceValue, setSequenceValue } from "@/models/Counter";

const GBN_COUNTER_NAME = "receiptNo";

export async function GET() {
  await connectToDatabase();
  const current = await getSequenceValue(GBN_COUNTER_NAME);
  return NextResponse.json({ current });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const nextGbn = Number(body?.nextGbn);

  if (!Number.isInteger(nextGbn) || nextGbn < 1) {
    return NextResponse.json(
      { error: "Next bill number must be a positive whole number" },
      { status: 400 },
    );
  }

  await connectToDatabase();
  const current = await getSequenceValue(GBN_COUNTER_NAME);

  if (nextGbn <= current) {
    return NextResponse.json(
      { error: `Next bill number must be greater than the current value (${current})` },
      { status: 400 },
    );
  }

  await setSequenceValue(GBN_COUNTER_NAME, nextGbn - 1);
  return NextResponse.json({ current: nextGbn - 1 });
}
