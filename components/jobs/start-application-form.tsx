"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResumeVersionSelect } from "@/components/optimizer/resume-version-select";
import { createApplicationAction } from "@/app/dashboard/applications/actions";
import { cn } from "@/lib/utils";
import type { JobRow, ResumeRow } from "@/types/database";
import type { ResumeVersionSummary } from "@/services/resume-optimizer-service";
import type { CoverLetterSummary } from "@/services/cover-letter-service";

function scoreBadgeVariant(score: number | null): "default" | "secondary" | "destructive" {
  if (score == null) return "secondary";
  if (score >= 80) return "default";
  if (score >= 60) return "secondary";
  return "destructive";
}

interface StartApplicationFormProps {
  job: JobRow;
  resumes: ResumeRow[];
  versions: ResumeVersionSummary[];
  letters: CoverLetterSummary[];
}

/**
 * Selection step before an application exists — nothing is persisted until
 * "Prepare Application" is clicked. Shows each candidate version's already-
 * computed ATS score (from lib/ats/analyze.ts via the Resume Optimizer) —
 * this does not re-run the scoring engine.
 */
export function StartApplicationForm({ job, resumes, versions, letters }: StartApplicationFormProps) {
  const router = useRouter();
  const [selectedResumeId, setSelectedResumeId] = React.useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = React.useState<string | null>(null);
  const [selectedLetterId, setSelectedLetterId] = React.useState<string | null>(null);
  const [isPreparing, setIsPreparing] = React.useState(false);

  const selectedVersion = versions.find((v) => v.id === selectedVersionId) ?? null;

  async function handlePrepare() {
    setIsPreparing(true);

    const result = await createApplicationAction({
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      jobUrl: job.url ?? "",
      location: job.location ?? "",
      salary: job.salary ?? "",
      status: "Preparing",
      resumeId: selectedResumeId ?? undefined,
      resumeVersionId: selectedVersionId ?? undefined,
      coverLetterId: selectedLetterId ?? undefined,
    });

    setIsPreparing(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    router.push(`/dashboard/apply-assistant?applicationId=${result.data.id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{job.title}</h2>
        <p className="text-muted-foreground text-sm">
          {job.company}
          {job.location && ` · ${job.location}`}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resume</CardTitle>
          <CardDescription>Pick the resume — and optionally an optimized version — to use for this application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ResumeVersionSelect
            resumes={resumes}
            versions={versions}
            selectedResumeId={selectedResumeId}
            selectedSourceVersionId={selectedVersionId}
            onSelectResume={(resume) => {
              setSelectedResumeId(resume.id);
              setSelectedVersionId(null);
            }}
            onSelectSourceVersion={setSelectedVersionId}
            sourceLabel="Use version"
          />
          {selectedVersion?.atsScoreOptimized != null && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">ATS score for this version:</span>
              <Badge variant={scoreBadgeVariant(selectedVersion.atsScoreOptimized)}>{selectedVersion.atsScoreOptimized}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cover letter</CardTitle>
          <CardDescription>Optional — attach a previously generated cover letter.</CardDescription>
        </CardHeader>
        <CardContent>
          {letters.length === 0 ? (
            <p className="text-muted-foreground text-sm">No cover letters yet — you can generate one from the Cover Letter tab.</p>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setSelectedLetterId(null)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                  selectedLetterId === null ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                )}
              >
                <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
                  <Mail className="size-4" />
                </div>
                <p className="text-sm font-medium">None</p>
                {selectedLetterId === null && <CheckCircle2 className="text-primary ml-auto size-4 shrink-0" />}
              </button>
              {letters.map((letter) => {
                const selected = letter.id === selectedLetterId;
                return (
                  <button
                    key={letter.id}
                    type="button"
                    onClick={() => setSelectedLetterId(letter.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                      selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                    )}
                  >
                    <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
                      <Mail className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{letter.jobTitle}</p>
                      {letter.company && <p className="text-muted-foreground truncate text-xs">{letter.company}</p>}
                    </div>
                    {selected && <CheckCircle2 className="text-primary size-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Button type="button" onClick={handlePrepare} disabled={isPreparing}>
        {isPreparing ? <Loader2 className="size-4 animate-spin" /> : null}
        Prepare Application
      </Button>
    </div>
  );
}
