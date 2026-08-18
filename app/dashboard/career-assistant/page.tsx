import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { listCareerAssistantSessions } from "@/services/career-assistant-service";
import { CareerAssistantShell } from "@/components/career-assistant/career-assistant-shell";

export default async function CareerAssistantPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sessions = await listCareerAssistantSessions(supabase, user.id);

  return <CareerAssistantShell sessions={sessions} activeSessionId={null} initialDetail={null} />;
}
