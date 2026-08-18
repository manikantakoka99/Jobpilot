import { redirect, notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { listCareerAssistantSessions, getCareerAssistantSession } from "@/services/career-assistant-service";
import { CareerAssistantShell } from "@/components/career-assistant/career-assistant-shell";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CareerAssistantSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  // getCareerAssistantSession always filters by the authenticated user's id —
  // a browser-supplied session id can never load another user's session.
  const [sessions, detail] = await Promise.all([
    listCareerAssistantSessions(supabase, user.id),
    getCareerAssistantSession(supabase, user.id, id),
  ]);
  if (!detail) notFound();

  return <CareerAssistantShell sessions={sessions} activeSessionId={id} initialDetail={detail} />;
}
