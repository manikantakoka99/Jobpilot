"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquarePlus, FileText, Briefcase } from "lucide-react";
import { toast } from "sonner";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/dashboard/empty-state";
import { cn } from "@/lib/utils";
import { ResumeVersionSelect } from "@/components/optimizer/resume-version-select";
import { startInterviewSessionAction } from "@/app/dashboard/interview-prep/actions";
import type { ResumeRow, JobRow } from "@/types/database";
import type { ResumeVersionSummary } from "@/services/resume-optimizer-service";
import type { InterviewMode } from "@/lib/ai/types";

const MODES: { value: InterviewMode; label: string; description: string }[] = [
  { value: "behavioral", label: "Behavioral", description: "STAR-style questions about how you've worked in the past." },
  { value: "technical", label: "Technical", description: "Grounded in your resume's skills, projects, and the job description." },
  { value: "mixed", label: "Mixed", description: "A blend of both — the most realistic full-interview practice." },
];

interface InterviewSetupFormProps {
  resumes: ResumeRow[];
  versions: ResumeVersionSummary[];
  jobs: JobRow[];
}

export function InterviewSetupForm({ resumes, versions, jobs }: InterviewSetupFormProps) {
  const router = useRouter();
  const [selectedResumeId, setSelectedResumeId] = React.useState<string | null>(null);
  const [selectedSourceVersionId, setSelectedSourceVersionId] = React.useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = React.useState<string>("");
  const [jobTitle, setJobTitle] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [jobDescription, setJobDescription] = React.useState("");
  const [mode, setMode] = React.useState<InterviewMode>("mixed");
  const [totalQuestions, setTotalQuestions] = React.useState(5);
  const [isStarting, setIsStarting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const needsResume = mode !== "behavioral";
  const canStart = jobTitle.trim().length > 0 && (!needsResume || Boolean(selectedResumeId)) && !isStarting;

  function handleSelectResume(resume: ResumeRow) {
    setSelectedResumeId(resume.id);
    setSelectedSourceVersionId(null);
  }

  function handleSelectJob(jobId: string) {
    setSelectedJobId(jobId);
    const job = jobs.find((j) => j.id === jobId);
    if (job) {
      setJobTitle(job.title);
      setCompany(job.company);
      setJobDescription(job.description ?? "");
    }
  }

  async function handleStart() {
    if (!canStart) return;
    setIsStarting(true);
    setError(null);

    const result = await startInterviewSessionAction({
      resumeId: selectedSourceVersionId ? undefined : (selectedResumeId ?? undefined),
      resumeVersionId: selectedSourceVersionId ?? undefined,
      jobId: selectedJobId || undefined,
      jobTitle,
      company: company.trim() || undefined,
      jobDescription: jobDescription.trim() || undefined,
      mode,
      totalQuestions,
    });

    setIsStarting(false);

    if (!result.success) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    toast.success("Interview session started");
    router.push(`/dashboard/interview-prep/${result.data.sessionId}`);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Mode</CardTitle>
          <CardDescription>What kind of interview do you want to practice?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  mode === m.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                )}
              >
                <p className="text-sm font-medium">{m.label}</p>
                <p className="text-muted-foreground mt-0.5 text-xs text-pretty">{m.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            2. Resume {needsResume ? "" : "(optional)"}
          </CardTitle>
          <CardDescription>
            {needsResume
              ? "Required for technical questions — grounds them in your real skills and experience."
              : "Optional for a behavioral-only session."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resumes.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No resumes uploaded yet"
              description="Upload a resume from the ATS Analyzer to unlock technical questions."
            />
          ) : (
            <ResumeVersionSelect
              resumes={resumes}
              versions={versions}
              selectedResumeId={selectedResumeId}
              selectedSourceVersionId={selectedSourceVersionId}
              onSelectResume={handleSelectResume}
              onSelectSourceVersion={setSelectedSourceVersionId}
              sourceLabel="Ground questions in"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Target role</CardTitle>
          <CardDescription>Tell us what you&apos;re interviewing for.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {jobs.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="saved-job" className="flex items-center gap-1.5">
                <Briefcase className="size-3.5" /> Prefill from a saved job (optional)
              </Label>
              <select
                id="saved-job"
                value={selectedJobId}
                onChange={(e) => handleSelectJob(e.target.value)}
                disabled={isStarting}
                className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
              >
                <option value="">Type it in manually…</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} @ {job.company}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job title</Label>
              <Input
                id="jobTitle"
                placeholder="e.g. Senior Backend Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                disabled={isStarting}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company (optional)</Label>
              <Input
                id="company"
                placeholder="e.g. Acme Corp"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                disabled={isStarting}
                maxLength={200}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="jobDescription">Job description {needsResume ? "" : "(optional)"}</Label>
            <Textarea
              id="jobDescription"
              placeholder="Paste the job description here — technical questions will be grounded in it plus your resume…"
              className="min-h-32"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              disabled={isStarting}
              maxLength={20000}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalQuestions">Number of questions</Label>
            <Input
              id="totalQuestions"
              type="number"
              min={3}
              max={12}
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(Math.min(12, Math.max(3, Number(e.target.value) || 5)))}
              disabled={isStarting}
              className="w-24"
            />
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">
          {canStart ? "Ready to start." : needsResume && !selectedResumeId ? "Select a resume to continue." : "Enter a job title to continue."}
        </p>
        <Button type="button" size="lg" onClick={handleStart} disabled={!canStart}>
          {isStarting ? <Loader2 className="size-4 animate-spin" /> : <MessageSquarePlus className="size-4" />}
          {isStarting ? "Generating questions…" : "Start Interview"}
        </Button>
      </div>
    </div>
  );
}
