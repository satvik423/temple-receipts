import { formatCurrency } from "@/lib/format";
import { formatReceiptDate, formatReceiptTime } from "@/lib/date";
import type { ReceiptDTO, TempleHeaderDTO } from "@/lib/dto";

export class PrinterNotConnectedError extends Error {
  constructor() {
    super("No printer connected");
    this.name = "PrinterNotConnectedError";
  }
}

const PRINTER_WIDTH_DOTS = 576; // 80mm printer @ ~203dpi
const PAD = 16;
const FONT_NORMAL = 28;
const FONT_SMALL = 22;
const FONT_TOTAL = 32;
const LINE_H = 34;
const LINE_H_SMALL = 26;
const QTY_COL_WIDTH = 60;
const AMOUNT_COL_WIDTH = 130;

export function isWebUsbSupported(): boolean {
  return typeof navigator !== "undefined" && "usb" in navigator;
}

export async function getAuthorizedPrinter(): Promise<USBDevice | null> {
  if (!isWebUsbSupported()) return null;
  const devices = await navigator.usb.getDevices();
  return devices[0] ?? null;
}

export async function requestPrinter(): Promise<USBDevice> {
  if (!isWebUsbSupported()) {
    throw new Error("This browser does not support connecting to a USB printer.");
  }
  return navigator.usb.requestDevice({ filters: [] });
}

async function openForPrinting(
  device: USBDevice,
): Promise<{ endpointNumber: number }> {
  try {
    if (!device.opened) await device.open();
  } catch (err) {
    throw new Error(`Failed to open device: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    if (!device.configuration) await device.selectConfiguration(1);
  } catch (err) {
    throw new Error(`Failed to select configuration: ${err instanceof Error ? err.message : String(err)}`);
  }

  const errors: string[] = [];

  for (const iface of device.configuration!.interfaces) {
    // Some devices have multiple alternate interfaces, need to check all
    for (const alternate of iface.alternates) {
      // Look for bulk out endpoint
      const outEndpoint = alternate.endpoints.find(
        (endpoint) => endpoint.direction === "out" && endpoint.type === "bulk"
      );

      if (outEndpoint) {
        try {
          await device.claimInterface(iface.interfaceNumber);

          // If this alternate is not the currently active one, we might need to select it
          if (alternate.alternateSetting !== iface.alternate.alternateSetting) {
            await device.selectAlternateInterface(iface.interfaceNumber, alternate.alternateSetting);
          }

          return { endpointNumber: outEndpoint.endpointNumber };
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.warn(`Could not claim interface ${iface.interfaceNumber} alt ${alternate.alternateSetting}:`, err);
          errors.push(`Iface ${iface.interfaceNumber} alt ${alternate.alternateSetting}: ${errMsg}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Could not claim any suitable interface. Errors: ${errors.join(", ")}`);
  }

  throw new Error("No bulk OUT USB endpoint found on this device's interfaces.");
}

function setFont(ctx: CanvasRenderingContext2D, size: number, bold = true) {
  ctx.font = `${bold ? "bold " : ""}${size}px "Noto Sans Kannada", "Noto Sans", sans-serif`;
  ctx.fillStyle = "#000";
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  if (ctx.measureText(text).width <= maxWidth) return [text];

  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (ctx.measureText(attempt).width <= maxWidth) {
      current = attempt;
      continue;
    }
    if (current) lines.push(current);
    if (ctx.measureText(word).width > maxWidth) {
      let chunk = "";
      for (const ch of word) {
        const test = chunk + ch;
        if (chunk && ctx.measureText(test).width > maxWidth) {
          lines.push(chunk);
          chunk = ch;
        } else {
          chunk = test;
        }
      }
      current = chunk;
    } else {
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function renderReceiptCanvas(
  receipt: ReceiptDTO,
  templeSettings: TempleHeaderDTO,
  isCopy: boolean,
): Promise<HTMLCanvasElement> {
  const width = PRINTER_WIDTH_DOTS;
  const contentWidth = width - PAD * 2;
  const nameColWidth = contentWidth - QTY_COL_WIDTH - AMOUNT_COL_WIDTH - 16;

  try {
    await Promise.all([
      document.fonts.load('400 16px "Noto Sans Kannada"'),
      document.fonts.load('700 16px "Noto Sans Kannada"'),
    ]);
  } catch (err) {
    console.warn("Could not load Noto Sans Kannada for printing:", err);
  }

  const scratch = document.createElement("canvas");
  scratch.width = width;
  scratch.height = 3000;
  const ctx = scratch.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, scratch.width, scratch.height);

  let y = 36;

  function centerText(text: string, size = FONT_NORMAL) {
    setFont(ctx, size);
    ctx.textAlign = "center";
    const lines = wrapText(ctx, text, contentWidth);
    for (const line of lines) {
      ctx.fillText(line, width / 2, y);
      y += LINE_H;
    }
  }

  function dashedLine() {
    y += 26;
  }

  function solidLine() {
    y += 20;
  }

  function twoCol(left: string, right: string, size = FONT_NORMAL) {
    setFont(ctx, size);
    const gap = 12;
    const fitsOneLine =
      ctx.measureText(left).width + ctx.measureText(right).width + gap <= contentWidth;

    ctx.textAlign = "left";
    ctx.fillText(left, PAD, y);
    if (fitsOneLine) {
      ctx.textAlign = "right";
      ctx.fillText(right, width - PAD, y);
      y += LINE_H;
      return;
    }
    y += LINE_H;
    ctx.textAlign = "right";
    ctx.fillText(right, width - PAD, y);
    y += LINE_H;
  }

  function tableRow(name: string, qty: string, amount: string, size = FONT_NORMAL) {
    setFont(ctx, size);
    const lines = wrapText(ctx, name, nameColWidth);
    lines.forEach((line, index) => {
      setFont(ctx, size);
      ctx.textAlign = "left";
      ctx.fillText(line, PAD, y);
      if (index === 0) {
        ctx.textAlign = "center";
        ctx.fillText(qty, PAD + nameColWidth + QTY_COL_WIDTH / 2, y);
        ctx.textAlign = "right";
        ctx.fillText(amount, width - PAD, y);
      }
      y += size === FONT_TOTAL ? LINE_H + 6 : LINE_H;
    });
  }

  centerText(`${templeSettings.name},`);
  centerText(templeSettings.place);
  centerText(`Mob: ${templeSettings.phone}`);

  if (isCopy) {
    y += 10;
    ctx.save();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(PAD, y - 26, contentWidth, 36);
    ctx.restore();
    setFont(ctx, FONT_NORMAL);
    ctx.textAlign = "center";
    ctx.fillText("*** COPY ***", width / 2, y);
    y += LINE_H + 6;
  }

  const createdAt = new Date(receipt.createdAt);

  dashedLine();
  twoCol(`GBN #${receipt.receiptNo}`, `DBN #${receipt.dbn}`);
  twoCol(formatReceiptDate(createdAt), formatReceiptTime(createdAt));
  dashedLine();
  tableRow("ITEM", "QTY", "Amount");
  solidLine();

  for (const item of receipt.items) {
    tableRow(item.sevaName, String(item.quantity), formatCurrency(item.amount));
  }

  const customItems = receipt.items.filter((item) => item.isCustom);
  if (customItems.length > 0) {
    y += 12;
    for (const item of customItems) {
      const text = `${item.bhaktaName} has ${item.sevaName} ${formatCurrency(item.amount)}${item.remark ? ` ${item.remark}` : ""}`;
      setFont(ctx, FONT_SMALL, false);
      const lines = wrapText(ctx, text, contentWidth);
      lines.forEach((line) => {
        setFont(ctx, FONT_SMALL, false);
        ctx.textAlign = "left";
        ctx.fillText(line, PAD, y);
        y += LINE_H_SMALL;
      });
    }
  }

  dashedLine();
  tableRow("TOTAL", "", formatCurrency(receipt.total), FONT_TOTAL);

  y += 40;

  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = width;
  finalCanvas.height = Math.ceil(y);
  const finalCtx = finalCanvas.getContext("2d")!;
  finalCtx.fillStyle = "#fff";
  finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
  finalCtx.drawImage(scratch, 0, 0);
  return finalCanvas;
}

function canvasToEscPosRaster(canvas: HTMLCanvasElement): Uint8Array {
  const { width, height } = canvas;
  const ctx = canvas.getContext("2d")!;
  const { data } = ctx.getImageData(0, 0, width, height);
  const widthBytes = Math.ceil(width / 8);
  const raster = new Uint8Array(widthBytes * height);

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const pixelIndex = (row * width + col) * 4;
      const r = data[pixelIndex];
      const g = data[pixelIndex + 1];
      const b = data[pixelIndex + 2];
      const a = data[pixelIndex + 3];
      const luminance = r * 0.299 + g * 0.587 + b * 0.114;
      if (a > 128 && luminance < 128) {
        const byteIndex = row * widthBytes + (col >> 3);
        raster[byteIndex] |= 0x80 >> (col & 7);
      }
    }
  }

  const xL = widthBytes & 0xff;
  const xH = (widthBytes >> 8) & 0xff;
  const yL = height & 0xff;
  const yH = (height >> 8) & 0xff;

  const init = new Uint8Array([0x1b, 0x40]); // ESC @ : initialize printer
  const rasterHeader = new Uint8Array([0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH]); // GS v 0
  const feedAndCut = new Uint8Array([0x0a, 0x0a, 0x0a, 0x1d, 0x56, 0x01]); // feed + partial cut

  const out = new Uint8Array(init.length + rasterHeader.length + raster.length + feedAndCut.length);
  let offset = 0;
  out.set(init, offset);
  offset += init.length;
  out.set(rasterHeader, offset);
  offset += rasterHeader.length;
  out.set(raster, offset);
  offset += raster.length;
  out.set(feedAndCut, offset);
  return out;
}

async function sendToPrinter(device: USBDevice, data: Uint8Array): Promise<void> {
  const { endpointNumber } = await openForPrinting(device);
  const CHUNK_SIZE = 4096;
  for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
    const chunk = data.slice(offset, offset + CHUNK_SIZE);
    const result = await device.transferOut(endpointNumber, chunk);
    if (result.status !== "ok") {
      throw new Error(`USB transfer failed: ${result.status}`);
    }
  }
}

export async function printReceiptToUsb(
  receipt: ReceiptDTO,
  templeSettings: TempleHeaderDTO,
  isCopy = false,
): Promise<void> {
  const device = await getAuthorizedPrinter();
  if (!device) {
    throw new PrinterNotConnectedError();
  }

  const canvas = await renderReceiptCanvas(receipt, templeSettings, isCopy);
  const data = canvasToEscPosRaster(canvas);
  await sendToPrinter(device, data);
}
