import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { ReceiptModel } from "@/models/Receipt";
import { SevaModel } from "@/models/Seva";
import { toReceiptDTO, toSevaDTO } from "@/lib/dto";
import { HistoryView } from "@/components/history-view";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; sevaId?: string; page?: string }>;
}) {
  const params = await searchParams;
  await connectToDatabase();

  const query: Record<string, unknown> = {};

  if (params.from || params.to) {
    const businessDate: Record<string, string> = {};
    if (params.from) businessDate.$gte = params.from;
    if (params.to) businessDate.$lte = params.to;
    query.businessDate = businessDate;
  }

  if (params.sevaId && mongoose.isValidObjectId(params.sevaId)) {
    query["items.sevaId"] = new mongoose.Types.ObjectId(params.sevaId);
  }

  const page = Math.max(1, Number(params.page) || 1);

  const [receipts, totalCount, totalAmountResult, sevas] = await Promise.all([
    ReceiptModel.find(query)
      .sort({ receiptNo: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE),
    ReceiptModel.countDocuments(query),
    ReceiptModel.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    SevaModel.find().sort({ name: 1 }),
  ]);

  return (
    <HistoryView
      receipts={receipts.map(toReceiptDTO)}
      sevas={sevas.map(toSevaDTO)}
      totalCount={totalCount}
      totalAmount={totalAmountResult[0]?.total ?? 0}
      page={page}
      pageSize={PAGE_SIZE}
      filters={{
        from: params.from ?? "",
        to: params.to ?? "",
        sevaId: params.sevaId ?? "",
      }}
    />
  );
}
