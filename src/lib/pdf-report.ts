import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

import { MONTH_NAMES } from "@/lib/date";
import type { Receipt } from "@/models/Receipt";

const FONTS_DIR = path.join(process.cwd(), "src/lib/fonts");
const FONT_REGULAR_BASE64 = fs
  .readFileSync(path.join(FONTS_DIR, "NotoSansKannada-Regular.ttf"))
  .toString("base64");
const FONT_BOLD_BASE64 = fs
  .readFileSync(path.join(FONTS_DIR, "NotoSansKannada-Bold.ttf"))
  .toString("base64");

export function formatReportAmount(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export type ReportPeriod = {
  query: Record<string, unknown>;
  title: string;
  filenameSuffix: string;
};

export function resolveReportPeriod(
  searchParams: URLSearchParams,
): ReportPeriod | { error: string } {
  const type = searchParams.get("type") === "full" ? "full" : "month";

  const now = new Date();
  const year = Number(searchParams.get("year")) || now.getUTCFullYear();
  const month = Number(searchParams.get("month")) || now.getUTCMonth() + 1;

  if (!Number.isInteger(year) || month < 1 || month > 12) {
    return { error: "Invalid year or month" };
  }

  if (type === "full") {
    return { query: {}, title: "Full Report", filenameSuffix: "full" };
  }

  const mm = String(month).padStart(2, "0");
  const from = `${year}-${mm}-01`;
  const to = `${year}-${mm}-${String(daysInMonth(year, month)).padStart(2, "0")}`;

  return {
    query: { businessDate: { $gte: from, $lte: to } },
    title: `${MONTH_NAMES[month - 1]} month - ${year}`,
    filenameSuffix: `${year}-${mm}`,
  };
}

export function groupReceiptsByDate(receipts: Receipt[]): Map<string, Receipt[]> {
  const groups = new Map<string, Receipt[]>();
  for (const receipt of receipts) {
    const list = groups.get(receipt.businessDate) ?? [];
    list.push(receipt);
    groups.set(receipt.businessDate, list);
  }
  return groups;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type ReportColumn = {
  label: string;
  align?: "left" | "right" | "center";
  width?: string;
};

export function buildReportDocument(options: {
  templeSettings: { name: string; place: string; phone: string };
  title: string;
  columns: ReportColumn[];
  rowsHtml: string;
}): string {
  const { templeSettings, title, columns, rowsHtml } = options;

  const headCells = columns
    .map(
      (column) =>
        `<th style="${column.width ? `width:${column.width};` : ""}text-align:${column.align ?? "left"};">${escapeHtml(column.label)}</th>`,
    )
    .join("");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @font-face {
    font-family: 'ReportFont';
    src: url(data:font/ttf;base64,${FONT_REGULAR_BASE64}) format('truetype');
    font-weight: normal;
  }
  @font-face {
    font-family: 'ReportFont';
    src: url(data:font/ttf;base64,${FONT_BOLD_BASE64}) format('truetype');
    font-weight: bold;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    font-family: 'ReportFont', sans-serif;
    font-size: 10px;
    margin: 0;
    padding: 0;
    color: #000;
  }
  .header {
    text-align: center;
    font-weight: bold;
  }
  .header p {
    margin: 2px 0;
  }
  .divider {
    border-top: 1px solid #000;
    margin: 6px 0;
  }
  .title {
    text-align: center;
    font-weight: bold;
    margin: 8px 0;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th,
  td {
    border: 0.5px solid #999;
    padding: 4px 6px;
    font-size: 10px;
  }
  th {
    font-weight: bold;
  }
  tr.group-header td {
    background: #f0f0f0;
    font-weight: bold;
  }
  tr.total td {
    font-weight: bold;
  }
  tr.grand-total td {
    font-weight: bold;
    font-size: 11px;
  }
  td.amount,
  th.amount {
    text-align: right;
  }
  td.qty,
  th.qty {
    text-align: center;
  }
</style>
</head>
<body>
  <div class="header">
    <p>${escapeHtml(templeSettings.name)},</p>
    <p>${escapeHtml(templeSettings.place)}</p>
    <p>Mob: ${escapeHtml(templeSettings.phone)}</p>
  </div>
  <div class="divider"></div>
  <div class="title">${escapeHtml(title)}</div>
  <div class="divider"></div>
  <table>
    <thead><tr>${headCells}</tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</body>
</html>`;
}

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      margin: { top: "40px", bottom: "50px", left: "40px", right: "40px" },
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate:
        '<div style="width:100%;text-align:center;font-size:9px;font-family:sans-serif;"><span class="pageNumber"></span> of <span class="totalPages"></span></div>',
      printBackground: true,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export function reportPdfResponse(buffer: Buffer, filename: string): Response {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
