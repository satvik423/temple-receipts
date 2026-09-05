import { connectToDatabase } from "@/lib/mongodb";
import { ReceiptModel } from "@/models/Receipt";
import { toReceiptDTO } from "@/lib/dto";
import { getOrCreateSettings } from "@/lib/settings";
import { HistoryTable } from "@/components/history-table";

export async function HistoryData({ date }: { date: string }) {
  await connectToDatabase();

  const query = { businessDate: date };

  const [receipts, totalAmountResult, settings] = await Promise.all([
    ReceiptModel.find(query).sort({ receiptNo: -1 }),
    ReceiptModel.aggregate([{ $match: query }, { $group: { _id: null, total: { $sum: "$total" } } }]),
    getOrCreateSettings(),
  ]);

  return (
    <HistoryTable
      receipts={receipts.map(toReceiptDTO)}
      totalAmount={totalAmountResult[0]?.total ?? 0}
      templeSettings={{
        name: settings.name,
        place: settings.place,
        phone: settings.phone,
        upiId: settings.upiId ?? undefined,
      }}
    />
  );
}
