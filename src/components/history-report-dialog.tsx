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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MONTH_NAMES } from "@/lib/date";

const YEAR_OPTIONS_COUNT = 6;

export function HistoryReportDialog({
  today,
  endpoint,
  triggerLabel,
  dialogTitle,
  description,
}: {
  today: string;
  endpoint: string;
  triggerLabel: string;
  dialogTitle: string;
  description: string;
}) {
  const currentYear = Number(today.slice(0, 4));
  const currentMonth = Number(today.slice(5, 7));

  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<"month" | "full">("month");
  const [year, setYear] = React.useState(String(currentYear));
  const [month, setMonth] = React.useState(String(currentMonth));

  const years = Array.from({ length: YEAR_OPTIONS_COUNT }, (_, i) => String(currentYear - i));

  function handleDownload() {
    const params = new URLSearchParams({ type });
    if (type === "month") {
      params.set("year", year);
      params.set("month", month);
    }
    window.open(`${endpoint}?${params.toString()}`, "_blank");
    setOpen(false);
  }

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
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <Tabs value={type} onValueChange={(value) => setType(value as "month" | "full")}>
          <TabsList>
            <TabsTrigger value="month">Month Report</TabsTrigger>
            <TabsTrigger value="full">Full Report</TabsTrigger>
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
          <p className="text-sm text-muted-foreground">{description}</p>
        )}

        <DialogFooter>
          <Button onClick={handleDownload}>
            <Download className="size-4" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
