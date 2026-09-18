"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  isAdmin,
}: {
  receipts: ReceiptDTO[];
  totalAmount: number;
  templeSettings: TempleHeaderDTO;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [reprintingId, setReprintingId] = React.useState<string | null>(null);
  const [browserPrintReceipt, setBrowserPrintReceipt] = React.useState<ReceiptDTO | null>(null);
  const [deletingReceipt, setDeletingReceipt] = React.useState<ReceiptDTO | null>(null);
  const [deleting, setDeleting] = React.useState(false);

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

  async function handleDelete() {
    if (!deletingReceipt) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/receipts/${deletingReceipt.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Could not delete receipt");
        return;
      }
      toast.success("Receipt deleted");
      setDeletingReceipt(null);
      router.refresh();
    } finally {
      setDeleting(false);
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
                      {isAdmin ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete receipt ${receipt.receiptNo}`}
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setDeletingReceipt(receipt)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : null}
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

      <AlertDialog
        open={deletingReceipt !== null}
        onOpenChange={(open) => !open && setDeletingReceipt(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete receipt #{deletingReceipt?.receiptNo}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes it from history, reports, and calculations. It isn&apos;t permanently
              erased, but it can&apos;t be undone from this screen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
