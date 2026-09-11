"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Printer } from "lucide-react";

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
import type { TempleHeaderDTO } from "@/lib/dto";
import type { KanikeThermalReport } from "@/lib/kanike-thermal-report";
import { KanikeThermalReportDocument } from "@/components/kanike-thermal-report-document";
import { PrinterNotConnectedError, printKanikeReportToUsb } from "@/lib/thermal-printer";

const YEAR_OPTIONS_COUNT = 6;
const ENDPOINT = "/api/receipts/report/kanike/thermal";
const DEFAULT_RANGE_DAYS = 30;

export function KanikeThermalReportDialog({
  today,
  templeSettings,
}: {
  today: string;
  templeSettings: TempleHeaderDTO;
}) {
  const currentYear = Number(today.slice(0, 4));
  const currentMonth = Number(today.slice(5, 7));

  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<"month" | "range">("month");
  const [year, setYear] = React.useState(String(currentYear));
  const [month, setMonth] = React.useState(String(currentMonth));
  const [from, setFrom] = React.useState(shiftBusinessDate(today, -(DEFAULT_RANGE_DAYS - 1)));
  const [to, setTo] = React.useState(today);
  const [printing, setPrinting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [browserPrintJob, setBrowserPrintJob] = React.useState<{
    report: KanikeThermalReport;
    generatedAt: Date;
  } | null>(null);

  const years = Array.from({ length: YEAR_OPTIONS_COUNT }, (_, i) => String(currentYear - i));

  const rangeError =
    from === "" || to === ""
      ? "Pick both dates"
      : from > to
        ? "'From' must be on or before 'To'"
        : null;

  React.useEffect(() => {
    if (!browserPrintJob) return;
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        await Promise.all([
          document.fonts.load('400 16px "Noto Sans Kannada"'),
          document.fonts.load('700 16px "Noto Sans Kannada"'),
        ]);
      } catch {
        // Print with whatever font is available rather than blocking forever.
      }
      if (!cancelled) window.print();
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [browserPrintJob]);

  React.useEffect(() => {
    function handleAfterPrint() {
      setBrowserPrintJob(null);
    }
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  async function handlePrint() {
    if (type === "range" && rangeError !== null) return;
    setError(null);
    setPrinting(true);
    try {
      const params = new URLSearchParams({ type });
      if (type === "month") {
        params.set("year", year);
        params.set("month", month);
      } else {
        params.set("from", from);
        params.set("to", to);
      }

      const res = await fetch(`${ENDPOINT}?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load Kanike report");
      }
      const report = (await res.json()) as KanikeThermalReport;
      const generatedAt = new Date();

      try {
        await printKanikeReportToUsb(report, templeSettings, generatedAt);
      } catch (err) {
        if (!(err instanceof PrinterNotConnectedError)) {
          console.warn("USB print failed, falling back to browser print:", err);
        }
        setBrowserPrintJob({ report, generatedAt });
      }

      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to print Kanike report");
    } finally {
      setPrinting(false);
    }
  }

  const printDisabled = printing || (type === "range" && rangeError !== null);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Printer className="size-4" />
            Kanike Report
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print Kanike Report</DialogTitle>
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
                  <Label htmlFor="kanike-thermal-from">From</Label>
                  <Input
                    id="kanike-thermal-from"
                    type="date"
                    value={from}
                    max={to || today}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="kanike-thermal-to">To</Label>
                  <Input
                    id="kanike-thermal-to"
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

          {error ? <p className="text-xs text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button onClick={handlePrint} disabled={printDisabled}>
              <Printer className="size-4" />
              {printing ? "Printing…" : "Print"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {browserPrintJob
        ? createPortal(
            <div className="hidden print:block">
              <KanikeThermalReportDocument
                report={browserPrintJob.report}
                templeSettings={templeSettings}
                generatedAt={browserPrintJob.generatedAt}
              />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
