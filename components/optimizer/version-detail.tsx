"use client";

import { useRouter } from "next/navigation";
import { Calendar, FileText, Download, ArrowRight, Info, AlertTriangle } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreGauge, scoreTone } from "@/components/ats/score-gauge";
import { ConfirmDeleteButton } from "@/components/ats/confirm-delete-button";
import { deleteResumeVersionAction } from "@/app/dashboard/resume-optimizer/actions";
import { formatDateTime } from "@/lib/format";
import { downloadTextFile } from "@/lib/download";
import { cn } from "@/lib/utils";
import type { ResumeVersionRow } from "@/types/database";
import type { ResumeChange } from "@/lib/validations/ai-output";

interface VersionDetailProps {
  version: ResumeVersionRow & { resumeFileName: string };
  baseText: string | null;
  baseLabel: string;
}

export function VersionDetail({ version, baseText, baseLabel }: VersionDetailProps) {
  const router = useRouter();

  const changes = (version.change_summary as unknown as ResumeChange[]) ?? [];
  const remainingMissingKeywords = (version.remaining_missing_keywords as unknown as string[]) ?? [];
  const remainingIssues = (version.remaining_issues as unknown as string[]) ?? [];

  function handleDownload() {
    const fileName = `${version.resumeFileName.replace(/\.[^.]+$/, "")}-${version.version_name || `v${version.version_number}`}.txt`;
    downloadTextFile(fileName, version.content);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className="truncate text-xl font-semibold tracking-tight">
            {version.version_name || `Version ${version.version_number}`}
          </h2>
          <p className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="inline-flex items-center gap-1">
              <FileText className="size-3.5" /> {version.resumeFileName}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3.5" /> {formatDateTime(version.created_at)}
            </span>
            {version.target_job_title && (
              <span>
                {version.target_job_title}
                {version.target_company && ` @ ${version.target_company}`}
              </span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleDownload}>
            <Download className="size-3.5" /> Download
          </Button>
          <ConfirmDeleteButton
            action={() => deleteResumeVersionAction(version.id)}
            label="Delete version"
            successMessage="Version deleted"
            onDeleted={() => router.push("/dashboard/resume-optimizer/versions")}
          />
        </div>
      </div>

      {version.ats_score_original != null && version.ats_score_optimized != null && (
        <Card>
          <CardContent className="grid gap-6 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <div className="flex flex-col items-center gap-2">
              <ScoreGauge score={version.ats_score_original} size={104} />
              <Badge variant="outline" className={cn("bg-transparent", scoreTone(version.ats_score_original).text)}>
                Original
              </Badge>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <ArrowRight className="text-muted-foreground size-5" />
              {version.ats_score_delta != null && (
                <Badge variant={version.ats_score_delta > 0 ? "default" : "secondary"}>
                  {version.ats_score_delta > 0 ? `+${version.ats_score_delta}` : version.ats_score_delta} points
                </Badge>
              )}
            </div>
            <div className="flex flex-col items-center gap-2">
              <ScoreGauge score={version.ats_score_optimized} size={104} />
              <Badge variant="outline" className={cn("bg-transparent", scoreTone(version.ats_score_optimized).text)}>
                Optimized
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {changes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Changes ({changes.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {changes.map((change, i) => (
              <div key={i} className="border-border space-y-2 rounded-lg border p-3">
                <Badge variant="secondary">{change.section}</Badge>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="bg-destructive/5 rounded-md p-2.5">
                    <p className="text-muted-foreground mb-1 text-xs font-medium">Before</p>
                    <p className="text-sm leading-relaxed text-pretty">{change.original}</p>
                  </div>
                  <div className="rounded-md bg-emerald-500/5 p-2.5">
                    <p className="text-muted-foreground mb-1 text-xs font-medium">After</p>
                    <p className="text-sm leading-relaxed text-pretty">{change.optimized}</p>
                  </div>
                </div>
                <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
                  <Info className="mt-0.5 size-3 shrink-0" />
                  {change.reason}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {(remainingMissingKeywords.length > 0 || remainingIssues.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Still remaining</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {remainingMissingKeywords.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium">Missing keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {remainingMissingKeywords.map((kw) => (
                    <Badge key={kw} variant="outline" className="border-destructive/30 text-destructive">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {remainingIssues.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium">Issues</p>
                <ul className="space-y-1.5">
                  {remainingIssues.map((issue) => (
                    <li key={issue} className="text-muted-foreground flex items-start gap-1.5 text-xs">
                      <AlertTriangle className="mt-0.5 size-3 shrink-0 text-amber-500" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Compare</CardTitle>
          <CardDescription>{baseLabel} vs. {version.version_name || `Version ${version.version_number}`}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-medium">{baseLabel}</p>
              <pre className="bg-muted/50 max-h-[32rem] overflow-auto rounded-md p-3 text-xs whitespace-pre-wrap">
                {baseText || "Not available."}
              </pre>
            </div>
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-medium">
                {version.version_name || `Version ${version.version_number}`}
              </p>
              <pre className="bg-muted/50 max-h-[32rem] overflow-auto rounded-md p-3 text-xs whitespace-pre-wrap">{version.content}</pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
