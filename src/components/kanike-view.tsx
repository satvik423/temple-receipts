"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Pencil, Printer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { KanikeEditDialog } from "@/components/kanike-edit-dialog";
import { KanikeReceiptDocument } from "@/components/kanike-receipt-document";
import { formatCurrency } from "@/lib/format";
import { formatReceiptDate, formatReceiptTime, shiftBusinessDate } from "@/lib/date";
import { displaySevaName, type KanikeRowDTO, type SevaDTO } from "@/lib/dto";

const LAST_TYPE_STORAGE_KEY = "kanike:lastTypeId";

export function KanikeView({
  kanikeTypes,
  rows,
  date,
  today,
  templeSettings,
}: {
  kanikeTypes: SevaDTO[];
  rows: KanikeRowDTO[];
  date: string;
  today: string;
  templeSettings: { name: string; place: string; phone: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [bhaktaName, setBhaktaName] = React.useState("");
  const [bhaktaPhone, setBhaktaPhone] = React.useState("");
  const [remark, setRemark] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [onlinePay, setOnlinePay] = React.useState(false);
  const [selectedTypeId, setSelectedTypeId] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [printJob, setPrintJob] = React.useState<KanikeRowDTO | null>(null);
  const [editingRow, setEditingRow] = React.useState<KanikeRowDTO | null>(null);

  React.useEffect(() => {
    Promise.resolve().then(() => {
      let lastTypeId: string | null = null;
      try {
        lastTypeId = localStorage.getItem(LAST_TYPE_STORAGE_KEY);
      } catch {
        // localStorage unavailable (private browsing, etc.) — just skip restoring
      }
      if (lastTypeId && kanikeTypes.some((type) => type.id === lastTypeId)) {
        setSelectedTypeId(lastTypeId);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectType(typeId: string) {
    setSelectedTypeId(typeId);
    try {
      localStorage.setItem(LAST_TYPE_STORAGE_KEY, typeId);
    } catch {
      // localStorage unavailable — selection still works for this session
    }
  }

  React.useEffect(() => {
    if (!printJob) return;
    const timer = setTimeout(() => window.print(), 150);
    return () => clearTimeout(timer);
  }, [printJob]);

  React.useEffect(() => {
    function handleAfterPrint() {
      setPrintJob(null);
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

  const canSubmit =
    bhaktaName.trim().length > 0 && Number(amount) > 0 && selectedTypeId !== null && !submitting;

  async function handleSave() {
    if (!selectedTypeId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              sevaId: selectedTypeId,
              amount: Number(amount),
              bhaktaName: bhaktaName.trim(),
              bhaktaPhone: bhaktaPhone.trim(),
              remark: remark.trim(),
              isOnlinePay: onlinePay,
            },
          ],
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(data?.error ?? "Could not save kanike");
        return;
      }

      setBhaktaName("");
      setBhaktaPhone("");
      setRemark("");
      setAmount("");
      setOnlinePay(false);
      toast.success(`Bill #${data.receiptNo} saved`);

      const item = data.items[0];
      setPrintJob({
        id: data.id,
        receiptNo: data.receiptNo,
        dbn: data.dbn,
        businessDate: data.businessDate,
        createdAt: data.createdAt,
        sevaId: item.sevaId,
        sevaName: displaySevaName(item),
        amount: item.amount,
        bhaktaName: item.bhaktaName,
        bhaktaPhone: item.bhaktaPhone,
        remark: item.remark,
        isOnlinePay: item.isOnlinePay,
      });
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold print:hidden">Kanike</h1>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-base">New Kanike</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="kanike-name">Bhakta Name</Label>
              <Input
                id="kanike-name"
                value={bhaktaName}
                onChange={(e) => setBhaktaName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kanike-phone">
                Phone Number <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="kanike-phone"
                type="tel"
                inputMode="numeric"
                maxLength={15}
                value={bhaktaPhone}
                onChange={(e) => setBhaktaPhone(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kanike-remark">
                Remark <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input id="kanike-remark" value={remark} onChange={(e) => setRemark(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kanike-amount">Amount (₹)</Label>
              <Input
                id="kanike-amount"
                type="number"
                min={0}
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="kanike-online-pay"
              checked={onlinePay}
              onCheckedChange={(checked) => setOnlinePay(checked === true)}
            />
            <Label htmlFor="kanike-online-pay" className="font-normal">
              Online Pay
            </Label>
          </div>

          <div className="space-y-1.5">
            <Label>Type of Kanike</Label>
            {kanikeTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No kanike types yet — add one from Add Seva.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {kanikeTypes.map((type) => (
                  <Button
                    key={type.id}
                    type="button"
                    variant={selectedTypeId === type.id ? "default" : "outline"}
                    onClick={() => selectType(type.id)}
                  >
                    {type.name}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <Button disabled={!canSubmit} onClick={handleSave}>
            {submitting ? "Saving..." : "Save & Print"}
          </Button>
        </CardContent>
      </Card>

      <Card className="print:hidden">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Kanike History</CardTitle>
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
              <Button variant="ghost" className="text-muted-foreground" onClick={() => setDate(today)}>
                Today
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <KanikeEditDialog
        row={editingRow}
        kanikeTypes={kanikeTypes}
        onOpenChange={(open) => !open && setEditingRow(null)}
        onSaved={() => router.refresh()}
      />

      {printJob ? (
        <div className="hidden print:block">
          <KanikeReceiptDocument row={printJob} templeSettings={templeSettings} />
        </div>
      ) : null}
    </div>
  );
}
