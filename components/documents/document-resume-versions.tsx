"use client";

import * as React from "react";
import Link from "next/link";
import { History, Copy, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ConfirmDeleteButton } from "@/components/ats/confirm-delete-button";
import { deleteResumeVersionAction } from "@/app/dashboard/resume-optimizer/actions";
import { getResumeVersionContentAction } from "@/app/dashboard/documents/actions";
import { downloadTextFile } from "@/lib/download";
import { formatDateTime } from "@/lib/format";
import type { ResumeVersionSummary } from "@/services/resume-optimizer-service";

function scoreBadgeVariant(score: number | null): "default" | "secondary" | "destructive" {
  if (score == null) return "secondary";
  if (score >= 80) return "default";
  if (score >= 60) return "secondary";
  return "destructive";
}

/** Generated resume versions — reuses resume-optimizer-service for content and deletion, no duplicate storage logic. */
export function DocumentResumeVersions({ versions: initialVersions }: { versions: ResumeVersionSummary[] }) {
  const [versions, setVersions] = React.useState(initialVersions);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function withContent(versionId: string, onLoaded: (content: string, fileName: string) => void) {
    setPendingId(versionId);
    const result = await getResumeVersionContentAction(versionId);
    setPendingId(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    onLoaded(result.data.content, result.data.fileName);
  }

  if (versions.length === 0) {
    return (
      <Card>
        <EmptyState icon={History} title="No optimized versions yet" description="Optimize a resume and save the result to see it here." />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {versions.map((version) => (
        <Card key={version.id} className="flex flex-row flex-wrap items-center gap-3 p-4">
          <Link
            href={`/dashboard/resume-optimizer/versions/${version.id}`}
            className="focus-visible:ring-ring min-w-0 flex-1 rounded-md outline-none focus-visible:ring-2"
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
          {version.atsScoreOptimized != null && (
            <Badge variant={scoreBadgeVariant(version.atsScoreOptimized)} className="shrink-0">
              ATS {version.atsScoreOptimized}
            </Badge>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            disabled={pendingId === version.id}
            onClick={() =>
              withContent(version.id, (content) => {
                navigator.clipboard.writeText(content);
                toast.success("Copied to clipboard");
              })
            }
          >
            {pendingId === version.id ? <Loader2 className="size-3.5 animate-spin" /> : <Copy className="size-3.5" />}
            Copy
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            disabled={pendingId === version.id}
            onClick={() =>
              withContent(version.id, (content, fileName) => {
                downloadTextFile(`resume-v${version.versionNumber}-${fileName.replace(/\.[^.]+$/, "")}.txt`, content);
              })
            }
          >
            <Download className="size-3.5" /> Download
          </Button>
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
