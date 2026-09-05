"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Pencil, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KanikeEditDialog } from "@/components/kanike-edit-dialog";
import { KanikeReceiptDocument } from "@/components/kanike-receipt-document";
import { formatCurrency } from "@/lib/format";
import { formatReceiptDate, formatReceiptTime } from "@/lib/date";
import type { KanikeRowDTO, SevaDTO, TempleHeaderDTO } from "@/lib/dto";

export function KanikeTable({
  rows,
  kanikeTypes,
  templeSettings,
  date,
}: {
  rows: KanikeRowDTO[];
  kanikeTypes: SevaDTO[];
  templeSettings: TempleHeaderDTO;
  date: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [printJob, setPrintJob] = React.useState<KanikeRowDTO | null>(null);
  const [editingRow, setEditingRow] = React.useState<KanikeRowDTO | null>(null);

  React.useEffect(() => {
    if (!printJob) return;
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
  }, [printJob]);

  React.useEffect(() => {
    function handleAfterPrint() {
      setPrintJob(null);
    }
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  return (
    <>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No kanike sold for this date.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>GBN</TableHead>
                <TableHead>Bill No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Bhakta Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Remark</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const createdAt = new Date(row.createdAt);
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">#{row.receiptNo}</TableCell>
                    <TableCell className="font-medium">#{row.dbn}</TableCell>
                    <TableCell>{formatReceiptDate(createdAt)}</TableCell>
                    <TableCell>{formatReceiptTime(createdAt)}</TableCell>
                    <TableCell>{row.bhaktaName}</TableCell>
                    <TableCell>{row.bhaktaPhone || "—"}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {row.bhaktaAddress || "—"}
                    </TableCell>
                    <TableCell>{row.sevaName}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {row.remark || "—"}
                    </TableCell>
                    <TableCell>{row.isOnlinePay ? "Online" : "Cash"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(row.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Reprint kanike entry ${row.receiptNo}`}
                        onClick={() => setPrintJob(row)}
                      >
                        <Printer className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit kanike entry ${row.receiptNo}`}
                        onClick={() => setEditingRow(row)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <KanikeEditDialog
        row={editingRow}
        kanikeTypes={kanikeTypes}
        onOpenChange={(open) => !open && setEditingRow(null)}
        onSaved={(newBusinessDate) => {
          if (newBusinessDate !== date) {
            router.push(`${pathname}?date=${newBusinessDate}`);
          } else {
            router.refresh();
          }
        }}
      />

      {printJob ? (
        <div className="hidden print:block">
          <KanikeReceiptDocument row={printJob} templeSettings={templeSettings} />
        </div>
      ) : null}
    </>
  );
}
