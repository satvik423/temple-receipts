import { connectToDatabase } from "@/lib/mongodb";
import { CashRegisterModel } from "@/models/CashRegister";
import { getBusinessDate } from "@/lib/date";
import { getSalesTotal, getTodayBalance } from "@/lib/balance";
import { BalanceView, type HistoryEntry } from "@/components/balance-view";

export const dynamic = "force-dynamic";

const HISTORY_LIMIT = 30;

export default async function BalancePage() {
  await connectToDatabase();
  const businessDate = getBusinessDate();

  const [today, historyRegisters] = await Promise.all([
    getTodayBalance(businessDate),
    CashRegisterModel.find().sort({ businessDate: -1 }).limit(HISTORY_LIMIT),
  ]);

  const history: HistoryEntry[] = await Promise.all(
    historyRegisters.map(async (register) => {
      const salesTotal = await getSalesTotal(register.businessDate);
      const expectedClosing = register.openingBalance + salesTotal;
      const closingBalanceActual = register.closingBalanceActual ?? null;
      return {
        businessDate: register.businessDate,
        openingBalance: register.openingBalance,
        salesTotal,
        expectedClosing,
        closingBalanceActual,
        variance: closingBalanceActual != null ? closingBalanceActual - expectedClosing : null,
      };
    }),
  );

  return <BalanceView today={today} businessDate={businessDate} history={history} />;
}
