import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { listExtensionTokens } from "@/services/extension-token-service";
import { AccountSection } from "@/components/dashboard/settings/account-section";
import { AppearanceSection } from "@/components/dashboard/settings/appearance-section";
import { NotificationsSection } from "@/components/dashboard/settings/notifications-section";
import { ExtensionSection } from "@/components/dashboard/settings/extension-section";
import { DangerZoneSection } from "@/components/dashboard/settings/danger-zone-section";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const tokens = await listExtensionTokens(supabase, user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <AccountSection email={user.email ?? ""} />
      <AppearanceSection />
      <NotificationsSection />
      <ExtensionSection tokens={tokens} />
      <DangerZoneSection />
    </div>
  );
}
