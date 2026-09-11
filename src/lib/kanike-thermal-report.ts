import type { Receipt } from "@/models/Receipt";
import { toKanikeRowDTO, type KanikeRowDTO } from "@/lib/dto";
import { groupReceiptsByDate } from "@/lib/report-period";

export type KanikeThermalItem = { name: string; price: number; total: number };
export type KanikeThermalGroup = {
  businessDate: string;
  items: KanikeThermalItem[];
  dayTotal: number;
};
export type KanikeThermalReport = {
  groups: KanikeThermalGroup[];
  grandTotal: number;
};

export function buildKanikeThermalReport(receipts: Receipt[]): KanikeThermalReport {
  const groupsByDate = groupReceiptsByDate(receipts);
  const groups: KanikeThermalGroup[] = [];
  let grandTotal = 0;

  for (const [businessDate, receiptsForDate] of groupsByDate) {
    const rows = receiptsForDate
      .map(toKanikeRowDTO)
      .filter((row): row is KanikeRowDTO => row !== null);
    if (rows.length === 0) continue;

    const byName = new Map<string, KanikeThermalItem>();
    for (const row of rows) {
      const existing = byName.get(row.sevaName);
      if (existing) {
        existing.total += row.amount;
      } else {
        byName.set(row.sevaName, { name: row.sevaName, price: row.unitPrice, total: row.amount });
      }
    }

    const items = Array.from(byName.values());
    const dayTotal = items.reduce((sum, item) => sum + item.total, 0);
    grandTotal += dayTotal;
    groups.push({ businessDate, items, dayTotal });
  }

  return { groups, grandTotal };
}
