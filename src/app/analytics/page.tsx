import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { getBusinessDate } from "@/lib/date";
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
import { AnalyticsView } from "@/components/analytics-view";

export const dynamic = "force-dynamic";

function parseOffset(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; offset?: string }>;
}) {
  await requireAdmin("/analytics");

  const { range: rangeParam, offset: offsetParam } = await searchParams;
  const range: RevenueRange = REVENUE_RANGES.includes(rangeParam as RevenueRange)
    ? (rangeParam as RevenueRange)
    : "daily";
  const offset = parseOffset(offsetParam);

  await connectToDatabase();
  const today = getBusinessDate();
  const anchor = getAnchorDate(range, today, offset);
  const rangeStart = getRangeStartDate(range, anchor);

  const [periodStats, revenueSeries, sevaBreakdown, fixedVsCustom] = await Promise.all([
    getPeriodStats(today),
    getRevenueSeries(range, anchor),
    getSevaBreakdown(rangeStart, anchor),
    getFixedVsCustomSplit(rangeStart, anchor),
  ]);

  return (
    <AnalyticsView
      range={range}
      offset={offset}
      periodStats={periodStats}
      revenueSeries={revenueSeries}
      sevaBreakdown={sevaBreakdown}
      fixedVsCustom={fixedVsCustom}
    />
  );
}
