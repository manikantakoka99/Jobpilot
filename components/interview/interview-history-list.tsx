"use client";

import * as React from "react";
import Link from "next/link";
import { History, ArrowRight, CheckCircle2, Clock } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ConfirmDeleteButton } from "@/components/ats/confirm-delete-button";
import { deleteInterviewSessionAction } from "@/app/dashboard/interview-prep/actions";
import { formatDateTime } from "@/lib/format";
import type { InterviewSessionSummary } from "@/services/interview-service";

function scoreBadgeVariant(score: number | null): "default" | "secondary" | "destructive" {
  if (score == null) return "secondary";
  if (score >= 80) return "default";
  if (score >= 60) return "secondary";
  return "destructive";
}

export function InterviewHistoryList({ sessions: initialSessions }: { sessions: InterviewSessionSummary[] }) {
  const [sessions, setSessions] = React.useState(initialSessions);

  if (sessions.length === 0) {
    return (
      <Card>
        <EmptyState icon={History} title="No interview sessions yet" description="Start a new session to see your practice history here." />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <Card key={session.id} className="flex flex-row flex-wrap items-center gap-3 p-4">
          <Link
            href={`/dashboard/interview-prep/${session.id}`}
            className="min-w-0 flex-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <p className="truncate text-sm font-medium">
              {session.jobTitle}
              {session.company && <span className="text-muted-foreground font-normal"> @ {session.company}</span>}
              <Badge variant="outline" className="ml-2 capitalize">
                {session.mode}
              </Badge>
            </p>
            <p className="text-muted-foreground flex items-center gap-1 truncate text-xs">
              {session.status === "completed" ? (
                <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Clock className="size-3" />
              )}
              {session.answeredCount}/{session.totalQuestions} answered · {formatDateTime(session.createdAt)}
            </p>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            {session.status === "completed" && session.overallScore != null ? (
              <Badge variant={scoreBadgeVariant(session.overallScore)}>{session.overallScore}/100</Badge>
            ) : (
              <Badge variant="secondary">In progress</Badge>
            )}
            <ArrowRight className="text-muted-foreground size-3" />
          </div>
          <ConfirmDeleteButton
            action={() => deleteInterviewSessionAction(session.id)}
            label="Delete"
            successMessage="Session deleted"
            onDeleted={() => setSessions((prev) => prev.filter((s) => s.id !== session.id))}
          />
        </Card>
      ))}
    </div>
  );
}
