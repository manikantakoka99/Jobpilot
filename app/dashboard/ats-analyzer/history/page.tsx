import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { listAnalyses } from "@/services/analysis-service";
import { AnalysisHistoryList } from "@/components/ats/analysis-history-list";

export const metadata: Metadata = { title: "History – ATS Analyzer" };

export default async function AtsHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const analyses = await listAnalyses(supabase, user.id);

  return <AnalysisHistoryList analyses={analyses} />;
}
