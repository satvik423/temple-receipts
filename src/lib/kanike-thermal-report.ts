import type { Receipt } from "@/models/Receipt";
import { displaySevaName } from "@/lib/dto";

export type KanikeThermalItem = { name: string; qty: number; total: number };
export type KanikeThermalReport = {
  periodLabel: string;
  items: KanikeThermalItem[];
  grandTotal: number;
};

export function buildKanikeThermalReport(
  receipts: Receipt[],
  sevaOrder: Map<string, number>,
  periodLabel: string,
): KanikeThermalReport {
  const byId = new Map<string, KanikeThermalItem>();
  let grandTotal = 0;

  for (const receipt of receipts) {
    for (const item of receipt.items) {
      const id = item.sevaId.toString();
      const existing = byId.get(id);
      if (existing) {
        existing.qty += item.quantity;
        existing.total += item.amount;
      } else {
        byId.set(id, { name: displaySevaName(item), qty: item.quantity, total: item.amount });
      }
      grandTotal += item.amount;
    }
  }

  const items = Array.from(byId.entries())
    .sort(([idA], [idB]) => {
      const orderA = sevaOrder.get(idA) ?? Number.MAX_SAFE_INTEGER;
      const orderB = sevaOrder.get(idB) ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    })
    .map(([, item]) => item);

  return { periodLabel, items, grandTotal };
}
