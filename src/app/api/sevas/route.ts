import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SevaModel } from "@/models/Seva";
import { toSevaDTO } from "@/lib/dto";

export async function GET() {
  await connectToDatabase();
  const sevas = await SevaModel.find().sort({ createdAt: 1 });
  return NextResponse.json(sevas.map(toSevaDTO));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const isCustom = body?.isCustom === true;
  const price = isCustom ? null : Number(body?.price);

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!isCustom && (!Number.isFinite(price) || price! < 0)) {
    return NextResponse.json({ error: "Price must be a non-negative number" }, { status: 400 });
  }

  await connectToDatabase();
  const seva = await SevaModel.create({ name, price, active: true });
  return NextResponse.json(toSevaDTO(seva), { status: 201 });
}
