import bcrypt from "bcryptjs";

import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/models/User";

let bootstrapPromise: Promise<void> | null = null;

export function ensureBootstrapAdmin(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = runBootstrap().catch((err) => {
    // Don't cache a failure — allow retry on the next request.
    bootstrapPromise = null;
    console.error("[bootstrap] ensureBootstrapAdmin failed:", err);
  });
  return bootstrapPromise;
}

async function runBootstrap(): Promise<void> {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  await connectToDatabase();
  const userCount = await UserModel.countDocuments();
  if (userCount > 0) return;

  if (!email || !password) {
    console.warn(
      "[bootstrap] No users in the database and BOOTSTRAP_ADMIN_EMAIL/BOOTSTRAP_ADMIN_PASSWORD are not set. Visit /login to run first-time setup.",
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    await UserModel.create({ email, passwordHash, role: "admin", active: true });
  } catch (err) {
    // Another process/instance seeded first, or the email collides — that's fine.
    if (err && typeof err === "object" && "code" in err && (err as { code?: number }).code === 11000) {
      return;
    }
    throw err;
  }
  console.info(`[bootstrap] Seeded initial admin user: ${email}`);
}
