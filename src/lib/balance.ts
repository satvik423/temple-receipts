import { CashRegisterModel } from "@/models/CashRegister";
import { ReceiptModel } from "@/models/Receipt";

export type TodayBalance = {
  businessDate: string;
  openingBalance: number;
  salesTotal: number;
  expectedClosing: number;
  closingBalanceActual: number | null;
  isClosed: boolean;
};

export async function getSalesTotal(businessDate: string): Promise<number> {
  const result = await ReceiptModel.aggregate([
    { $match: { businessDate } },
    { $group: { _id: null, total: { $sum: "$total" } } },
  ]);
  return result[0]?.total ?? 0;
}

export async function getTodayBalance(businessDate: string): Promise<TodayBalance | null> {
  const register = await CashRegisterModel.findOne({ businessDate });
  if (!register) return null;

  const salesTotal = await getSalesTotal(businessDate);

  return {
    businessDate,
    openingBalance: register.openingBalance,
    salesTotal,
    expectedClosing: register.openingBalance + salesTotal,
    closingBalanceActual: register.closingBalanceActual ?? null,
    isClosed: register.closingBalanceActual != null,
  };
}
