import { connectToDatabase } from "@/lib/mongodb";
import { getBusinessDate } from "@/lib/date";
import { getSalesTotal } from "@/lib/balance";
import { CashRegisterModel } from "@/models/CashRegister";
import {
  REVENUE_RANGES,
  getFixedVsCustomSplit,
  getPeriodStats,
  getRangeStartDate,
  getRevenueSeries,
  getSevaBreakdown,
  type RevenueRange,
} from "@/lib/analytics";
import { AnalyticsView, type BalanceVariancePoint } from "@/components/analytics-view";

export const dynamic = "force-dynamic";

const BALANCE_HISTORY_DAYS = 14;

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rangeParam } = await searchParams;
  const range: RevenueRange = REVENUE_RANGES.includes(rangeParam as RevenueRange)
    ? (rangeParam as RevenueRange)
    : "daily";

  await connectToDatabase();
  const today = getBusinessDate();
  const rangeStart = getRangeStartDate(range, today);

  const [periodStats, revenueSeries, sevaBreakdown, fixedVsCustom, balanceRegisters] =
    await Promise.all([
      getPeriodStats(today),
      getRevenueSeries(range, today),
      getSevaBreakdown(rangeStart, today),
      getFixedVsCustomSplit(rangeStart, today),
      CashRegisterModel.find().sort({ businessDate: -1 }).limit(BALANCE_HISTORY_DAYS),
    ]);

  const balanceHistory: BalanceVariancePoint[] = await Promise.all(
    balanceRegisters
      .slice()
      .reverse()
      .filter((register) => register.closingBalanceActual != null)
      .map(async (register) => {
        const salesTotal = await getSalesTotal(register.businessDate);
        const expectedClosing = register.openingBalance + salesTotal;
        return {
          businessDate: register.businessDate,
          variance: register.closingBalanceActual! - expectedClosing,
        };
      }),
  );

  return (
    <AnalyticsView
      range={range}
      periodStats={periodStats}
      revenueSeries={revenueSeries}
      sevaBreakdown={sevaBreakdown}
      fixedVsCustom={fixedVsCustom}
      balanceHistory={balanceHistory}
    />
  );
}
