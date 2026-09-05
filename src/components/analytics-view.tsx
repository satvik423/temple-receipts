"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/format";
import type { PeriodStat, RevenuePoint, RevenueRange, SevaBreakdownEntry } from "@/lib/analytics";

const RANGE_LABELS: Record<RevenueRange, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

const revenueChartConfig = {
  total: { label: "Revenue", color: "var(--primary)" },
} satisfies ChartConfig;

export function AnalyticsView({
  range,
  offset,
  periodStats,
  revenueSeries,
  sevaBreakdown,
}: {
  range: RevenueRange;
  offset: number;
  periodStats: PeriodStat[];
  revenueSeries: RevenuePoint[];
  sevaBreakdown: SevaBreakdownEntry[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function setRange(nextRange: string) {
    updateParams({ range: nextRange, offset: undefined });
  }

  function stepOffset(delta: number) {
    const next = Math.max(0, offset + delta);
    updateParams({ offset: next > 0 ? String(next) : undefined });
  }

  const maxSevaTotal = Math.max(1, ...sevaBreakdown.map((s) => s.total));
  const periodLabel =
    revenueSeries.length > 0
      ? `${revenueSeries[0].label} – ${revenueSeries[revenueSeries.length - 1].label}`
      : null;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Analytics</h1>

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

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">{RANGE_LABELS[range]} Revenue</CardTitle>
          <Tabs value={range} onValueChange={setRange}>
            <TabsList>
              {(Object.keys(RANGE_LABELS) as RevenueRange[]).map((key) => (
                <TabsTrigger key={key} value={key}>
                  {RANGE_LABELS[key]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{periodLabel}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="Show earlier period"
                onClick={() => stepOffset(1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Show later period"
                disabled={offset === 0}
                onClick={() => stepOffset(-1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
          <ChartContainer config={revenueChartConfig} className="aspect-auto h-64 w-full">
            <BarChart data={revenueSeries} margin={{ left: 0, right: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval="preserveStartEnd"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={56}
                tickFormatter={(value) => formatCurrency(Number(value))}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                }
              />
              <Bar dataKey="total" fill="var(--color-total)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Seva Contributions</CardTitle>
          {periodLabel ? <span className="text-sm text-muted-foreground">{periodLabel}</span> : null}
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
