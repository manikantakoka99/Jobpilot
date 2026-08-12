"use client";

import * as React from "react";
import Link from "next/link";
import { History, ArrowRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ConfirmDeleteButton } from "@/components/ats/confirm-delete-button";
import { deleteResumeVersionAction } from "@/app/dashboard/resume-optimizer/actions";
import { formatDateTime } from "@/lib/format";
import type { ResumeVersionSummary } from "@/services/resume-optimizer-service";

function scoreBadgeVariant(score: number | null): "default" | "secondary" | "destructive" {
  if (score == null) return "secondary";
  if (score >= 80) return "default";
  if (score >= 60) return "secondary";
  return "destructive";
}

export function VersionHistoryList({ versions: initialVersions }: { versions: ResumeVersionSummary[] }) {
  const [versions, setVersions] = React.useState(initialVersions);

  if (versions.length === 0) {
    return (
      <Card>
        <EmptyState icon={History} title="No saved versions yet" description="Optimize a resume and save the result to see it here." />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {versions.map((version) => (
        <Card key={version.id} className="flex flex-row flex-wrap items-center gap-3 p-4">
          <Link
            href={`/dashboard/resume-optimizer/versions/${version.id}`}
            className="min-w-0 flex-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <p className="truncate text-sm font-medium">
              {version.versionName || `Version ${version.versionNumber}`}
              {version.targetJobTitle && <span className="text-muted-foreground font-normal"> · {version.targetJobTitle}</span>}
              {version.targetCompany && <span className="text-muted-foreground font-normal"> @ {version.targetCompany}</span>}
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {version.resumeFileName} · {formatDateTime(version.createdAt)}
            </p>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            {version.atsScoreOriginal != null && version.atsScoreOptimized != null && (
              <div className="flex items-center gap-1 text-xs">
                <Badge variant={scoreBadgeVariant(version.atsScoreOriginal)}>{version.atsScoreOriginal}</Badge>
                <ArrowRight className="text-muted-foreground size-3" />
                <Badge variant={scoreBadgeVariant(version.atsScoreOptimized)}>{version.atsScoreOptimized}</Badge>
              </div>
            )}
          </div>
          <ConfirmDeleteButton
            action={() => deleteResumeVersionAction(version.id)}
            label="Delete version"
            successMessage="Version deleted"
            onDeleted={() => setVersions((prev) => prev.filter((v) => v.id !== version.id))}
          />
        </Card>
      ))}
    </div>
  );
}
