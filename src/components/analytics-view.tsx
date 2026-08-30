"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/format";
import { formatBusinessDate } from "@/lib/date";
import type { PeriodStat, RevenuePoint, RevenueRange, SevaBreakdownEntry } from "@/lib/analytics";

export type BalanceVariancePoint = {
  businessDate: string;
  variance: number;
};

const RANGE_LABELS: Record<RevenueRange, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

const revenueChartConfig = {
  total: { label: "Revenue", color: "var(--primary)" },
} satisfies ChartConfig;

const varianceChartConfig = {
  positive: { label: "Matched / Over", color: "var(--chart-positive)" },
  negative: { label: "Short", color: "var(--chart-negative)" },
} satisfies ChartConfig;

export function AnalyticsView({
  range,
  periodStats,
  revenueSeries,
  sevaBreakdown,
  fixedVsCustom,
  balanceHistory,
}: {
  range: RevenueRange;
  periodStats: PeriodStat[];
  revenueSeries: RevenuePoint[];
  sevaBreakdown: SevaBreakdownEntry[];
  fixedVsCustom: { fixed: number; custom: number };
  balanceHistory: BalanceVariancePoint[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setRange(nextRange: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", nextRange);
    router.push(`${pathname}?${params.toString()}`);
  }

  const maxSevaTotal = Math.max(1, ...sevaBreakdown.map((s) => s.total));
  const fixedVsCustomTotal = fixedVsCustom.fixed + fixedVsCustom.custom;

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

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Sevas</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fixed vs Custom</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Fixed-price Sevas</p>
              <p className="text-lg font-semibold">{formatCurrency(fixedVsCustom.fixed)}</p>
              <p className="text-xs text-muted-foreground">
                {fixedVsCustomTotal > 0
                  ? `${Math.round((fixedVsCustom.fixed / fixedVsCustomTotal) * 100)}%`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Custom-price Sevas</p>
              <p className="text-lg font-semibold">{formatCurrency(fixedVsCustom.custom)}</p>
              <p className="text-xs text-muted-foreground">
                {fixedVsCustomTotal > 0
                  ? `${Math.round((fixedVsCustom.custom / fixedVsCustomTotal) * 100)}%`
                  : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cash Balance Variance (last 14 closed days)</CardTitle>
        </CardHeader>
        <CardContent>
          {balanceHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No closed days yet — variance appears once a day&apos;s register is closed.
            </p>
          ) : (
            <ChartContainer config={varianceChartConfig} className="aspect-auto h-56 w-full">
              <BarChart data={balanceHistory} margin={{ left: 0, right: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="businessDate"
                  tickFormatter={(value) => formatBusinessDate(value).slice(0, 5)}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
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
                      labelFormatter={(value) => formatBusinessDate(String(value))}
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  }
                />
                <Bar dataKey="variance" radius={4}>
                  {balanceHistory.map((entry) => (
                    <Cell
                      key={entry.businessDate}
                      fill={entry.variance >= 0 ? "var(--color-positive)" : "var(--color-negative)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
