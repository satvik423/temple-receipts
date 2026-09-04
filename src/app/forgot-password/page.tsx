import { Suspense } from "react";

import { ForgotPasswordForm } from "@/app/forgot-password/form";
import { getOrCreateSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const settings = await getOrCreateSettings();
  return (
    <Suspense>
      <ForgotPasswordForm templeName={settings.name} />
    </Suspense>
  );
}
