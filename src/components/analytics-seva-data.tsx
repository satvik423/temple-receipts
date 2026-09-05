import { connectToDatabase } from "@/lib/mongodb";
import { formatCurrency } from "@/lib/format";
import { getSevaBreakdown, getSinglePeriod, type RevenueRange } from "@/lib/analytics";

export async function SevaBreakdownData({
  sevaRange,
  sevaOffset,
  today,
}: {
  sevaRange: RevenueRange;
  sevaOffset: number;
  today: string;
}) {
  await connectToDatabase();
  const sevaPeriod = getSinglePeriod(sevaRange, today, sevaOffset);
  const sevaBreakdown = await getSevaBreakdown(sevaPeriod.start, sevaPeriod.end);
  const maxSevaTotal = Math.max(1, ...sevaBreakdown.map((s) => s.total));

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{sevaPeriod.label}</span>
      </div>
      {sevaBreakdown.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sales in this period yet.</p>
      ) : (
        <div className="space-y-3">
          {sevaBreakdown.map((seva) => (
            <div key={seva.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{seva.name}</span>
                <span className="text-muted-foreground">{formatCurrency(seva.total)}</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${(seva.total / maxSevaTotal) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
