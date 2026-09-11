import type { Receipt } from "@/models/Receipt";
import { displaySevaName } from "@/lib/dto";

export type KanikeThermalItem = { name: string; qty: number; total: number };
export type KanikeThermalReport = {
  items: KanikeThermalItem[];
  grandTotal: number;
};

export function buildKanikeThermalReport(receipts: Receipt[]): KanikeThermalReport {
  const byName = new Map<string, KanikeThermalItem>();
  let grandTotal = 0;

  for (const receipt of receipts) {
    for (const item of receipt.items) {
      const name = displaySevaName(item);
      const existing = byName.get(name);
      if (existing) {
        existing.qty += item.quantity;
        existing.total += item.amount;
      } else {
        byName.set(name, { name, qty: item.quantity, total: item.amount });
      }
      grandTotal += item.amount;
    }
  }

  return { items: Array.from(byName.values()), grandTotal };
}
