import { connectToDatabase } from "@/lib/mongodb";
import { ReceiptModel } from "@/models/Receipt";
import { toKanikeRowDTO, type KanikeRowDTO, type SevaDTO } from "@/lib/dto";
import { getOrCreateSettings } from "@/lib/settings";
import { KanikeTable } from "@/components/kanike-table";

export async function KanikeData({ date, kanikeTypes }: { date: string; kanikeTypes: SevaDTO[] }) {
  await connectToDatabase();

  const [receipts, settings] = await Promise.all([
    ReceiptModel.find({ businessDate: date, "items.isKanike": true }).sort({ receiptNo: -1 }),
    getOrCreateSettings(),
  ]);

  const rows = receipts
    .map(toKanikeRowDTO)
    .filter((row): row is KanikeRowDTO => row !== null);

  return (
    <KanikeTable
      rows={rows}
      kanikeTypes={kanikeTypes}
      date={date}
      templeSettings={{
        name: settings.name,
        place: settings.place,
        phone: settings.phone,
        upiId: settings.upiId ?? undefined,
      }}
    />
  );
}
