import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { listResumeVersions } from "@/services/resume-optimizer-service";
import { VersionHistoryList } from "@/components/optimizer/version-history-list";

export const metadata: Metadata = { title: "Versions – Resume Optimizer" };

export default async function ResumeOptimizerVersionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const versions = await listResumeVersions(supabase, user.id);

  return <VersionHistoryList versions={versions} />;
}
