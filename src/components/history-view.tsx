"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Printer, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { formatReceiptDate, formatReceiptTime } from "@/lib/date";
import type { ReceiptDTO, SevaDTO } from "@/lib/dto";

type Filters = {
  from: string;
  to: string;
  sevaId: string;
};

export function HistoryView({
  receipts,
  sevas,
  totalCount,
  totalAmount,
  page,
  pageSize,
  filters,
}: {
  receipts: ReceiptDTO[];
  sevas: SevaDTO[];
  totalCount: number;
  totalAmount: number;
  page: number;
  pageSize: number;
  filters: Filters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  function updateParams(next: Partial<Filters & { page: string }>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    if (!("page" in next)) {
      params.delete("page");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilters = filters.from || filters.to || filters.sevaId;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Sales History</h1>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="space-y-1.5">
            <Label htmlFor="from-date">From</Label>
            <Input
              id="from-date"
              type="date"
              value={filters.from}
              onChange={(e) => updateParams({ from: e.target.value })}
              className="w-[150px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="to-date">To</Label>
            <Input
              id="to-date"
              type="date"
              value={filters.to}
              onChange={(e) => updateParams({ to: e.target.value })}
              className="w-[150px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Seva</Label>
            <Select
              value={filters.sevaId || "all"}
              onValueChange={(value) => updateParams({ sevaId: value === "all" ? "" : value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Sevas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sevas</SelectItem>
                {sevas.map((seva) => (
                  <SelectItem key={seva.id} value={seva.id}>
                    {seva.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {hasFilters ? (
            <Button
              variant="ghost"
              onClick={() => router.push(pathname)}
              className="text-muted-foreground"
            >
              <X className="size-4" />
              Clear
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {totalCount} {totalCount === 1 ? "Receipt" : "Receipts"} · {formatCurrency(totalAmount)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {receipts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No receipts match these filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((receipt) => {
                    const createdAt = new Date(receipt.createdAt);
                    return (
                      <TableRow key={receipt.id}>
                        <TableCell className="font-medium">#{receipt.receiptNo}</TableCell>
                        <TableCell>{formatReceiptDate(createdAt)}</TableCell>
                        <TableCell>{formatReceiptTime(createdAt)}</TableCell>
                        <TableCell className="max-w-[240px] truncate text-muted-foreground">
                          {receipt.items.map((item) => item.sevaName).join(", ")}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(receipt.total)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" asChild>
                            <Link
                              href={`/print/${receipt.receiptNo}`}
                              target="_blank"
                              rel="noopener"
                              aria-label={`Reprint receipt ${receipt.receiptNo}`}
                            >
                              <Printer className="size-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page <= 1}
                  onClick={() => updateParams({ page: String(page - 1) })}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page >= totalPages}
                  onClick={() => updateParams({ page: String(page + 1) })}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
