import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";
import { getOrCreateSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const settings = await getOrCreateSettings();

  return (
    <Suspense>
      <LoginForm templeName={settings.name} />
    </Suspense>
  );
}
