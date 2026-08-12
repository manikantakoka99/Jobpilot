import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getAnalysisView } from "@/services/analysis-service";
import { ResultView } from "@/components/ats/result-view";

export const metadata: Metadata = { title: "Result – ATS Analyzer" };

export default async function AtsResultPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { id } = await params;

  // Guard against malformed ids before hitting the database — a non-UUID
  // value would otherwise surface as a raw Postgres error.
  const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isValidUuid) notFound();

  // getAnalysisView always filters by the authenticated user's id — a
  // browser-supplied analysis id can never load another user's analysis.
  const analysis = await getAnalysisView(supabase, user.id, id);
  if (!analysis) notFound();

  return <ResultView analysis={analysis} />;
}
