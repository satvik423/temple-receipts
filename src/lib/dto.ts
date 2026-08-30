import type { Seva } from "@/models/Seva";
import type { Receipt } from "@/models/Receipt";

export type SevaDTO = {
  id: string;
  name: string;
  price: number | null;
  active: boolean;
  createdAt: string;
};

export function toSevaDTO(seva: Seva): SevaDTO {
  return {
    id: seva._id.toString(),
    name: seva.name,
    price: seva.price ?? null,
    active: seva.active ?? true,
    createdAt: seva.createdAt.toISOString(),
  };
}

export type ReceiptItemDTO = {
  sevaId: string;
  sevaName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  isCustom: boolean;
  bhaktaName?: string;
  bhaktaPhone?: string;
};

export type ReceiptDTO = {
  id: string;
  receiptNo: number;
  businessDate: string;
  items: ReceiptItemDTO[];
  total: number;
  createdAt: string;
};

export function toReceiptDTO(receipt: Receipt): ReceiptDTO {
  return {
    id: receipt._id.toString(),
    receiptNo: receipt.receiptNo,
    businessDate: receipt.businessDate,
    items: receipt.items.map((item) => ({
      sevaId: item.sevaId.toString(),
      sevaName: item.sevaName,
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
