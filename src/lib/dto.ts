import type { Seva } from "@/models/Seva";
import type { Receipt } from "@/models/Receipt";

export type SevaDTO = {
  id: string;
  name: string;
  nameEn: string | null;
  price: number | null;
  active: boolean;
  order: number;
  createdAt: string;
};

export function toSevaDTO(seva: Seva): SevaDTO {
  return {
    id: seva._id.toString(),
    name: seva.name,
    nameEn: seva.nameEn ?? null,
    price: seva.price ?? null,
    active: seva.active ?? true,
    order: seva.order ?? 0,
    createdAt: seva.createdAt.toISOString(),
  };
}

export type ReceiptItemDTO = {
  sevaId: string;
  sevaName: string;
  sevaNameEn?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  isCustom: boolean;
  bhaktaName?: string;
  bhaktaPhone?: string;
};

export function displaySevaName(item: {
  sevaName: string;
  sevaNameEn?: string | null;
}): string {
  const en = item.sevaNameEn?.trim();
  return en && en.length > 0 ? en : item.sevaName;
}

export type ReceiptDTO = {
  id: string;
  receiptNo: number;
  dbn: number;
  businessDate: string;
  items: ReceiptItemDTO[];
  total: number;
  createdAt: string;
};

export function toReceiptDTO(receipt: Receipt): ReceiptDTO {
  return {
    id: receipt._id.toString(),
    receiptNo: receipt.receiptNo,
    dbn: receipt.dbn,
    businessDate: receipt.businessDate,
    items: receipt.items.map((item) => ({
      sevaId: item.sevaId.toString(),
      sevaName: item.sevaName,
      sevaNameEn: item.sevaNameEn ?? undefined,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
      isCustom: item.isCustom,
      bhaktaName: item.bhaktaName ?? undefined,
      bhaktaPhone: item.bhaktaPhone ?? undefined,
    })),
    total: receipt.total,
    createdAt: receipt.createdAt.toISOString(),
  };
}
