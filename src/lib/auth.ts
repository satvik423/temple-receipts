import { cache } from "react";
import { redirect } from "next/navigation";

import { connectToDatabase } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { UserModel, type User, type UserRole } from "@/models/User";

export type CurrentUser = {
  id: string;
  email: string;
  role: UserRole;
};

const loadCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) return null;

  await connectToDatabase();
  const user = await UserModel.findById(session.userId).lean<User | null>();
  if (!user || !user.active) return null;

  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };
});

export async function getCurrentUser(): Promise<CurrentUser | null> {
  return loadCurrentUser();
}

export async function requireUser(nextPath?: string): Promise<CurrentUser> {
  const user = await loadCurrentUser();
  if (!user) {
    const target = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";
    redirect(target);
  }
  return user;
}

export async function requireAdmin(nextPath?: string): Promise<CurrentUser> {
  const user = await requireUser(nextPath);
  if (user.role !== "admin") {
    redirect("/sell");
  }
  return user;
}
