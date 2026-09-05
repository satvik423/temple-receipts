import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { getPeriodStats } from "@/lib/analytics";

export async function PeriodStatsSection({ today }: { today: string }) {
  const periodStats = await getPeriodStats(today);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {periodStats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-xl font-semibold">{formatCurrency(stat.total)}</p>
            <p className="text-xs text-muted-foreground">
              {stat.count} {stat.count === 1 ? "receipt" : "receipts"}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
