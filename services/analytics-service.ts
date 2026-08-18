import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, ApplicationStatus } from "@/types/database";

type Client = SupabaseClient<Database>;

const DAY_MS = 24 * 60 * 60 * 1000;

const ALL_STATUSES: ApplicationStatus[] = [
  "Saved",
  "Preparing",
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
];

/** Ordered pipeline stages an application moves forward through — excludes the two terminal "left the pipeline" states. */
const FUNNEL_STAGES: ApplicationStatus[] = ["Saved", "Preparing", "Applied", "Screening", "Interview", "Offer"];

export interface AnalyticsSummary {
  totalApplications: number;
  weeklyApplications: number;
  monthlyApplications: number;
  interviewsCount: number;
  offersCount: number;
  rejectionRate: number | null;
  avgAtsScore: number | null;
  optimizedResumesCount: number;
  coverLettersCount: number;
  interviewSessionsCount: number;
  completedInterviewSessions: number;
  avgInterviewScore: number | null;
  applicationsOverTime: { date: string; count: number }[];
  statusDistribution: { status: ApplicationStatus; count: number }[];
  atsScoreTrend: { date: string; score: number }[];
  interviewConversion: { stage: string; count: number }[];
  funnel: { stage: string; count: number }[];
  hasAnyData: boolean;
}

/**
 * Every number here is derived live from existing tables (applications,
 * job_analyses, resume_versions, cover_letters, interview_sessions) — nothing
 * is pre-aggregated or stored separately, and there is no fallback to fake
 * or placeholder numbers. An empty account gets all-zero/null real values.
 */
export async function getAnalyticsSummary(supabase: Client, userId: string): Promise<AnalyticsSummary> {
  const [applicationsRes, analysesRes, versionsRes, lettersRes, sessionsRes] = await Promise.all([
    supabase.from("applications").select("status, created_at").eq("user_id", userId),
    supabase.from("job_analyses").select("ats_score, created_at").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("resume_versions").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("cover_letters").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("interview_sessions").select("status, overall_score, created_at").eq("user_id", userId),
  ]);

  if (applicationsRes.error) throw applicationsRes.error;
  if (analysesRes.error) throw analysesRes.error;
  if (versionsRes.error) throw versionsRes.error;
  if (lettersRes.error) throw lettersRes.error;
  if (sessionsRes.error) throw sessionsRes.error;

  const applications = applicationsRes.data ?? [];
  const analyses = analysesRes.data ?? [];
  const sessions = sessionsRes.data ?? [];

  const now = Date.now();
  const weekAgo = now - 7 * DAY_MS;
  const monthAgo = now - 30 * DAY_MS;

  const totalApplications = applications.length;
  const weeklyApplications = applications.filter((a) => new Date(a.created_at).getTime() >= weekAgo).length;
  const monthlyApplications = applications.filter((a) => new Date(a.created_at).getTime() >= monthAgo).length;

  const countByStatus = new Map<ApplicationStatus, number>();
  for (const status of ALL_STATUSES) countByStatus.set(status, 0);
  for (const a of applications) countByStatus.set(a.status, (countByStatus.get(a.status) ?? 0) + 1);

  const interviewsCount = countByStatus.get("Interview") ?? 0;
  const offersCount = countByStatus.get("Offer") ?? 0;
  const rejectedCount = countByStatus.get("Rejected") ?? 0;
  const rejectionRate = totalApplications > 0 ? Math.round((rejectedCount / totalApplications) * 100) : null;

  const avgAtsScore = analyses.length > 0 ? Math.round(analyses.reduce((sum, a) => sum + a.ats_score, 0) / analyses.length) : null;

  const completedSessions = sessions.filter((s) => s.status === "completed" && s.overall_score != null);
  const avgInterviewScore =
    completedSessions.length > 0
      ? Math.round(completedSessions.reduce((sum, s) => sum + (s.overall_score ?? 0), 0) / completedSessions.length)
      : null;

  // Daily application counts for the last 30 days.
  const applicationsOverTime: { date: string; count: number }[] = [];
  const dayBuckets = new Map<string, number>();
  for (const a of applications) {
    const key = a.created_at.slice(0, 10);
    dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + 1);
  }
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now - i * DAY_MS).toISOString().slice(0, 10);
    applicationsOverTime.push({ date, count: dayBuckets.get(date) ?? 0 });
  }

  const statusDistribution = ALL_STATUSES.map((status) => ({ status, count: countByStatus.get(status) ?? 0 }));

  const atsScoreTrend = analyses.slice(-20).map((a) => ({ date: a.created_at.slice(0, 10), score: a.ats_score }));

  const interviewConversion = [
    { stage: "Applied", count: applications.length - (countByStatus.get("Saved") ?? 0) - (countByStatus.get("Preparing") ?? 0) },
    { stage: "Interview", count: interviewsCount },
    { stage: "Offer", count: offersCount },
  ];

  const funnel = FUNNEL_STAGES.map((stage) => ({ stage, count: countByStatus.get(stage) ?? 0 }));

  const hasAnyData =
    totalApplications > 0 || analyses.length > 0 || sessions.length > 0 || (versionsRes.count ?? 0) > 0 || (lettersRes.count ?? 0) > 0;

  return {
    totalApplications,
    weeklyApplications,
    monthlyApplications,
    interviewsCount,
    offersCount,
    rejectionRate,
    avgAtsScore,
    optimizedResumesCount: versionsRes.count ?? 0,
    coverLettersCount: lettersRes.count ?? 0,
    interviewSessionsCount: sessions.length,
    completedInterviewSessions: completedSessions.length,
    avgInterviewScore,
    applicationsOverTime,
    statusDistribution,
    atsScoreTrend,
    interviewConversion,
    funnel,
    hasAnyData,
  };
}
