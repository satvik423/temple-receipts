"use client";

import * as React from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MONTH_NAMES, shiftBusinessDate } from "@/lib/date";
import type { ReportFormat } from "@/components/history-report-dialog";

const YEAR_OPTIONS_COUNT = 6;
const BASE_ENDPOINT = "/api/receipts/report/kanike";
const DEFAULT_RANGE_DAYS = 30;

export function KanikeReportDialog({
  today,
  format,
  triggerLabel,
}: {
  today: string;
  format: ReportFormat;
  triggerLabel: string;
}) {
  const currentYear = Number(today.slice(0, 4));
  const currentMonth = Number(today.slice(5, 7));

  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<"month" | "range">("month");
  const [year, setYear] = React.useState(String(currentYear));
  const [month, setMonth] = React.useState(String(currentMonth));
  const [from, setFrom] = React.useState(shiftBusinessDate(today, -(DEFAULT_RANGE_DAYS - 1)));
  const [to, setTo] = React.useState(today);

  const years = Array.from({ length: YEAR_OPTIONS_COUNT }, (_, i) => String(currentYear - i));

  const rangeError =
    from === "" || to === ""
      ? "Pick both dates"
      : from > to
        ? "'From' must be on or before 'To'"
        : null;

  function handleDownload() {
    if (type === "range" && rangeError !== null) return;
    const params = new URLSearchParams({ type });
    if (type === "month") {
      params.set("year", year);
      params.set("month", month);
    } else {
      params.set("from", from);
      params.set("to", to);
    }
    const endpoint = `${BASE_ENDPOINT}${format === "xlsx" ? "/xlsx" : ""}`;
    window.open(`${endpoint}?${params.toString()}`, "_blank");
    setOpen(false);
  }

  const formatLabel = format === "xlsx" ? "Excel" : "PDF";
  const downloadDisabled = type === "range" && rangeError !== null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="size-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Download Kanike Report as {formatLabel}</DialogTitle>
        </DialogHeader>

        <Tabs value={type} onValueChange={(value) => setType(value as "month" | "range")}>
          <TabsList>
            <TabsTrigger value="month">Month Report</TabsTrigger>
            <TabsTrigger value="range">Custom Range</TabsTrigger>
          </TabsList>
        </Tabs>

        {type === "month" ? (
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <Label>Month</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((name, index) => (
                    <SelectItem key={name} value={String(index + 1)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-28 space-y-1.5">
              <Label>Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="kanike-report-from">From</Label>
                <Input
                  id="kanike-report-from"
                  type="date"
                  value={from}
                  max={to || today}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="kanike-report-to">To</Label>
                <Input
                  id="kanike-report-to"
                  type="date"
                  value={to}
                  min={from}
                  max={today}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
            </div>
            {rangeError ? <p className="text-xs text-destructive">{rangeError}</p> : null}
          </div>
        )}

        <DialogFooter>
          <Button onClick={handleDownload} disabled={downloadDisabled}>
            <Download className="size-4" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
