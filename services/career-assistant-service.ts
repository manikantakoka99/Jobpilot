import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, CareerAssistantSessionRow, CareerAssistantMessageRow } from "@/types/database";
import { requireAIProvider } from "@/lib/ai/provider";
import type { CareerAssistantChatMessage } from "@/lib/ai/types";

type Client = SupabaseClient<Database>;

export class CareerAssistantServiceError extends Error {}

/** How many prior turns (user+assistant) are sent to the AI as conversation history — full history stays in the DB. */
const MAX_HISTORY_MESSAGES = 10;
const MAX_MESSAGE_LENGTH = 4000;

/**
 * Builds a condensed, factual, non-raw-text summary of the user's own
 * JobPilot data — names, counts, scores, statuses only. Never includes full
 * resume text or full job descriptions, so the AI provider never receives
 * more personal data than it needs to answer questions about the account.
 */
async function buildContextSummary(supabase: Client, userId: string): Promise<string> {
  const [profileRes, resumesRes, versionsRes, analysesRes, applicationsRes, lettersRes, sessionsRes, jobsRes] = await Promise.all([
    supabase.from("profiles").select("full_name, location").eq("id", userId).maybeSingle(),
    supabase.from("resumes").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("resume_versions").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("job_analyses").select("ats_score, job_title, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    supabase.from("applications").select("job_title, company, status, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(15),
    supabase.from("cover_letters").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("interview_sessions").select("job_title, mode, status, overall_score, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    supabase.from("jobs").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  const profile = profileRes.data;
  const analyses = analysesRes.data ?? [];
  const applications = applicationsRes.data ?? [];
  const interviewSessions = sessionsRes.data ?? [];

  const statusCounts = new Map<string, number>();
  for (const a of applications) statusCounts.set(a.status, (statusCounts.get(a.status) ?? 0) + 1);

  const lines: string[] = [];
  lines.push(`Name: ${profile?.full_name ?? "Not set"}`);
  lines.push(`Location: ${profile?.location ?? "Not set"}`);
  lines.push(`Resumes uploaded: ${resumesRes.count ?? 0}`);
  lines.push(`Optimized resume versions: ${versionsRes.count ?? 0}`);
  lines.push(`Cover letters generated: ${lettersRes.count ?? 0}`);
  lines.push(`Saved jobs: ${jobsRes.count ?? 0}`);

  lines.push(`\nRecent ATS analyses (most recent first, up to 5):`);
  lines.push(analyses.length === 0 ? "- None yet" : analyses.map((a) => `- "${a.job_title ?? "Untitled"}": ATS score ${a.ats_score}/100 (${a.created_at.slice(0, 10)})`).join("\n"));

  lines.push(`\nApplications by status: ${[...statusCounts.entries()].map(([s, c]) => `${s}: ${c}`).join(", ") || "None yet"}`);
  lines.push(`\nRecent applications (most recent first, up to 15):`);
  lines.push(
    applications.length === 0
      ? "- None yet"
      : applications.map((a) => `- "${a.job_title}" @ ${a.company} — status: ${a.status} (logged ${a.created_at.slice(0, 10)})`).join("\n"),
  );

  lines.push(`\nRecent mock interview sessions (most recent first, up to 5):`);
  lines.push(
    interviewSessions.length === 0
      ? "- None yet"
      : interviewSessions
          .map((s) => `- "${s.job_title}" (${s.mode}) — ${s.status}${s.overall_score != null ? `, score ${s.overall_score}/100` : ""} (${s.created_at.slice(0, 10)})`)
          .join("\n"),
  );

  return lines.join("\n");
}

export interface CareerAssistantSessionSummary {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
}

export async function listCareerAssistantSessions(supabase: Client, userId: string): Promise<CareerAssistantSessionSummary[]> {
  const { data, error } = await supabase
    .from("career_assistant_sessions")
    .select("id, title, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((s) => ({ id: s.id, title: s.title, updatedAt: s.updated_at, createdAt: s.created_at }));
}

export async function createCareerAssistantSession(supabase: Client, userId: string): Promise<CareerAssistantSessionRow> {
  const { data, error } = await supabase
    .from("career_assistant_sessions")
    .insert({ user_id: userId })
    .select("*")
    .single();
  if (error || !data) throw new CareerAssistantServiceError("Failed to start a new conversation. Please try again.");
  return data;
}

export interface CareerAssistantSessionDetail {
  session: CareerAssistantSessionRow;
  messages: CareerAssistantMessageRow[];
}

export async function getCareerAssistantSession(
  supabase: Client,
  userId: string,
  sessionId: string,
): Promise<CareerAssistantSessionDetail | null> {
  const { data: session, error: sessionError } = await supabase
    .from("career_assistant_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (sessionError) throw sessionError;
  if (!session) return null;

  const { data: messages, error: messagesError } = await supabase
    .from("career_assistant_messages")
    .select("*")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (messagesError) throw messagesError;

  return { session, messages: messages ?? [] };
}

export async function deleteCareerAssistantSession(supabase: Client, userId: string, sessionId: string): Promise<void> {
  const { error } = await supabase.from("career_assistant_sessions").delete().eq("id", sessionId).eq("user_id", userId);
  if (error) throw new CareerAssistantServiceError("Failed to delete conversation. Please try again.");
}

/**
 * Sends one user message, gets an AI reply grounded only in a condensed
 * context summary + a recency-bounded slice of prior turns, and persists
 * both messages. Auto-titles the session from the first message.
 */
export async function sendCareerAssistantMessage(
  supabase: Client,
  userId: string,
  sessionId: string,
  message: string,
): Promise<{ userMessage: CareerAssistantMessageRow; assistantMessage: CareerAssistantMessageRow }> {
  const trimmed = message.trim();
  if (!trimmed) throw new CareerAssistantServiceError("Please enter a message.");
  if (trimmed.length > MAX_MESSAGE_LENGTH) throw new CareerAssistantServiceError("Message is too long.");

  const { data: session, error: sessionError } = await supabase
    .from("career_assistant_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (sessionError) throw sessionError;
  if (!session) throw new CareerAssistantServiceError("Conversation not found.");

  const { data: priorMessages, error: priorError } = await supabase
    .from("career_assistant_messages")
    .select("role, content, created_at")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(MAX_HISTORY_MESSAGES);
  if (priorError) throw priorError;

  const history: CareerAssistantChatMessage[] = (priorMessages ?? [])
    .slice()
    .reverse()
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const contextSummary = await buildContextSummary(supabase, userId);
  const provider = requireAIProvider();
  const result = await provider.careerAssistantChat({ contextSummary, history, message: trimmed });

  const { data: userMessage, error: userMessageError } = await supabase
    .from("career_assistant_messages")
    .insert({ session_id: sessionId, user_id: userId, role: "user", content: trimmed })
    .select("*")
    .single();
  if (userMessageError || !userMessage) throw new CareerAssistantServiceError("Failed to save your message. Please try again.");

  const { data: assistantMessage, error: assistantMessageError } = await supabase
    .from("career_assistant_messages")
    .insert({ session_id: sessionId, user_id: userId, role: "assistant", content: result.message })
    .select("*")
    .single();
  if (assistantMessageError || !assistantMessage) {
    throw new CareerAssistantServiceError("Failed to save the assistant's reply. Please try again.");
  }

  // Auto-title a fresh conversation from the first message; touch updated_at otherwise.
  const isFirstMessage = session.title === "New conversation";
  await supabase
    .from("career_assistant_sessions")
    .update(isFirstMessage ? { title: trimmed.slice(0, 60) } : { updated_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("user_id", userId);

  return { userMessage, assistantMessage };
}
