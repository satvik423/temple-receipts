import mongoose, { Schema, type InferSchemaType } from "mongoose";

const CashRegisterSchema = new Schema(
  {
    businessDate: { type: String, required: true, unique: true },
    openingBalance: { type: Number, required: true, min: 0 },
    openedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

export type CashRegister = InferSchemaType<typeof CashRegisterSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const CashRegisterModel =
  (mongoose.models.CashRegister as mongoose.Model<CashRegister>) ??
  mongoose.model<CashRegister>("CashRegister", CashRegisterSchema);
