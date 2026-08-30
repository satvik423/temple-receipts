import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CashRegisterModel } from "@/models/CashRegister";
import { getBusinessDate } from "@/lib/date";
import { getTodayBalance } from "@/lib/balance";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const openingBalance = Number(body?.openingBalance);

  if (!Number.isFinite(openingBalance) || openingBalance < 0) {
    return NextResponse.json({ error: "Enter a valid opening balance" }, { status: 400 });
  }

  await connectToDatabase();
  const businessDate = getBusinessDate();

  const existing = await CashRegisterModel.findOne({ businessDate });
  if (existing) {
    return NextResponse.json({ error: "Today's register is already open" }, { status: 400 });
  }

  await CashRegisterModel.create({ businessDate, openingBalance, openedAt: new Date() });
  return NextResponse.json(await getTodayBalance(businessDate), { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const closingBalanceActual = Number(body?.closingBalanceActual);

  if (!Number.isFinite(closingBalanceActual) || closingBalanceActual < 0) {
    return NextResponse.json({ error: "Enter a valid closing balance" }, { status: 400 });
  }

  await connectToDatabase();
  const businessDate = getBusinessDate();

  const register = await CashRegisterModel.findOneAndUpdate(
    { businessDate },
    { closingBalanceActual, closedAt: new Date() },
    { returnDocument: "after" },
  );

  if (!register) {
    return NextResponse.json({ error: "Open the day before closing it" }, { status: 400 });
  }

  return NextResponse.json(await getTodayBalance(businessDate));
}
