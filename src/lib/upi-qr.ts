import qrcode from "qrcode-generator";

export function buildUpiUri(params: {
  upiId: string;
  payeeName: string;
  amount: number;
  note?: string;
}): string {
  const query: Record<string, string> = {
    pa: params.upiId,
    pn: params.payeeName,
    am: params.amount.toFixed(2),
    cu: "INR",
  };
  if (params.note) query.tn = params.note;

  const search = Object.entries(query)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
  return `upi://pay?${search}`;
}

export function generateQrDataUrl(text: string, cellSize = 4, margin = 2): string {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  return qr.createDataURL(cellSize, margin);
}
