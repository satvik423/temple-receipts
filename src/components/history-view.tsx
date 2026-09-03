"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HistoryReportDialog } from "@/components/history-report-dialog";
import { ReceiptDocument } from "@/components/receipt-document";
import { formatCurrency } from "@/lib/format";
import { formatReceiptDate, formatReceiptTime, shiftBusinessDate } from "@/lib/date";
import type { ReceiptDTO } from "@/lib/dto";
import { displaySevaName } from "@/lib/dto";

export function HistoryView({
  receipts,
  totalAmount,
  date,
  today,
  templeSettings,
}: {
  receipts: ReceiptDTO[];
  totalAmount: number;
  date: string;
  today: string;
  templeSettings: { name: string; place: string; phone: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [printReceipt, setPrintReceipt] = React.useState<ReceiptDTO | null>(null);

  React.useEffect(() => {
    if (!printReceipt) return;
    const timer = setTimeout(() => window.print(), 150);
    return () => clearTimeout(timer);
  }, [printReceipt]);

  React.useEffect(() => {
    function handleAfterPrint() {
      setPrintReceipt(null);
    }
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  function setDate(nextDate: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextDate && nextDate !== today) {
      params.set("date", nextDate);
    } else {
      params.delete("date");
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="text-lg font-semibold">Sales History</h1>
        <div className="flex items-center gap-2">
          <HistoryReportDialog
            today={today}
            format="pdf"
            triggerLabel="PDF"
          />
          <HistoryReportDialog
            today={today}
            format="xlsx"
            triggerLabel="Excel"
          />
        </div>
      </div>

      <Card className="print:hidden">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">
            {receipts.length} {receipts.length === 1 ? "Receipt" : "Receipts"} ·{" "}
            {formatCurrency(totalAmount)}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous day"
              onClick={() => setDate(shiftBusinessDate(date, -1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Input
              type="date"
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="w-[160px]"
            />
            <Button
              variant="outline"
              size="icon"
              aria-label="Next day"
              disabled={date >= today}
              onClick={() => setDate(shiftBusinessDate(date, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
            {date !== today ? (
              <Button
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => setDate(today)}
              >
                Today
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {receipts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales recorded for this date.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>GBN</TableHead>
                    <TableHead>DBN</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((receipt) => {
                    const createdAt = new Date(receipt.createdAt);
                    return (
                      <TableRow key={receipt.id}>
                        <TableCell className="font-medium">#{receipt.receiptNo}</TableCell>
                        <TableCell className="font-medium">#{receipt.dbn}</TableCell>
                        <TableCell>{formatReceiptDate(createdAt)}</TableCell>
                        <TableCell>{formatReceiptTime(createdAt)}</TableCell>
                        <TableCell className="max-w-[240px] truncate text-muted-foreground">
                          {receipt.items.map((item) => displaySevaName(item)).join(", ")}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(receipt.total)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Reprint bill ${receipt.receiptNo}`}
                            onClick={() => setPrintReceipt(receipt)}
                          >
                            <Printer className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {printReceipt ? (
        <div className="hidden print:block">
          <ReceiptDocument receipt={printReceipt} templeSettings={templeSettings} isCopy />
        </div>
      ) : null}
    </div>
  );
}
