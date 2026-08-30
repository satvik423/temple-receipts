"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, RefreshCw } from "lucide-react";
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
  expectedClosing: number;
  closingBalanceActual: number | null;
  variance: number | null;
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
          ) : today.isClosed ? (
            <ClosedDaySummary today={today} />
          ) : (
            <OpenDaySummary today={today} />
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
                    <TableHead className="text-right">Expected</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
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
                      <TableCell className="text-right">
                        {formatCurrency(entry.expectedClosing)}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.closingBalanceActual != null
                          ? formatCurrency(entry.closingBalanceActual)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <VarianceLabel variance={entry.variance} />
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

function VarianceLabel({ variance }: { variance: number | null }) {
  if (variance === null) return <span className="text-muted-foreground">—</span>;
  if (variance === 0) return <span className="text-emerald-600 dark:text-emerald-400">Matched</span>;
  if (variance > 0) {
    return (
      <span className="text-emerald-600 dark:text-emerald-400">
        +{formatCurrency(variance)} over
      </span>
    );
  }
  return <span className="text-destructive">{formatCurrency(-variance)} short</span>;
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

function OpenDaySummary({ today }: { today: TodayBalance }) {
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
        <Stat label="Opening" value={formatCurrency(today.openingBalance)} />
        <Stat label="Sales So Far" value={formatCurrency(today.salesTotal)} />
        <Stat label="Expected Closing" value={formatCurrency(today.expectedClosing)} />
      </dl>
      <CloseDayForm />
    </div>
  );
}

function ClosedDaySummary({ today }: { today: TodayBalance }) {
  const [editing, setEditing] = React.useState(false);
  const variance = (today.closingBalanceActual ?? 0) - today.expectedClosing;

  if (editing) {
    return <CloseDayForm defaultValue={today.closingBalanceActual ?? undefined} onDone={() => setEditing(false)} />;
  }

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <Stat label="Opening" value={formatCurrency(today.openingBalance)} />
        <Stat label="Sales" value={formatCurrency(today.salesTotal)} />
        <Stat label="Expected Closing" value={formatCurrency(today.expectedClosing)} />
        <Stat
          label="Actual Closing"
          value={formatCurrency(today.closingBalanceActual ?? 0)}
        />
      </dl>
      <div className="flex items-center gap-3">
        <VarianceLabel variance={variance} />
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          <Pencil className="size-3.5" />
          Correct
        </Button>
      </div>
    </div>
  );
}

function CloseDayForm({
  defaultValue,
  onDone,
}: {
  defaultValue?: number;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [closingBalance, setClosingBalance] = React.useState(
    defaultValue != null ? String(defaultValue) : "",
  );
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/balance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closingBalanceActual: Number(closingBalance) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "Could not close the day");
        return;
      }
      toast.success("Day closed");
      onDone?.();
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xs flex-col gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="closing-balance">Actual Closing Balance (₹)</Label>
        <Input
          id="closing-balance"
          type="number"
          min={0}
          step="1"
          value={closingBalance}
          onChange={(e) => setClosingBalance(e.target.value)}
          autoFocus
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting || closingBalance.trim().length === 0}>
          {submitting ? "Saving..." : "Close Day"}
        </Button>
        {onDone ? (
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
        ) : null}
      </div>
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
