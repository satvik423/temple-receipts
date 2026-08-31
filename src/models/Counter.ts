import mongoose, { Schema, type InferSchemaType } from "mongoose";

const CounterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export type Counter = InferSchemaType<typeof CounterSchema>;

export const CounterModel =
  (mongoose.models.Counter as mongoose.Model<Counter>) ??
  mongoose.model<Counter>("Counter", CounterSchema);

export async function getNextSequence(name: string): Promise<number> {
  const result = await CounterModel.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true },
  );
  return result.seq;
}

export async function getSequenceValue(name: string): Promise<number> {
  const doc = await CounterModel.findById(name);
  return doc?.seq ?? 0;
}

export async function setSequenceValue(name: string, value: number): Promise<number> {
  const result = await CounterModel.findByIdAndUpdate(
    name,
    { $set: { seq: value } },
    { returnDocument: "after", upsert: true },
  );
  return result.seq;
}
