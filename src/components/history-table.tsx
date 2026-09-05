"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReceiptDocument } from "@/components/receipt-document";
import { formatCurrency } from "@/lib/format";
import { formatReceiptDate, formatReceiptTime } from "@/lib/date";
import { printReceiptToUsb } from "@/lib/thermal-printer";
import type { ReceiptDTO, TempleHeaderDTO } from "@/lib/dto";
import { displaySevaName } from "@/lib/dto";

export function HistoryTable({
  receipts,
  totalAmount,
  templeSettings,
}: {
  receipts: ReceiptDTO[];
  totalAmount: number;
  templeSettings: TempleHeaderDTO;
}) {
  const [reprintingId, setReprintingId] = React.useState<string | null>(null);
  const [browserPrintReceipt, setBrowserPrintReceipt] = React.useState<ReceiptDTO | null>(null);

  React.useEffect(() => {
    if (!browserPrintReceipt) return;
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
  }, [browserPrintReceipt]);

  React.useEffect(() => {
    function handleAfterPrint() {
      setBrowserPrintReceipt(null);
    }
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  async function handleReprint(receipt: ReceiptDTO) {
    setReprintingId(receipt.id);
    try {
      await printReceiptToUsb(receipt, templeSettings, true);
    } catch (err) {
      console.warn("USB print failed, falling back to browser print:", err);
      setBrowserPrintReceipt(receipt);
    } finally {
      setReprintingId(null);
    }
  }

  return (
    <>
      <CardTitle className="mb-3 text-base">
        {receipts.length} {receipts.length === 1 ? "Receipt" : "Receipts"} · {formatCurrency(totalAmount)}
      </CardTitle>

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
                        disabled={reprintingId === receipt.id}
                        aria-label={`Reprint bill ${receipt.receiptNo}`}
                        onClick={() => handleReprint(receipt)}
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

      {browserPrintReceipt
        ? createPortal(
            <div className="hidden print:block">
              <ReceiptDocument receipt={browserPrintReceipt} templeSettings={templeSettings} isCopy />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
