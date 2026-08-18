import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Database,
  Json,
  InterviewSessionRow,
  InterviewQuestionRow,
  InterviewAnswerRow,
} from "@/types/database";
import type { StartInterviewSessionInput } from "@/lib/validations/interview";
import { findSkillsIn } from "@/lib/ats/skills";
import { requireAIProvider } from "@/lib/ai/provider";
import { getResumeById } from "./resume-service";
import { getResumeVersionById } from "./resume-optimizer-service";

type Client = SupabaseClient<Database>;

export class InterviewServiceError extends Error {}

/** Resolves the grounding text (+ dictionary-matched skills) a session's questions/feedback are based on. Never a source of new facts by itself. */
async function resolveGrounding(
  supabase: Client,
  userId: string,
  input: { resumeId?: string | null; resumeVersionId?: string | null },
): Promise<{ resumeText: string; detectedSkills: string[] }> {
  if (input.resumeVersionId) {
    const version = await getResumeVersionById(supabase, userId, input.resumeVersionId);
    if (!version) throw new InterviewServiceError("Selected resume version not found.");
    const text = version.content;
    return { resumeText: text, detectedSkills: findSkillsIn(text).map((s) => s.name) };
  }

  if (input.resumeId) {
    const resume = await getResumeById(supabase, userId, input.resumeId);
    if (!resume) throw new InterviewServiceError("Resume not found.");
    if (resume.text_extraction_status !== "success" || !resume.extracted_text) {
      throw new InterviewServiceError(
        "This resume has no extractable text yet. Please upload a text-based PDF or DOCX file first.",
      );
    }
    return { resumeText: resume.extracted_text, detectedSkills: findSkillsIn(resume.extracted_text).map((s) => s.name) };
  }

  return { resumeText: "", detectedSkills: [] };
}

export interface InterviewSessionDetail {
  session: InterviewSessionRow;
  questions: (InterviewQuestionRow & { answer: InterviewAnswerRow | null })[];
}

/**
 * Generates all of a session's questions up front (one AI call) and persists
 * the session + its questions. Technical/mixed modes require a resume so
 * technical questions have something real to be grounded in; pure behavioral
 * sessions can run without one, using generic STAR-style patterns only.
 */
export async function createInterviewSession(
  supabase: Client,
  userId: string,
  input: StartInterviewSessionInput,
): Promise<InterviewSessionDetail> {
  const grounding = await resolveGrounding(supabase, userId, input);

  if (input.mode !== "behavioral" && !grounding.resumeText) {
    throw new InterviewServiceError(
      "Select a resume (or resume version) so technical questions can be grounded in your real experience.",
    );
  }

  const provider = requireAIProvider();
  const jobDescription = input.jobDescription?.trim() ?? "";

  const aiResult = await provider.generateInterviewQuestions({
    mode: input.mode,
    totalQuestions: input.totalQuestions,
    jobTitle: input.jobTitle,
    company: input.company,
    jobDescription,
    grounding,
  });

  const questions = aiResult.questions.slice(0, input.totalQuestions);
  if (questions.length === 0) {
    throw new InterviewServiceError("The AI provider didn't return any questions. Please try again.");
  }

  const { data: session, error: sessionError } = await supabase
    .from("interview_sessions")
    .insert({
      user_id: userId,
      resume_id: input.resumeId ?? null,
      resume_version_id: input.resumeVersionId ?? null,
      job_id: input.jobId ?? null,
      job_title: input.jobTitle.trim(),
      company: input.company?.trim() || null,
      job_description: jobDescription,
      resume_snapshot: grounding.resumeText,
      detected_skills: grounding.detectedSkills as unknown as Json,
      mode: input.mode,
      total_questions: questions.length,
    })
    .select("*")
    .single();

  if (sessionError || !session) throw new InterviewServiceError("Failed to start interview session. Please try again.");

  const { data: insertedQuestions, error: questionsError } = await supabase
    .from("interview_questions")
    .insert(
      questions.map((q, i) => ({
        session_id: session.id,
        user_id: userId,
        question_number: i + 1,
        category: q.category,
        question_text: q.questionText,
        grounded_in: q.groundedIn as unknown as Json,
      })),
    )
    .select("*")
    .order("question_number", { ascending: true });

  if (questionsError || !insertedQuestions) {
    // Best-effort cleanup — never leave a session with no questions behind.
    await supabase.from("interview_sessions").delete().eq("id", session.id).eq("user_id", userId);
    throw new InterviewServiceError("Failed to save interview questions. Please try again.");
  }

  return { session, questions: insertedQuestions.map((q) => ({ ...q, answer: null })) };
}

export interface InterviewSessionSummary {
  id: string;
  jobTitle: string;
  company: string | null;
  mode: InterviewSessionRow["mode"];
  status: InterviewSessionRow["status"];
  totalQuestions: number;
  answeredCount: number;
  overallScore: number | null;
  createdAt: string;
  completedAt: string | null;
}

export async function listInterviewSessions(supabase: Client, userId: string): Promise<InterviewSessionSummary[]> {
  const { data: sessions, error } = await supabase
    .from("interview_sessions")
    .select("id, job_title, company, mode, status, total_questions, overall_score, created_at, completed_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!sessions || sessions.length === 0) return [];

  const sessionIds = sessions.map((s) => s.id);
  const { data: answers, error: answersError } = await supabase
    .from("interview_answers")
    .select("session_id")
    .eq("user_id", userId)
    .in("session_id", sessionIds);
  if (answersError) throw answersError;

  const answeredCountBySession = new Map<string, number>();
  for (const a of answers ?? []) {
    answeredCountBySession.set(a.session_id, (answeredCountBySession.get(a.session_id) ?? 0) + 1);
  }

  return sessions.map((s) => ({
    id: s.id,
    jobTitle: s.job_title,
    company: s.company,
    mode: s.mode,
    status: s.status,
    totalQuestions: s.total_questions,
    answeredCount: answeredCountBySession.get(s.id) ?? 0,
    overallScore: s.overall_score,
    createdAt: s.created_at,
    completedAt: s.completed_at,
  }));
}

export async function getInterviewSessionDetail(
  supabase: Client,
  userId: string,
  sessionId: string,
): Promise<InterviewSessionDetail | null> {
  const { data: session, error: sessionError } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (sessionError) throw sessionError;
  if (!session) return null;

  const { data: questions, error: questionsError } = await supabase
    .from("interview_questions")
    .select("*")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .order("question_number", { ascending: true });
  if (questionsError) throw questionsError;

  const { data: answers, error: answersError } = await supabase
    .from("interview_answers")
    .select("*")
    .eq("session_id", sessionId)
    .eq("user_id", userId);
  if (answersError) throw answersError;

  const answerByQuestionId = new Map((answers ?? []).map((a) => [a.question_id, a]));

  return {
    session,
    questions: (questions ?? []).map((q) => ({ ...q, answer: answerByQuestionId.get(q.id) ?? null })),
  };
}

/** Saves (or updates, if re-answered) one question's answer and its AI feedback. The session must still be in progress. */
export async function submitInterviewAnswer(
  supabase: Client,
  userId: string,
  questionId: string,
  answerText: string,
): Promise<InterviewAnswerRow> {
  const { data: question, error: questionError } = await supabase
    .from("interview_questions")
    .select("*")
    .eq("id", questionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (questionError) throw questionError;
  if (!question) throw new InterviewServiceError("Question not found.");

  const { data: session, error: sessionError } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("id", question.session_id)
    .eq("user_id", userId)
    .maybeSingle();
  if (sessionError) throw sessionError;
  if (!session) throw new InterviewServiceError("Interview session not found.");
  if (session.status !== "in_progress") {
    throw new InterviewServiceError("This interview session is already finished.");
  }

  const provider = requireAIProvider();
  const feedback = await provider.evaluateInterviewAnswer({
    questionText: question.question_text,
    category: question.category,
    answerText,
    grounding: {
      resumeText: session.resume_snapshot,
      detectedSkills: (session.detected_skills as string[] | null) ?? [],
    },
  });

  const { data: existing } = await supabase
    .from("interview_answers")
    .select("id")
    .eq("question_id", questionId)
    .eq("user_id", userId)
    .maybeSingle();

  const payload = {
    answer_text: answerText,
    score: feedback.score,
    feedback: feedback as unknown as Json,
  };

  if (existing) {
    const { data, error } = await supabase
      .from("interview_answers")
      .update(payload)
      .eq("id", existing.id)
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error || !data) throw new InterviewServiceError("Failed to save your answer. Please try again.");
    return data;
  }

  const { data, error } = await supabase
    .from("interview_answers")
    .insert({ question_id: questionId, session_id: question.session_id, user_id: userId, ...payload })
    .select("*")
    .single();
  if (error || !data) throw new InterviewServiceError("Failed to save your answer. Please try again.");
  return data;
}

/**
 * Finishes a session: computes the overall score deterministically (average
 * of the AI's per-answer scores — never an AI-invented number), then asks
 * the AI for a strengths/weaknesses/improvement summary grounded only in the
 * actual transcript. Requires at least one answered question.
 */
export async function finishInterviewSession(
  supabase: Client,
  userId: string,
  sessionId: string,
): Promise<InterviewSessionRow> {
  const detail = await getInterviewSessionDetail(supabase, userId, sessionId);
  if (!detail) throw new InterviewServiceError("Interview session not found.");
  if (detail.session.status !== "in_progress") {
    throw new InterviewServiceError("This interview session is already finished.");
  }

  const answered = detail.questions.filter((q) => q.answer != null);
  if (answered.length === 0) {
    throw new InterviewServiceError("Answer at least one question before finishing the session.");
  }

  const overallScore = Math.round(answered.reduce((sum, q) => sum + (q.answer?.score ?? 0), 0) / answered.length);

  const provider = requireAIProvider();
  const summary = await provider.summarizeInterviewSession({
    jobTitle: detail.session.job_title,
    mode: detail.session.mode,
    qaPairs: answered.map((q) => ({
      questionText: q.question_text,
      category: q.category,
      answerText: q.answer!.answer_text,
      score: q.answer!.score,
      feedbackSummary: (q.answer!.feedback as { summary?: string } | null)?.summary ?? null,
    })),
  });

  const { data, error } = await supabase
    .from("interview_sessions")
    .update({
      status: "completed",
      overall_score: overallScore,
      strengths: summary.strengths as unknown as Json,
      weaknesses: summary.weaknesses as unknown as Json,
      improvement_suggestions: summary.improvementSuggestions as unknown as Json,
      completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error || !data) throw new InterviewServiceError("Failed to finish interview session. Please try again.");
  return data;
}

export async function deleteInterviewSession(supabase: Client, userId: string, sessionId: string): Promise<void> {
  const { error } = await supabase.from("interview_sessions").delete().eq("id", sessionId).eq("user_id", userId);
  if (error) throw new InterviewServiceError("Failed to delete interview session. Please try again.");
}
