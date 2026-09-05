// One-off migration: convert an existing regular (custom-amount) Seva into a
// Kanike type, and retroactively flag every past receipt item sold under it
// as isKanike so it shows up in the Kanike page's history and can be edited
// there.
//
// Usage:
//   node scripts/migrate-seva-to-kanike.mjs "ದೇಣಿಗೆ"        # dry run (default)
//   node scripts/migrate-seva-to-kanike.mjs "ದೇಣಿಗೆ" --apply # actually writes
//
// Reads MONGODB_URI from .env.local, same as the app itself.

import { config } from "dotenv";
import mongoose from "mongoose";

config({ path: ".env.local" });

const sevaName = process.argv[2] ?? "ದೇಣಿಗೆ";
const apply = process.argv.includes("--apply");

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set (expected in .env.local)");
  process.exit(1);
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const sevas = mongoose.connection.collection("sevas");
  const receipts = mongoose.connection.collection("receipts");

  const seva = await sevas.findOne({ name: sevaName });

  if (!seva) {
    console.error(`No seva found named "${sevaName}". Existing seva names:`);
    const all = await sevas.find({}, { projection: { name: 1 } }).toArray();
    for (const s of all) console.error(`  - ${s.name}`);
    process.exit(1);
  }

  console.log(`Found seva "${seva.name}" (id ${seva._id}), current category: ${seva.category ?? "seva"}`);

  const matchingReceipts = await receipts
    .find({ "items.sevaId": seva._id })
    .toArray();

  let itemCount = 0;
  for (const receipt of matchingReceipts) {
    for (const item of receipt.items) {
      if (String(item.sevaId) === String(seva._id) && !item.isKanike) itemCount++;
    }
  }

  console.log(
    `${matchingReceipts.length} receipt(s) reference this seva, ${itemCount} item(s) not yet flagged isKanike.`,
  );

  if (!apply) {
    console.log("\nDry run only — no changes written. Re-run with --apply to actually migrate.");
    await mongoose.disconnect();
    return;
  }

  const sevaResult = await sevas.updateOne(
    { _id: seva._id },
    { $set: { category: "kanike", price: null } },
  );
  console.log(`Seva updated: ${sevaResult.modifiedCount === 1 ? "yes" : "already up to date"}`);

  const itemsResult = await receipts.updateMany(
    { "items.sevaId": seva._id },
    { $set: { "items.$[item].isKanike": true } },
    { arrayFilters: [{ "item.sevaId": seva._id }] },
  );
  console.log(`Receipts modified: ${itemsResult.modifiedCount} (matched ${itemsResult.matchedCount})`);

  console.log("\nDone.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
