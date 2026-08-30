import { connectToDatabase } from "@/lib/mongodb";
import { SevaModel } from "@/models/Seva";
import { toSevaDTO } from "@/lib/dto";
import { SellCart } from "@/components/sell-cart";

export const dynamic = "force-dynamic";

export default async function SellPage() {
  await connectToDatabase();
  const sevas = await SevaModel.find({ active: true }).sort({ name: 1 });

  return <SellCart sevas={sevas.map(toSevaDTO)} />;
}
