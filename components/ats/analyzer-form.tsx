"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, UploadCloud, FolderOpen } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ResumeDropzone, type UploadedResume } from "@/components/ats/resume-dropzone";
import { ExistingResumePicker } from "@/components/ats/existing-resume-picker";
import { analyzeResumeAction } from "@/app/dashboard/ats-analyzer/actions";
import type { ResumeRow } from "@/types/database";

const MIN_JD_LENGTH = 50;

interface AnalyzerFormProps {
  resumes: ResumeRow[];
  initialResumeId?: string;
  /** Pre-fills from a saved job (see /dashboard/jobs "Analyze" action) — the deterministic ATS engine itself is untouched. */
  initialJobTitle?: string;
  initialJobDescription?: string;
}

export function AnalyzerForm({ resumes, initialResumeId, initialJobTitle, initialJobDescription }: AnalyzerFormProps) {
  const router = useRouter();

  const preselected = initialResumeId ? resumes.find((r) => r.id === initialResumeId) : undefined;

  const [mode, setMode] = React.useState<"upload" | "existing">(preselected || resumes.length > 0 ? "existing" : "upload");
  const [selectedResume, setSelectedResume] = React.useState<{ id: string; fileName: string } | null>(
    preselected ? { id: preselected.id, fileName: preselected.file_name } : null,
  );
  const [jobTitle, setJobTitle] = React.useState(initialJobTitle ?? "");
  const [jobDescription, setJobDescription] = React.useState(initialJobDescription ?? "");
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const jdLength = jobDescription.trim().length;
  const canAnalyze = Boolean(selectedResume) && jdLength >= MIN_JD_LENGTH && !isAnalyzing;

  function handleUploaded(resume: UploadedResume) {
    setSelectedResume({ id: resume.id, fileName: resume.fileName });
  }

  function handleExistingSelect(resume: ResumeRow) {
    setSelectedResume({ id: resume.id, fileName: resume.file_name });
  }

  async function handleAnalyze() {
    if (!selectedResume || !canAnalyze) return;
    setIsAnalyzing(true);
    setError(null);

    const result = await analyzeResumeAction({
      resumeId: selectedResume.id,
      jobTitle: jobTitle.trim() || undefined,
      jobDescription,
    });

    if (!result.success) {
      setIsAnalyzing(false);
      setError(result.error);
      toast.error(result.error);
      return;
    }

    toast.success("Analysis complete");
    router.push(`/dashboard/ats-analyzer/results/${result.data.analysisId}`);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>1. Resume</CardTitle>
              <CardDescription>Upload a new resume or reuse one you&apos;ve already uploaded.</CardDescription>
            </div>
            {resumes.length > 0 && (
              <div className="bg-muted flex shrink-0 gap-0.5 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setMode("upload")}
                  disabled={isAnalyzing}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    mode === "upload" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <UploadCloud className="size-3.5" /> Upload new
                </button>
                <button
                  type="button"
                  onClick={() => setMode("existing")}
                  disabled={isAnalyzing}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    mode === "existing" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <FolderOpen className="size-3.5" /> Use existing ({resumes.length})
                </button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {mode === "upload" ? (
            <ResumeDropzone onUploaded={handleUploaded} onCleared={() => setSelectedResume(null)} disabled={isAnalyzing} />
          ) : (
            <ExistingResumePicker resumes={resumes} selectedId={selectedResume?.id ?? null} onSelect={handleExistingSelect} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Job description</CardTitle>
          <CardDescription>
            Paste the job posting you&apos;re targeting. The more complete it is, the more useful the analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job title (optional)</Label>
            <Input
              id="jobTitle"
              placeholder="e.g. Senior Backend Engineer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              disabled={isAnalyzing}
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jobDescription">Job description</Label>
            <Textarea
              id="jobDescription"
              placeholder="Paste the full job description here…"
              className="min-h-48"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              disabled={isAnalyzing}
              maxLength={20000}
            />
            <p className={cn("text-xs", jdLength > 0 && jdLength < MIN_JD_LENGTH ? "text-destructive" : "text-muted-foreground")}>
              {jdLength < MIN_JD_LENGTH
                ? `Paste at least ${MIN_JD_LENGTH} characters (${jdLength}/${MIN_JD_LENGTH}).`
                : `${jdLength.toLocaleString()} characters`}
            </p>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">
          {selectedResume ? `Selected resume: ${selectedResume.fileName}` : "Select or upload a resume to continue."}
        </p>
        <Button type="button" size="lg" onClick={handleAnalyze} disabled={!canAnalyze}>
          {isAnalyzing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {isAnalyzing ? "Analyzing resume against job description…" : "Analyze Resume"}
        </Button>
      </div>
    </div>
  );
}
