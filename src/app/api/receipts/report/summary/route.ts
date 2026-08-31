import type { Content } from "pdfmake/interfaces";

import { connectToDatabase } from "@/lib/mongodb";
import { ReceiptModel } from "@/models/Receipt";
import { getOrCreateSettings } from "@/lib/settings";
import { formatBusinessDate } from "@/lib/date";
import {
  buildReportDocDefinition,
  buildReportHeader,
  formatReportAmount,
  groupReceiptsByDate,
  renderReportPdf,
  reportPdfResponse,
  reportTableLayout,
  resolveReportPeriod,
} from "@/lib/pdf-report";

type SevaTotal = { name: string; qty: number; amount: number };

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

  const groupsByDate = groupReceiptsByDate(receipts);

  const tableBody: Content[][] = [
    [
      { text: "NAME", bold: true },
      { text: "QTY", bold: true, alignment: "right" },
      { text: "AMOUNT", bold: true, alignment: "right" },
    ],
  ];

  let grandTotal = 0;

  for (const [businessDate, group] of groupsByDate) {
    const gbns = group.map((r) => r.receiptNo);
    const startGbn = Math.min(...gbns);
    const endGbn = Math.max(...gbns);
    const dayTotal = group.reduce((sum, r) => sum + r.total, 0);
    grandTotal += dayTotal;

    const sevaTotals = new Map<string, SevaTotal>();
    for (const receipt of group) {
      for (const item of receipt.items) {
        const key = item.sevaId.toString();
        const existing = sevaTotals.get(key);
        if (existing) {
          existing.qty += item.quantity;
          existing.amount += item.amount;
        } else {
          sevaTotals.set(key, { name: item.sevaName, qty: item.quantity, amount: item.amount });
        }
      }
    }

    const sortedSevas = [...sevaTotals.values()].sort((a, b) => a.name.localeCompare(b.name));

    tableBody.push([
      {
        text: `${formatBusinessDate(businessDate)}   R.No ${startGbn} - ${endGbn}`,
        bold: true,
        fillColor: "#f0f0f0",
      },
      { text: "", fillColor: "#f0f0f0" },
      { text: "", fillColor: "#f0f0f0" },
    ]);

    for (const seva of sortedSevas) {
      tableBody.push([
        seva.name,
        { text: String(seva.qty), alignment: "right" },
        { text: formatReportAmount(seva.amount), alignment: "right" },
      ]);
    }

    tableBody.push([
      { text: "Total", bold: true },
      "",
      { text: formatReportAmount(dayTotal), bold: true, alignment: "right" },
    ]);
  }

  tableBody.push([
    { text: "GRAND TOTAL", bold: true, fontSize: 11 },
    "",
    { text: formatReportAmount(grandTotal), bold: true, fontSize: 11, alignment: "right" },
  ]);

  const docDefinition = buildReportDocDefinition([
    ...buildReportHeader(settings, period.title),
    {
      table: {
        headerRows: 1,
        widths: ["*", 50, 80],
        body: tableBody,
      },
      layout: reportTableLayout,
    },
  ]);

  const buffer = await renderReportPdf(docDefinition);
  return reportPdfResponse(buffer, `seva-report-${period.filenameSuffix}.pdf`);
}
