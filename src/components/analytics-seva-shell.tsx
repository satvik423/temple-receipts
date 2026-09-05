"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RANGE_LABELS, type RevenueRange } from "@/lib/analytics-shared";

export function SevaBreakdownShell({
  sevaRange,
  sevaOffset,
  children,
}: {
  sevaRange: RevenueRange;
  sevaOffset: number;
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

  function setSevaRange(nextRange: string) {
    updateParams({ sevaRange: nextRange, sevaOffset: undefined });
  }

  function stepSevaOffset(delta: number) {
    const next = Math.max(0, sevaOffset + delta);
    updateParams({ sevaOffset: next > 0 ? String(next) : undefined });
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base">Seva Contributions</CardTitle>
        <div className="flex items-center gap-2">
          <Tabs value={sevaRange} onValueChange={setSevaRange}>
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
            onClick={() => stepSevaOffset(1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Show later period"
            disabled={sevaOffset === 0}
            onClick={() => stepSevaOffset(-1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
