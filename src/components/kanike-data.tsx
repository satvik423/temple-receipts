import { connectToDatabase } from "@/lib/mongodb";
import { ReceiptModel } from "@/models/Receipt";
import { SevaModel } from "@/models/Seva";
import { toKanikeRowDTO, toSevaDTO, type KanikeRowDTO } from "@/lib/dto";
import { getOrCreateSettings } from "@/lib/settings";
import { KanikeTable } from "@/components/kanike-table";

export async function KanikeData({ date }: { date: string }) {
  await connectToDatabase();

  const [receipts, kanikeTypes, settings] = await Promise.all([
    ReceiptModel.find({ businessDate: date, "items.isKanike": true }).sort({ receiptNo: -1 }),
    SevaModel.find({ active: true, category: "kanike" }).sort({ order: 1, createdAt: 1 }),
    getOrCreateSettings(),
  ]);

  const rows = receipts
    .map(toKanikeRowDTO)
    .filter((row): row is KanikeRowDTO => row !== null);

  return (
    <KanikeTable
      rows={rows}
      kanikeTypes={kanikeTypes.map(toSevaDTO)}
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
