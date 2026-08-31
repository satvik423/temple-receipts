import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SevaModel } from "@/models/Seva";

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const ids = Array.isArray(body?.ids) ? body.ids : null;

  if (
    !ids ||
    ids.some((id: unknown) => typeof id !== "string" || !mongoose.isValidObjectId(id))
  ) {
    return NextResponse.json({ error: "ids must be a list of seva ids" }, { status: 400 });
  }

  await connectToDatabase();
  await SevaModel.bulkWrite(
    ids.map((id: string, index: number) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(id) },
        update: { $set: { order: index } },
      },
    })),
  );

  return NextResponse.json({ ok: true });
}
