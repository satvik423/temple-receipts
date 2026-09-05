import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { getBusinessDate } from "@/lib/date";
import {
  REVENUE_RANGES,
  getAnchorDate,
  getPeriodStats,
  getRevenueSeries,
  getSevaBreakdown,
  getSinglePeriod,
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
  searchParams: Promise<{ range?: string; offset?: string; sevaRange?: string; sevaOffset?: string }>;
}) {
  await requireAdmin("/analytics");

  const { range: rangeParam, offset: offsetParam, sevaRange: sevaRangeParam, sevaOffset: sevaOffsetParam } =
    await searchParams;
  const range: RevenueRange = REVENUE_RANGES.includes(rangeParam as RevenueRange)
    ? (rangeParam as RevenueRange)
    : "daily";
  const offset = parseOffset(offsetParam);
  const sevaRange: RevenueRange = REVENUE_RANGES.includes(sevaRangeParam as RevenueRange)
    ? (sevaRangeParam as RevenueRange)
    : "daily";
  const sevaOffset = parseOffset(sevaOffsetParam);

  await connectToDatabase();
  const today = getBusinessDate();
  const anchor = getAnchorDate(range, today, offset);
  const sevaPeriod = getSinglePeriod(sevaRange, today, sevaOffset);

  const [periodStats, revenueSeries, sevaBreakdown] = await Promise.all([
    getPeriodStats(today),
    getRevenueSeries(range, anchor),
    getSevaBreakdown(sevaPeriod.start, sevaPeriod.end),
  ]);

  return (
    <AnalyticsView
      range={range}
      offset={offset}
      periodStats={periodStats}
      revenueSeries={revenueSeries}
      sevaBreakdown={sevaBreakdown}
      sevaRange={sevaRange}
      sevaOffset={sevaOffset}
      sevaPeriodLabel={sevaPeriod.label}
    />
  );
}
