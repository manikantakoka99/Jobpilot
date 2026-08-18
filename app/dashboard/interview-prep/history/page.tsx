import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { listInterviewSessions } from "@/services/interview-service";
import { InterviewHistoryList } from "@/components/interview/interview-history-list";

export const metadata: Metadata = { title: "History – Interview Prep" };

export default async function InterviewHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sessions = await listInterviewSessions(supabase, user.id);

  return <InterviewHistoryList sessions={sessions} />;
}
