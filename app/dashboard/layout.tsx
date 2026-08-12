import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/services/profile-service";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // middleware.ts already guards /dashboard, this is a defensive fallback.
  if (!user) redirect("/login");

  const profile = await ensureProfile(supabase, user);

  return (
    <div className="flex min-h-svh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar fullName={profile.full_name} email={profile.email} avatarUrl={profile.avatar_url} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
