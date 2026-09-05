import { connectToDatabase } from "@/lib/mongodb";
import { getAnchorDate, getRevenueSeries, type RevenueRange } from "@/lib/analytics";
import { RevenueChartContent } from "@/components/analytics-revenue-content";

export async function RevenueChartData({
  range,
  offset,
  today,
}: {
  range: RevenueRange;
  offset: number;
  today: string;
}) {
  await connectToDatabase();
  const anchor = getAnchorDate(range, today, offset);
  const revenueSeries = await getRevenueSeries(range, anchor);

  const periodLabel =
    revenueSeries.length > 0
      ? `${revenueSeries[0].label} – ${revenueSeries[revenueSeries.length - 1].label}`
      : null;

  return <RevenueChartContent revenueSeries={revenueSeries} periodLabel={periodLabel} />;
}
