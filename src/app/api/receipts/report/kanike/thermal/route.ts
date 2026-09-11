import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ReceiptModel } from "@/models/Receipt";
import { SevaModel } from "@/models/Seva";
import { resolveReportPeriod } from "@/lib/report-period";
import { buildKanikeThermalReport } from "@/lib/kanike-thermal-report";

export async function GET(request: Request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const period = resolveReportPeriod(searchParams);
  if ("error" in period) {
    return Response.json({ error: period.error }, { status: 400 });
  }

  await connectToDatabase();

  const [receipts, sevas] = await Promise.all([
    ReceiptModel.find({
      ...period.query,
    }).sort({ businessDate: 1, receiptNo: 1 }),
    SevaModel.find().sort({ order: 1, createdAt: 1 }),
  ]);

  const sevaOrder = new Map(sevas.map((seva, index) => [seva._id.toString(), index]));

  const report = buildKanikeThermalReport(receipts, sevaOrder);
  return Response.json(report);
}
