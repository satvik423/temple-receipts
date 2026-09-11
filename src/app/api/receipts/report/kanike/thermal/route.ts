import { connectToDatabase } from "@/lib/mongodb";
import { ReceiptModel } from "@/models/Receipt";
import { resolveReportPeriod } from "@/lib/report-period";
import { buildKanikeThermalReport } from "@/lib/kanike-thermal-report";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = resolveReportPeriod(searchParams);
  if ("error" in period) {
    return Response.json({ error: period.error }, { status: 400 });
  }

  await connectToDatabase();

  const receipts = await ReceiptModel.find({
    ...period.query,
    "items.isKanike": true,
  }).sort({ businessDate: 1, receiptNo: 1 });

  const report = buildKanikeThermalReport(receipts);
  return Response.json(report);
}
