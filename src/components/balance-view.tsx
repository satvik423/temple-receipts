"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { formatBusinessDate } from "@/lib/date";
import type { TodayBalance } from "@/lib/balance";

export type HistoryEntry = {
  businessDate: string;
  openingBalance: number;
  salesTotal: number;
};

export function BalanceView({
  today,
  businessDate,
  history,
}: {
  today: TodayBalance | null;
  businessDate: string;
  history: HistoryEntry[];
}) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Day Balance</h1>
        <Button variant="outline" size="icon" onClick={() => router.refresh()} aria-label="Refresh">
          <RefreshCw className="size-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today · {formatBusinessDate(businessDate)}</CardTitle>
        </CardHeader>
        <CardContent>
          {today === null ? (
            <OpenDayForm />
          ) : (
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <Stat label="Opening" value={formatCurrency(today.openingBalance)} />
              <Stat label="Sales So Far" value={formatCurrency(today.salesTotal)} />
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No past days recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Opening</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((entry) => (
                    <TableRow key={entry.businessDate}>
                      <TableCell className="font-medium">
                        {formatBusinessDate(entry.businessDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(entry.openingBalance)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(entry.salesTotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OpenDayForm() {
  const router = useRouter();
  const [openingBalance, setOpeningBalance] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openingBalance: Number(openingBalance) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "Could not open the day");
        return;
      }
      toast.success("Day opened");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xs flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Enter the counter&apos;s opening cash balance to start today.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="opening-balance">Opening Balance (₹)</Label>
        <Input
          id="opening-balance"
          type="number"
          min={0}
          step="1"
          value={openingBalance}
          onChange={(e) => setOpeningBalance(e.target.value)}
          autoFocus
        />
      </div>
      <Button type="submit" disabled={submitting || openingBalance.trim().length === 0}>
        {submitting ? "Opening..." : "Open Day"}
      </Button>
    </form>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
