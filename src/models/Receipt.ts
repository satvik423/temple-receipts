import mongoose, { Schema, type InferSchemaType } from "mongoose";

const ReceiptItemSchema = new Schema(
  {
    sevaId: { type: Schema.Types.ObjectId, ref: "Seva", required: true },
    sevaName: { type: String, required: true },
    sevaNameEn: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    isCustom: { type: Boolean, required: true, default: false },
    bhaktaName: { type: String },
    bhaktaPhone: { type: String },
    isKanike: { type: Boolean, default: false },
    remark: { type: String },
    isOnlinePay: { type: Boolean, default: false },
  },
  { _id: false },
);

const ReceiptSchema = new Schema(
  {
    receiptNo: { type: Number, required: true, unique: true },
    dbn: { type: Number, required: true },
    businessDate: { type: String, required: true, index: true },
    items: { type: [ReceiptItemSchema], required: true },
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

export type Receipt = InferSchemaType<typeof ReceiptSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ReceiptModel =
  (mongoose.models.Receipt as mongoose.Model<Receipt>) ??
  mongoose.model<Receipt>("Receipt", ReceiptSchema);
