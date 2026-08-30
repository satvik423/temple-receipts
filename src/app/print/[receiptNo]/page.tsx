import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { ReceiptModel } from "@/models/Receipt";
import { toReceiptDTO } from "@/lib/dto";
import { getOrCreateSettings } from "@/lib/settings";
import { ReceiptPrintView } from "@/components/receipt-print-view";

export const dynamic = "force-dynamic";

export default async function PrintReceiptPage({
  params,
}: {
  params: Promise<{ receiptNo: string }>;
}) {
  const { receiptNo } = await params;
  const receiptNoNum = Number(receiptNo);

  if (!Number.isInteger(receiptNoNum)) {
    notFound();
  }

  await connectToDatabase();
  const [receipt, settings] = await Promise.all([
    ReceiptModel.findOne({ receiptNo: receiptNoNum }),
    getOrCreateSettings(),
  ]);

  if (!receipt) {
    notFound();
  }

  return (
    <ReceiptPrintView
      receipt={toReceiptDTO(receipt)}
      templeSettings={{ name: settings.name, place: settings.place, phone: settings.phone }}
    />
  );
}
