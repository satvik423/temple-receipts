// One-off migration: fix a naming mistake — rename the Kanike seva
// "ದೇಣಿಗೆ" to the correct term "ಕಾಣಿಕೆ", and retroactively fix the
// denormalized sevaName copy stored on every past receipt item sold under it.
//
// Usage:
//   node scripts/rename-kanike-seva.mjs           # dry run (default)
//   node scripts/rename-kanike-seva.mjs --apply   # actually writes
//
// Reads MONGODB_URI from .env.local, same as the app itself.

import { config } from "dotenv";
import mongoose from "mongoose";

config({ path: ".env.local" });

const OLD_NAME = "ದೇಣಿಗೆ";
const NEW_NAME = "ಕಾಣಿಕೆ";
const apply = process.argv.includes("--apply");

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set (expected in .env.local)");
  process.exit(1);
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const sevas = mongoose.connection.collection("sevas");
  const receipts = mongoose.connection.collection("receipts");

  const matchingSevas = await sevas.find({ name: OLD_NAME }).toArray();

  if (matchingSevas.length === 0) {
    console.error(`No seva found named "${OLD_NAME}". Nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  for (const seva of matchingSevas) {
    console.log(`Found seva "${seva.name}" (id ${seva._id}), category: ${seva.category ?? "seva"}`);
  }

  const matchingReceipts = await receipts.find({ "items.sevaName": OLD_NAME }).toArray();

  let itemCount = 0;
  for (const receipt of matchingReceipts) {
    for (const item of receipt.items) {
      if (item.sevaName === OLD_NAME) itemCount++;
    }
  }

  console.log(
    `${matchingReceipts.length} receipt(s) reference "${OLD_NAME}", ${itemCount} item(s) will be renamed to "${NEW_NAME}".`,
  );

  if (!apply) {
    console.log("\nDry run only — no changes written. Re-run with --apply to actually migrate.");
    await mongoose.disconnect();
    return;
  }

  const sevaResult = await sevas.updateMany({ name: OLD_NAME }, { $set: { name: NEW_NAME } });
  console.log(`Seva(s) renamed: ${sevaResult.modifiedCount}`);

  const itemsResult = await receipts.updateMany(
    { "items.sevaName": OLD_NAME },
    { $set: { "items.$[item].sevaName": NEW_NAME } },
    { arrayFilters: [{ "item.sevaName": OLD_NAME }] },
  );
  console.log(`Receipts modified: ${itemsResult.modifiedCount} (matched ${itemsResult.matchedCount})`);

  console.log("\nDone.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
