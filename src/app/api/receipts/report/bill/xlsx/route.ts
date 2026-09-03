import { connectToDatabase } from "@/lib/mongodb";
import { ReceiptModel } from "@/models/Receipt";
import { getOrCreateSettings } from "@/lib/settings";
import { resolveReportPeriod } from "@/lib/report-period";
import { excelReport, excelDownloadResponse } from "@/lib/excel-report";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = resolveReportPeriod(searchParams);
  if ("error" in period) {
    return new Response(period.error, { status: 400 });
  }

  await connectToDatabase();

  const [receipts, settings] = await Promise.all([
    ReceiptModel.find(period.query).sort({ businessDate: 1, receiptNo: 1 }),
    getOrCreateSettings(),
  ]);

  const workbook = excelReport.bill(receipts, {
    name: settings.name,
    place: settings.place,
    phone: settings.phone,
  }, period.title);

  return excelDownloadResponse(workbook, `bill-report-${period.filenameSuffix}.xlsx`);
}
