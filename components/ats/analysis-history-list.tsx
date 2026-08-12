"use client";

import * as React from "react";
import Link from "next/link";
import { History } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ConfirmDeleteButton } from "@/components/ats/confirm-delete-button";
import { deleteAnalysisAction } from "@/app/dashboard/ats-analyzer/actions";
import { formatDateTime } from "@/lib/format";
import type { AnalysisSummary } from "@/services/analysis-service";

function scoreBadgeVariant(score: number): "default" | "secondary" | "destructive" {
  if (score >= 80) return "default";
  if (score >= 60) return "secondary";
  return "destructive";
}

export function AnalysisHistoryList({ analyses: initialAnalyses }: { analyses: AnalysisSummary[] }) {
  const [analyses, setAnalyses] = React.useState(initialAnalyses);

  if (analyses.length === 0) {
    return (
      <Card>
        <EmptyState icon={History} title="No analyses yet" description="Run your first ATS analysis to see your results here." />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {analyses.map((analysis) => (
        <Card key={analysis.id} className="flex flex-row flex-wrap items-center gap-3 p-4">
          <Link href={`/dashboard/ats-analyzer/results/${analysis.id}`} className="min-w-0 flex-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <p className="truncate text-sm font-medium">{analysis.jobTitle || "Untitled position"}</p>
            <p className="text-muted-foreground truncate text-xs">
              {analysis.resumeFileName} · {formatDateTime(analysis.createdAt)}
            </p>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={scoreBadgeVariant(analysis.atsScore)}>{analysis.atsScore}/100</Badge>
            <Badge variant="outline">{analysis.keywordMatchPercentage}% keywords</Badge>
          </div>
          <ConfirmDeleteButton
            action={() => deleteAnalysisAction(analysis.id)}
            successMessage="Analysis deleted"
            onDeleted={() => setAnalyses((prev) => prev.filter((a) => a.id !== analysis.id))}
          />
        </Card>
      ))}
    </div>
  );
}
