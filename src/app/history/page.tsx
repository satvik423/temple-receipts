import { connectToDatabase } from "@/lib/mongodb";
import { ReceiptModel } from "@/models/Receipt";
import { toReceiptDTO } from "@/lib/dto";
import { getBusinessDate } from "@/lib/date";
import { getOrCreateSettings } from "@/lib/settings";
import { HistoryView } from "@/components/history-view";

export const dynamic = "force-dynamic";

const BUSINESS_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const today = getBusinessDate();
  const date = params.date && BUSINESS_DATE_PATTERN.test(params.date) ? params.date : today;

  await connectToDatabase();

  const query = { businessDate: date };

  const [receipts, totalAmountResult, settings] = await Promise.all([
    ReceiptModel.find(query).sort({ receiptNo: -1 }),
    ReceiptModel.aggregate([{ $match: query }, { $group: { _id: null, total: { $sum: "$total" } } }]),
    getOrCreateSettings(),
  ]);

  return (
    <HistoryView
      receipts={receipts.map(toReceiptDTO)}
      totalAmount={totalAmountResult[0]?.total ?? 0}
      date={date}
      today={today}
      templeSettings={{
        name: settings.name,
        place: settings.place,
        phone: settings.phone,
        upiId: settings.upiId ?? undefined,
      }}
    />
  );
}
