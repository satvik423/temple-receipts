import ExcelJS from "exceljs";

import { displaySevaName, formatBhaktaDetail, toKanikeRowDTO, type KanikeRowDTO } from "@/lib/dto";
import { formatBusinessDate } from "@/lib/date";
import { groupReceiptsByDate } from "@/lib/report-period";
import type { Receipt } from "@/models/Receipt";

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FF999999" } },
  left: { style: "thin", color: { argb: "FF999999" } },
  bottom: { style: "thin", color: { argb: "FF999999" } },
  right: { style: "thin", color: { argb: "FF999999" } },
};

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF0F0F0" },
};

type TempleSettings = { name: string; place: string; phone: string };

type ColumnDef = {
  label: string;
  width: number;
  align?: "left" | "right" | "center";
  numberFormat?: string;
};

const BILL_COLUMNS: ColumnDef[] = [
  { label: "GBN", width: 10, align: "center" },
  { label: "DBN", width: 10, align: "center" },
  { label: "NAME", width: 36, align: "left" },
  { label: "QTY", width: 8, align: "center" },
  { label: "AMOUNT", width: 16, align: "right", numberFormat: "#,##0.00" },
];

const SUMMARY_COLUMNS: ColumnDef[] = [
  { label: "NAME", width: 36, align: "left" },
  { label: "QTY", width: 10, align: "center" },
  { label: "AMOUNT", width: 18, align: "right", numberFormat: "#,##0.00" },
];

const KANIKE_COLUMNS: ColumnDef[] = [
  { label: "GBN", width: 10, align: "center" },
  { label: "DBN", width: 10, align: "center" },
  { label: "KANIKE NAME", width: 20, align: "left" },
  { label: "BHAKTHA DETAIL", width: 44, align: "left" },
  { label: "PAYMENT", width: 12, align: "center" },
  { label: "AMOUNT", width: 16, align: "right", numberFormat: "#,##0.00" },
];

function applyHeader(
  worksheet: ExcelJS.Worksheet,
  templeSettings: TempleSettings,
  title: string,
  columns: ColumnDef[],
): void {
  const totalCols = columns.length;
  const lastCol = totalCols;

  worksheet.mergeCells(1, 1, 1, lastCol);
  const nameCell = worksheet.getCell(1, 1);
  nameCell.value = templeSettings.name;
  nameCell.font = { bold: true, size: 14 };
  nameCell.alignment = { horizontal: "center" };

  worksheet.mergeCells(2, 1, 2, lastCol);
  const placeCell = worksheet.getCell(2, 1);
  placeCell.value = templeSettings.place;
  placeCell.alignment = { horizontal: "center" };

  worksheet.mergeCells(3, 1, 3, lastCol);
  const phoneCell = worksheet.getCell(3, 1);
  phoneCell.value = `Mob: ${templeSettings.phone}`;
  phoneCell.alignment = { horizontal: "center" };

  // Row 4 is left blank as a divider (no merge, no value).

  worksheet.mergeCells(5, 1, 5, lastCol);
  const titleCell = worksheet.getCell(5, 1);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 12 };
  titleCell.alignment = { horizontal: "center" };

  // Row 6 is left blank as a divider.

  const headerRow = worksheet.getRow(7);
  columns.forEach((column, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = column.label;
    cell.font = { bold: true };
    cell.alignment = { horizontal: column.align ?? "left", vertical: "middle" };
    cell.fill = HEADER_FILL;
    cell.border = THIN_BORDER;
  });
  headerRow.commit();

  worksheet.views = [{ state: "frozen", ySplit: 7 }];

  worksheet.getColumn(1).width = columns[0].width;
  for (let i = 1; i < columns.length; i += 1) {
    worksheet.getColumn(i + 1).width = columns[i].width;
  }
}

function writeDateGroupHeader(
  worksheet: ExcelJS.Worksheet,
  rowIndex: number,
  totalCols: number,
  label: string,
): void {
  worksheet.mergeCells(rowIndex, 1, rowIndex, totalCols);
  const cell = worksheet.getCell(rowIndex, 1);
  cell.value = label;
  cell.font = { bold: true };
  cell.alignment = { horizontal: "left", vertical: "middle" };
  cell.fill = HEADER_FILL;
}

function styleDataCell(
  cell: ExcelJS.Cell,
  column: ColumnDef,
): void {
  cell.border = THIN_BORDER;
  if (column.numberFormat) {
    cell.numFmt = column.numberFormat;
  }
  if (column.align === "right") {
    cell.alignment = { horizontal: "right", vertical: "middle" };
  } else if (column.align === "center") {
    cell.alignment = { horizontal: "center", vertical: "middle" };
  } else {
    cell.alignment = { horizontal: "left", vertical: "middle" };
  }
}

function styleTotalRow(
  worksheet: ExcelJS.Worksheet,
  rowIndex: number,
  totalCols: number,
  amountValue: number,
  amountColIndex: number,
): void {
  const row = worksheet.getRow(rowIndex);
  for (let col = 1; col <= totalCols; col += 1) {
    const cell = row.getCell(col);
    cell.font = { bold: true };
    cell.border = THIN_BORDER;
    if (col === amountColIndex) {
      cell.value = amountValue;
      cell.numFmt = "#,##0.00";
      cell.alignment = { horizontal: "right", vertical: "middle" };
    } else {
      cell.alignment = { horizontal: col === totalCols ? "right" : "left", vertical: "middle" };
    }
  }
  row.commit();
}

function buildBillWorkbook(
  receipts: Receipt[],
  templeSettings: TempleSettings,
  title: string,
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = templeSettings.name;
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Bill Report");
  applyHeader(worksheet, templeSettings, title, BILL_COLUMNS);

  const totalCols = BILL_COLUMNS.length;
  const amountCol = 5; // AMOUNT
  let rowIndex = 8;
  let grandTotal = 0;

  const groups = groupReceiptsByDate(receipts);
  for (const [businessDate, group] of groups) {
    const gbns = group.map((r) => r.receiptNo);
    const startGbn = Math.min(...gbns);
    const endGbn = Math.max(...gbns);
    const dayTotal = group.reduce((sum, r) => sum + r.total, 0);
    grandTotal += dayTotal;

    writeDateGroupHeader(
      worksheet,
      rowIndex,
      totalCols,
      `${formatBusinessDate(businessDate)}   R.No ${startGbn} - ${endGbn}`,
    );
    rowIndex += 1;

    for (const receipt of group) {
      for (const item of receipt.items) {
        const row = worksheet.getRow(rowIndex);
        const values: Array<string | number> = [
          receipt.receiptNo,
          receipt.dbn,
          displaySevaName(item),
          item.quantity,
          item.amount,
        ];
        values.forEach((value, index) => {
          const cell = row.getCell(index + 1);
          cell.value = value;
          styleDataCell(cell, BILL_COLUMNS[index]);
        });
        row.commit();
        rowIndex += 1;
      }
    }

    styleTotalRow(worksheet, rowIndex, totalCols, dayTotal, amountCol);
    // Put the word "TOTAL" in the NAME column (index 2) of the total row.
    const totalLabelCell = worksheet.getRow(rowIndex).getCell(3);
    totalLabelCell.value = "TOTAL";
    totalLabelCell.alignment = { horizontal: "right", vertical: "middle" };
    rowIndex += 1;
  }

  // Grand total row.
  const grandRow = worksheet.getRow(rowIndex);
  for (let col = 1; col <= totalCols; col += 1) {
    const cell = grandRow.getCell(col);
    cell.font = { bold: true, size: 12 };
    cell.border = THIN_BORDER;
    if (col === 3) {
      cell.value = "GRAND TOTAL";
      cell.alignment = { horizontal: "right", vertical: "middle" };
    } else if (col === amountCol) {
      cell.value = grandTotal;
      cell.numFmt = "#,##0.00";
      cell.alignment = { horizontal: "right", vertical: "middle" };
    } else {
      cell.alignment = { horizontal: "left", vertical: "middle" };
    }
  }
  grandRow.commit();

  return workbook;
}

type SevaTotal = { sevaName: string; sevaNameEn: string | null; qty: number; amount: number };

function buildSummaryWorkbook(
  receipts: Receipt[],
  templeSettings: TempleSettings,
  title: string,
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = templeSettings.name;
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Summary Report");
  applyHeader(worksheet, templeSettings, title, SUMMARY_COLUMNS);

  const totalCols = SUMMARY_COLUMNS.length;
  const amountCol = 3; // AMOUNT
  let rowIndex = 8;
  let grandTotal = 0;

  const groups = groupReceiptsByDate(receipts);
  for (const [businessDate, group] of groups) {
    const gbns = group.map((r) => r.receiptNo);
    const startGbn = Math.min(...gbns);
    const endGbn = Math.max(...gbns);
    const dayTotal = group.reduce((sum, r) => sum + r.total, 0);
    grandTotal += dayTotal;

    const sevaTotals = new Map<string, SevaTotal>();
    for (const receipt of group) {
      for (const item of receipt.items) {
        const enKey = (item.sevaNameEn ?? "").trim();
        const key = `${item.sevaId.toString()}::${enKey}`;
        const existing = sevaTotals.get(key);
        if (existing) {
          existing.qty += item.quantity;
          existing.amount += item.amount;
        } else {
          sevaTotals.set(key, {
            sevaName: item.sevaName,
            sevaNameEn: enKey.length > 0 ? enKey : null,
            qty: item.quantity,
            amount: item.amount,
          });
        }
      }
    }

    const sortedSevas = [...sevaTotals.values()].sort((a, b) =>
      displaySevaName(a).localeCompare(displaySevaName(b)),
    );

    writeDateGroupHeader(
      worksheet,
      rowIndex,
      totalCols,
      `${formatBusinessDate(businessDate)}   R.No ${startGbn} - ${endGbn}`,
    );
    rowIndex += 1;

    for (const seva of sortedSevas) {
      const row = worksheet.getRow(rowIndex);
      const values: Array<string | number> = [displaySevaName(seva), seva.qty, seva.amount];
      values.forEach((value, index) => {
        const cell = row.getCell(index + 1);
        cell.value = value;
        styleDataCell(cell, SUMMARY_COLUMNS[index]);
      });
      row.commit();
      rowIndex += 1;
    }

    styleTotalRow(worksheet, rowIndex, totalCols, dayTotal, amountCol);
    const totalLabelCell = worksheet.getRow(rowIndex).getCell(1);
    totalLabelCell.value = "Total";
    totalLabelCell.alignment = { horizontal: "right", vertical: "middle" };
    rowIndex += 1;
  }

  // Grand total row.
  const grandRow = worksheet.getRow(rowIndex);
  for (let col = 1; col <= totalCols; col += 1) {
    const cell = grandRow.getCell(col);
    cell.font = { bold: true, size: 12 };
    cell.border = THIN_BORDER;
    if (col === 1) {
      cell.value = "GRAND TOTAL";
      cell.alignment = { horizontal: "right", vertical: "middle" };
    } else if (col === amountCol) {
      cell.value = grandTotal;
      cell.numFmt = "#,##0.00";
      cell.alignment = { horizontal: "right", vertical: "middle" };
    } else {
      cell.alignment = { horizontal: "left", vertical: "middle" };
    }
  }
  grandRow.commit();

  return workbook;
}

function buildKanikeWorkbook(
  receipts: Receipt[],
  templeSettings: TempleSettings,
  title: string,
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = templeSettings.name;
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Kanike Report");
  applyHeader(worksheet, templeSettings, title, KANIKE_COLUMNS);

  const totalCols = KANIKE_COLUMNS.length;
  const amountCol = 6; // AMOUNT
  let rowIndex = 8;
  let grandTotal = 0;

  const groups = groupReceiptsByDate(receipts);
  for (const [businessDate, group] of groups) {
    const rows = group.map(toKanikeRowDTO).filter((row): row is KanikeRowDTO => row !== null);
    if (rows.length === 0) continue;

    const gbns = rows.map((r) => r.receiptNo);
    const startGbn = Math.min(...gbns);
    const endGbn = Math.max(...gbns);
    const dayTotal = rows.reduce((sum, r) => sum + r.amount, 0);
    grandTotal += dayTotal;

    writeDateGroupHeader(
      worksheet,
      rowIndex,
      totalCols,
      `${formatBusinessDate(businessDate)}   R.No ${startGbn} - ${endGbn}`,
    );
    rowIndex += 1;

    for (const row of rows) {
      const excelRow = worksheet.getRow(rowIndex);
      const values: Array<string | number> = [
        row.receiptNo,
        row.dbn,
        row.sevaName,
        formatBhaktaDetail(row),
        row.isOnlinePay ? "Online" : "Cash",
        row.amount,
      ];
      values.forEach((value, index) => {
        const cell = excelRow.getCell(index + 1);
        cell.value = value;
        styleDataCell(cell, KANIKE_COLUMNS[index]);
      });
      excelRow.commit();
      rowIndex += 1;
    }

    styleTotalRow(worksheet, rowIndex, totalCols, dayTotal, amountCol);
    // Put the word "TOTAL" in the KANIKE NAME column (index 3) of the total row.
    const totalLabelCell = worksheet.getRow(rowIndex).getCell(3);
    totalLabelCell.value = "TOTAL";
    totalLabelCell.alignment = { horizontal: "right", vertical: "middle" };
    rowIndex += 1;
  }

  // Grand total row.
  const grandRow = worksheet.getRow(rowIndex);
  for (let col = 1; col <= totalCols; col += 1) {
    const cell = grandRow.getCell(col);
    cell.font = { bold: true, size: 12 };
    cell.border = THIN_BORDER;
    if (col === 3) {
      cell.value = "GRAND TOTAL";
      cell.alignment = { horizontal: "right", vertical: "middle" };
    } else if (col === amountCol) {
      cell.value = grandTotal;
      cell.numFmt = "#,##0.00";
      cell.alignment = { horizontal: "right", vertical: "middle" };
    } else {
      cell.alignment = { horizontal: "left", vertical: "middle" };
    }
  }
  grandRow.commit();

  return workbook;
}

export async function excelDownloadResponse(
  workbook: ExcelJS.Workbook,
  filename: string,
): Promise<Response> {
  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(new Uint8Array(buffer as ArrayBuffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export const excelReport = {
  bill: buildBillWorkbook,
  summary: buildSummaryWorkbook,
  kanike: buildKanikeWorkbook,
};
