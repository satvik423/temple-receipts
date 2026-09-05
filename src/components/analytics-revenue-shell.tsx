"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RANGE_LABELS, type RevenueRange } from "@/lib/analytics-shared";

export function RevenueChartShell({
  range,
  offset,
  children,
}: {
  range: RevenueRange;
  offset: number;
  children: React.ReactNode;
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

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base">{RANGE_LABELS[range]} Revenue</CardTitle>
        <div className="flex items-center gap-2">
          <Tabs value={range} onValueChange={setRange}>
            <TabsList>
              {(Object.keys(RANGE_LABELS) as RevenueRange[]).map((key) => (
                <TabsTrigger key={key} value={key}>
                  {RANGE_LABELS[key]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
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
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
