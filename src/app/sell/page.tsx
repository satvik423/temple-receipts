import { connectToDatabase } from "@/lib/mongodb";
import { SevaModel } from "@/models/Seva";
import { toSevaDTO } from "@/lib/dto";
import { getOrCreateSettings } from "@/lib/settings";
import { SellCart } from "@/components/sell-cart";

export const dynamic = "force-dynamic";

export default async function SellPage() {
  await connectToDatabase();
  const [sevas, settings] = await Promise.all([
    SevaModel.find({ active: true, category: { $ne: "kanike" } }).sort({ order: 1, createdAt: 1 }),
    getOrCreateSettings(),
  ]);

  return (
    <SellCart
      sevas={sevas.map(toSevaDTO)}
      templeSettings={{ name: settings.name, place: settings.place, phone: settings.phone }}
    />
  );
}
