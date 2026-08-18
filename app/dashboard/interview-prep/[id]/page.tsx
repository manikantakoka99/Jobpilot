import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getInterviewSessionDetail } from "@/services/interview-service";
import { InterviewSessionView } from "@/components/interview/interview-session-view";
import { InterviewSummaryCard } from "@/components/interview/interview-summary-card";

export const metadata: Metadata = { title: "Session – Interview Prep" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function InterviewSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  // getInterviewSessionDetail always filters by the authenticated user's id —
  // a browser-supplied session id can never load another user's session.
  const detail = await getInterviewSessionDetail(supabase, user.id, id);
  if (!detail) notFound();

  if (detail.session.status === "completed") {
    return <InterviewSummaryCard detail={detail} />;
  }

  return <InterviewSessionView detail={detail} />;
}
