import fs from "fs";
import path from "path";
import chromium from "@sparticuz/chromium-min";
import puppeteerCore from "puppeteer-core";
import puppeteer from "puppeteer";

// Pinned to the exact release that matches puppeteer-core's bundled Chrome version
// (149.0.7827.22) — @sparticuz/chromium-min doesn't follow semver, so these two
// packages, and this URL, must all be bumped together or the browser will fail to launch.
const CHROMIUM_PACK_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar";

export { resolveReportPeriod, groupReceiptsByDate } from "@/lib/report-period";
export type { ReportPeriod } from "@/lib/report-period";

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
  td.center,
  th.center {
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

async function launchBrowser() {
  // Vercel's serverless functions don't have a system Chromium install (or the shared
  // libraries full `puppeteer` expects), so use the Lambda-compatible build there. Locally
  // (and on any other Node host), the full `puppeteer` package's bundled Chromium works fine.
  if (process.env.VERCEL) {
    chromium.setGraphicsMode = false; // skip extracting the WebGL stack — not needed for a plain document
    return puppeteerCore.launch({
      args: await puppeteerCore.defaultArgs({ args: chromium.args, headless: "shell" }),
      executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
      headless: "shell",
    });
  }
  return puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
}

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const browser = await launchBrowser();
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
