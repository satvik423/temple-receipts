import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { SettingsModel, SETTINGS_DOC_ID } from "@/models/Settings";

export async function PATCH(request: Request) {
  await requireAdmin();
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const place = typeof body?.place === "string" ? body.place.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const upiId = typeof body?.upiId === "string" ? body.upiId.trim() : "";

  if (!name || !place || !phone) {
    return NextResponse.json(
      { error: "Temple name, place, and phone are all required" },
      { status: 400 },
    );
  }

  await connectToDatabase();
  const settings = await SettingsModel.findByIdAndUpdate(
    SETTINGS_DOC_ID,
    { name, place, phone, upiId },
    { returnDocument: "after", upsert: true },
  );

  return NextResponse.json({
    name: settings.name,
    place: settings.place,
    phone: settings.phone,
    upiId: settings.upiId,
  });
}
