import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { getBusinessDate } from "@/lib/date";
import { REVENUE_RANGES, type RevenueRange } from "@/lib/analytics";
import { PeriodStatsSection } from "@/components/analytics-stats";
import { RevenueChartShell } from "@/components/analytics-revenue-shell";
import { RevenueChartData } from "@/components/analytics-revenue-data";
import { SevaBreakdownShell } from "@/components/analytics-seva-shell";
import { SevaBreakdownData } from "@/components/analytics-seva-data";
import { StatsSkeleton, ChartSkeleton } from "@/components/analytics-skeletons";

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

  const today = getBusinessDate();

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Analytics</h1>

      <Suspense fallback={<StatsSkeleton />}>
        <PeriodStatsSection today={today} />
      </Suspense>

      <RevenueChartShell range={range} offset={offset}>
        <Suspense key={`${range}-${offset}`} fallback={<ChartSkeleton />}>
          <RevenueChartData range={range} offset={offset} today={today} />
        </Suspense>
      </RevenueChartShell>

      <SevaBreakdownShell sevaRange={sevaRange} sevaOffset={sevaOffset}>
        <Suspense key={`${sevaRange}-${sevaOffset}`} fallback={<ChartSkeleton />}>
          <SevaBreakdownData sevaRange={sevaRange} sevaOffset={sevaOffset} today={today} />
        </Suspense>
      </SevaBreakdownShell>
    </div>
  );
}
