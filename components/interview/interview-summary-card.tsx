import { CheckCircle2, TrendingUp, Lightbulb } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import type { InterviewSessionDetail } from "@/app/dashboard/interview-prep/actions";

function scoreTone(score: number) {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

type Feedback = { score: number; summary: string } | null;

interface InterviewSummaryCardProps {
  detail: InterviewSessionDetail;
}

export function InterviewSummaryCard({ detail }: InterviewSummaryCardProps) {
  const { session, questions } = detail;
  const strengths = (session.strengths as string[] | null) ?? [];
  const weaknesses = (session.weaknesses as string[] | null) ?? [];
  const improvements = (session.improvement_suggestions as string[] | null) ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Final score</CardTitle>
              <CardDescription>
                {session.job_title}
                {session.company ? ` @ ${session.company}` : ""} · Completed{" "}
                {session.completed_at ? formatDateTime(session.completed_at) : ""}
              </CardDescription>
            </div>
            <span className={cn("text-4xl font-semibold tabular-nums", scoreTone(session.overall_score ?? 0))}>
              {session.overall_score ?? "—"}
              <span className="text-muted-foreground text-base font-normal">/100</span>
            </span>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" /> Strengths
            </p>
            <ul className="text-muted-foreground space-y-1 text-sm">
              {strengths.length === 0 && <li>—</li>}
              {strengths.map((s, i) => (
                <li key={i} className="text-pretty">
                  • {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <TrendingUp className="size-4 text-amber-600 dark:text-amber-400" /> Weaknesses
            </p>
            <ul className="text-muted-foreground space-y-1 text-sm">
              {weaknesses.length === 0 && <li>—</li>}
              {weaknesses.map((s, i) => (
                <li key={i} className="text-pretty">
                  • {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <Lightbulb className="size-4 text-primary" /> Suggestions
            </p>
            <ul className="text-muted-foreground space-y-1 text-sm">
              {improvements.length === 0 && <li>—</li>}
              {improvements.map((s, i) => (
                <li key={i} className="text-pretty">
                  • {s}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Question-by-question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((q) => {
            const feedback = q.answer?.feedback as Feedback;
            return (
              <div key={q.id} className="border-border space-y-1.5 border-b pb-4 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {q.category}
                    </Badge>
                    <p className="text-sm font-medium text-pretty">{q.question_text}</p>
                  </div>
                  {feedback && (
                    <span className={cn("shrink-0 text-sm font-semibold tabular-nums", scoreTone(feedback.score))}>
                      {feedback.score}/100
                    </span>
                  )}
                </div>
                {q.answer ? (
                  <>
                    <p className="text-muted-foreground text-sm text-pretty">{q.answer.answer_text}</p>
                    {feedback?.summary && <p className="text-muted-foreground text-xs text-pretty">{feedback.summary}</p>}
                  </>
                ) : (
                  <p className="text-muted-foreground text-xs italic">Not answered.</p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
