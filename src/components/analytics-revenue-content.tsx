"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/format";
import type { RevenuePoint } from "@/lib/analytics";

const revenueChartConfig = {
  total: { label: "Revenue", color: "var(--primary)" },
} satisfies ChartConfig;

export function RevenueChartContent({
  revenueSeries,
  periodLabel,
}: {
  revenueSeries: RevenuePoint[];
  periodLabel: string | null;
}) {
  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{periodLabel}</span>
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
            content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
          />
          <Bar dataKey="total" fill="var(--color-total)" radius={4} />
        </BarChart>
      </ChartContainer>
    </>
  );
}
