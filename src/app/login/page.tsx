import { Suspense } from "react";

import { LoginForm } from "@/components/login-form";
import { connectToDatabase } from "@/lib/mongodb";
import { getOrCreateSettings } from "@/lib/settings";
import { UserModel } from "@/models/User";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  await connectToDatabase();
  const [settings, userCount] = await Promise.all([
    getOrCreateSettings(),
    UserModel.estimatedDocumentCount(),
  ]);

  return (
    <Suspense>
      <LoginForm
        templeName={settings.name}
        firstTimeSetup={userCount === 0}
      />
    </Suspense>
  );
}
