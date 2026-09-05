import type { Seva } from "@/models/Seva";
import type { Receipt } from "@/models/Receipt";
import type { User, UserRole } from "@/models/User";

export type TempleHeaderDTO = {
  name: string;
  place: string;
  phone: string;
  upiId?: string;
};

export type SevaDTO = {
  id: string;
  name: string;
  nameEn: string | null;
  price: number | null;
  active: boolean;
  order: number;
  category: "seva" | "kanike";
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
    category: seva.category ?? "seva",
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
  bhaktaAddress?: string;
  isKanike: boolean;
  remark?: string;
  isOnlinePay: boolean;
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
      bhaktaAddress: item.bhaktaAddress ?? undefined,
      isKanike: item.isKanike ?? false,
      remark: item.remark ?? undefined,
      isOnlinePay: item.isOnlinePay ?? false,
    })),
    total: receipt.total,
    createdAt: receipt.createdAt.toISOString(),
  };
}

export type KanikeRowDTO = {
  id: string;
  receiptNo: number;
  dbn: number;
  businessDate: string;
  createdAt: string;
  sevaId: string;
  sevaName: string;
  amount: number;
  bhaktaName?: string;
  bhaktaPhone?: string;
  bhaktaAddress?: string;
  remark?: string;
  isOnlinePay: boolean;
};

export function toKanikeRowDTO(receipt: Receipt): KanikeRowDTO | null {
  const item = receipt.items.find((entry) => entry.isKanike);
  if (!item) return null;

  return {
    id: receipt._id.toString(),
    receiptNo: receipt.receiptNo,
    dbn: receipt.dbn,
    businessDate: receipt.businessDate,
    createdAt: receipt.createdAt.toISOString(),
    sevaId: item.sevaId.toString(),
    sevaName: displaySevaName(item),
    amount: item.amount,
    bhaktaName: item.bhaktaName ?? undefined,
    bhaktaPhone: item.bhaktaPhone ?? undefined,
    bhaktaAddress: item.bhaktaAddress ?? undefined,
    remark: item.remark ?? undefined,
    isOnlinePay: item.isOnlinePay ?? false,
  };
}

export type UserDTO = {
  id: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
};

export function toUserDTO(user: User): UserDTO {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt.toISOString(),
  };
}
