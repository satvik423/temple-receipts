import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { SevaModel } from "@/models/Seva";
import { toSevaDTO } from "@/lib/dto";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const update: {
    name?: string;
    nameEn?: string | null;
    price?: number | null;
    active?: boolean;
    category?: "seva" | "kanike";
  } = {};

  if (body?.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    update.name = name;
  }

  if (body?.nameEn !== undefined) {
    const rawNameEn = typeof body.nameEn === "string" ? body.nameEn.trim() : "";
    update.nameEn = rawNameEn.length > 0 ? rawNameEn : null;
  }

  if (body?.category !== undefined) {
    update.category = body.category === "kanike" ? "kanike" : "seva";
  }

  if (body?.isCustom !== undefined) {
    const isCustom = update.category === "kanike" ? true : body.isCustom === true;
    if (isCustom) {
      update.price = null;
    } else {
      const price = Number(body?.price);
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json({ error: "Price must be a non-negative number" }, { status: 400 });
      }
      update.price = price;
    }
  } else if (update.category === "kanike") {
    update.price = null;
  }

  if (body?.active !== undefined) {
    update.active = body.active === true;
  }

  await connectToDatabase();
  const seva = await SevaModel.findByIdAndUpdate(id, update, { returnDocument: "after" });

  if (!seva) {
    return NextResponse.json({ error: "Seva not found" }, { status: 404 });
  }

  return NextResponse.json(toSevaDTO(seva));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  await connectToDatabase();
  const seva = await SevaModel.findByIdAndDelete(id);

  if (!seva) {
    return NextResponse.json({ error: "Seva not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
