import { connectToDatabase } from "@/lib/mongodb";
import { getBusinessDate } from "@/lib/date";
import { getSalesTotal } from "@/lib/balance";
import { CashRegisterModel } from "@/models/CashRegister";
import {
  REVENUE_RANGES,
  getAnchorDate,
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

function parseOffset(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; offset?: string; balanceOffset?: string }>;
}) {
  const { range: rangeParam, offset: offsetParam, balanceOffset: balanceOffsetParam } =
    await searchParams;
  const range: RevenueRange = REVENUE_RANGES.includes(rangeParam as RevenueRange)
    ? (rangeParam as RevenueRange)
    : "daily";
  const offset = parseOffset(offsetParam);
  const balanceOffset = parseOffset(balanceOffsetParam);

  await connectToDatabase();
  const today = getBusinessDate();
  const anchor = getAnchorDate(range, today, offset);
  const rangeStart = getRangeStartDate(range, anchor);

  const [periodStats, revenueSeries, sevaBreakdown, fixedVsCustom, balanceRegisters, balanceTotalCount] =
    await Promise.all([
      getPeriodStats(today),
      getRevenueSeries(range, anchor),
      getSevaBreakdown(rangeStart, anchor),
      getFixedVsCustomSplit(rangeStart, anchor),
      CashRegisterModel.find()
        .sort({ businessDate: -1 })
        .skip(balanceOffset * BALANCE_HISTORY_DAYS)
        .limit(BALANCE_HISTORY_DAYS),
      CashRegisterModel.countDocuments(),
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

  const hasOlderBalanceHistory =
    (balanceOffset + 1) * BALANCE_HISTORY_DAYS < balanceTotalCount;

  return (
    <AnalyticsView
      range={range}
      offset={offset}
      periodStats={periodStats}
      revenueSeries={revenueSeries}
      sevaBreakdown={sevaBreakdown}
      fixedVsCustom={fixedVsCustom}
      balanceHistory={balanceHistory}
      balanceOffset={balanceOffset}
      hasOlderBalanceHistory={hasOlderBalanceHistory}
    />
  );
}
