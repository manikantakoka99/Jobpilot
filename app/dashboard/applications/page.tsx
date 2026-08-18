import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { listApplications } from "@/services/application-service";
import { ApplicationStats } from "@/components/applications/application-stats";
import { ApplicationBoard } from "@/components/applications/application-board";

export const metadata: Metadata = { title: "Applications" };

export default async function ApplicationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const applications = await listApplications(supabase, user.id);

  return (
    <div className="space-y-6">
      <ApplicationStats applications={applications} />
      <ApplicationBoard applications={applications} />
    </div>
  );
}
