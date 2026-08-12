"use client";

import * as React from "react";
import { Loader2, Sparkles, FileText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/dashboard/empty-state";
import { cn } from "@/lib/utils";
import { ResumeVersionSelect } from "@/components/optimizer/resume-version-select";
import { OptimizationResult } from "@/components/optimizer/optimization-result";
import { optimizeResumeAction } from "@/app/dashboard/resume-optimizer/actions";
import type { ResumeRow } from "@/types/database";
import type { ResumeVersionSummary, OptimizePreview } from "@/services/resume-optimizer-service";

const MIN_JD_LENGTH = 50;

interface OptimizerFormProps {
  resumes: ResumeRow[];
  versions: ResumeVersionSummary[];
}

export function OptimizerForm({ resumes, versions }: OptimizerFormProps) {
  const [selectedResumeId, setSelectedResumeId] = React.useState<string | null>(null);
  const [selectedSourceVersionId, setSelectedSourceVersionId] = React.useState<string | null>(null);
  const [jobTitle, setJobTitle] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [jobDescription, setJobDescription] = React.useState("");
  const [useAtsContext, setUseAtsContext] = React.useState(true);
  const [isOptimizing, setIsOptimizing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<OptimizePreview | null>(null);

  const jdLength = jobDescription.trim().length;
  const canOptimize = Boolean(selectedResumeId) && jobTitle.trim().length > 0 && jdLength >= MIN_JD_LENGTH && !isOptimizing;

  function handleSelectResume(resume: ResumeRow) {
    setSelectedResumeId(resume.id);
    setSelectedSourceVersionId(null);
    setPreview(null);
  }

  async function handleOptimize() {
    if (!selectedResumeId || !canOptimize) return;
    setIsOptimizing(true);
    setError(null);
    setPreview(null);

    const result = await optimizeResumeAction({
      resumeId: selectedResumeId,
      sourceVersionId: selectedSourceVersionId ?? undefined,
      targetJobTitle: jobTitle,
      targetCompany: company.trim() || undefined,
      jobDescription,
      useAtsContext,
    });

    setIsOptimizing(false);

    if (!result.success) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    setPreview(result.data);
    toast.success("Optimization complete");
  }

  if (resumes.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={FileText}
          title="Upload a resume first"
          description="Head to the ATS Analyzer to upload a resume before optimizing it."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Resume</CardTitle>
          <CardDescription>Pick the resume to optimize — or continue from a previously-generated version.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResumeVersionSelect
            resumes={resumes}
            versions={versions}
            selectedResumeId={selectedResumeId}
            selectedSourceVersionId={selectedSourceVersionId}
            onSelectResume={handleSelectResume}
            onSelectSourceVersion={setSelectedSourceVersionId}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Target role</CardTitle>
          <CardDescription>Tell us what you&apos;re applying for so the rewrite can align with it.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="targetJobTitle">Job title</Label>
              <Input
                id="targetJobTitle"
                placeholder="e.g. Senior Backend Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                disabled={isOptimizing}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetCompany">Company (optional)</Label>
              <Input
                id="targetCompany"
                placeholder="e.g. Acme Corp"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                disabled={isOptimizing}
                maxLength={200}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="jobDescription">Job description</Label>
            <Textarea
              id="jobDescription"
              placeholder="Paste the full job description here…"
              className="min-h-48"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              disabled={isOptimizing}
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

      <Card>
        <CardHeader>
          <CardTitle>3. ATS context</CardTitle>
          <CardDescription>Feed your existing ATS Analyzer findings in as extra grounding context for the rewrite.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Use ATS analysis as context</p>
              <p className="text-muted-foreground text-xs">
                Re-runs the deterministic ATS engine on your resume first and shares matched/missing keywords, skills,
                and structure issues with the AI.
              </p>
            </div>
            <Switch checked={useAtsContext} onCheckedChange={setUseAtsContext} disabled={isOptimizing} />
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">
          {selectedResumeId ? "Ready to optimize." : "Select a resume to continue."}
        </p>
        <Button type="button" size="lg" onClick={handleOptimize} disabled={!canOptimize}>
          {isOptimizing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {isOptimizing ? "Optimizing resume…" : "Optimize Resume"}
        </Button>
      </div>

      {preview && <OptimizationResult preview={preview} />}
    </div>
  );
}
