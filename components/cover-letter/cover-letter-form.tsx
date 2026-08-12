"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, PenLine, RefreshCw, Copy, Download, Save, FileText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/dashboard/empty-state";
import { cn } from "@/lib/utils";
import { downloadTextFile } from "@/lib/download";
import { ResumeVersionSelect } from "@/components/optimizer/resume-version-select";
import { generateCoverLetterAction, saveCoverLetterAction } from "@/app/dashboard/cover-letter/actions";
import type { ResumeRow } from "@/types/database";
import type { ResumeVersionSummary } from "@/services/resume-optimizer-service";
import type { CoverLetterTone } from "@/lib/ai/types";

const MIN_JD_LENGTH = 50;

const TONES: { value: CoverLetterTone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "concise", label: "Concise" },
  { value: "confident", label: "Confident" },
  { value: "friendly", label: "Friendly" },
];

interface CoverLetterFormProps {
  resumes: ResumeRow[];
  versions: ResumeVersionSummary[];
}

export function CoverLetterForm({ resumes, versions }: CoverLetterFormProps) {
  const router = useRouter();

  const [selectedResumeId, setSelectedResumeId] = React.useState<string | null>(null);
  const [selectedResumeVersionId, setSelectedResumeVersionId] = React.useState<string | null>(null);
  const [jobTitle, setJobTitle] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [jobDescription, setJobDescription] = React.useState("");
  const [tone, setTone] = React.useState<CoverLetterTone>("professional");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [content, setContent] = React.useState<string | null>(null);
  const [savedId, setSavedId] = React.useState<string | null>(null);

  const jdLength = jobDescription.trim().length;
  const canGenerate = Boolean(selectedResumeId) && jobTitle.trim().length > 0 && jdLength >= MIN_JD_LENGTH && !isGenerating;

  function handleSelectResume(resume: ResumeRow) {
    setSelectedResumeId(resume.id);
    setSelectedResumeVersionId(null);
  }

  async function handleGenerate() {
    if (!selectedResumeId || !canGenerate) return;
    setIsGenerating(true);
    setError(null);
    setSavedId(null);

    const result = await generateCoverLetterAction({
      resumeId: selectedResumeId,
      resumeVersionId: selectedResumeVersionId ?? undefined,
      jobTitle,
      company: company.trim() || undefined,
      jobDescription,
      tone,
    });

    setIsGenerating(false);

    if (!result.success) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    setContent(result.data.content);
    toast.success("Cover letter generated");
  }

  async function handleSave() {
    if (!selectedResumeId || content == null || isSaving) return;
    setIsSaving(true);

    const result = await saveCoverLetterAction({
      resumeId: selectedResumeId,
      resumeVersionId: selectedResumeVersionId ?? undefined,
      jobTitle,
      company: company.trim() || undefined,
      jobDescription,
      tone,
      content,
    });

    setIsSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setSavedId(result.data.coverLetterId);
    toast.success("Cover letter saved");
  }

  function handleCopy() {
    if (content == null) return;
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  }

  function handleDownload() {
    if (content == null) return;
    downloadTextFile(`cover-letter-${jobTitle.trim().toLowerCase().replace(/\s+/g, "-") || "draft"}.txt`, content);
  }

  if (resumes.length === 0) {
    return (
      <Card>
        <EmptyState icon={FileText} title="Upload a resume first" description="Head to the ATS Analyzer to upload a resume before generating a cover letter." />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Resume</CardTitle>
          <CardDescription>Pick the resume (or a saved version of it) to ground the letter in.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResumeVersionSelect
            resumes={resumes}
            versions={versions}
            selectedResumeId={selectedResumeId}
            selectedSourceVersionId={selectedResumeVersionId}
            onSelectResume={handleSelectResume}
            onSelectSourceVersion={setSelectedResumeVersionId}
            sourceLabel="Base on version"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Job details</CardTitle>
          <CardDescription>Paste the job posting you&apos;re applying to.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job title</Label>
              <Input
                id="jobTitle"
                placeholder="e.g. Senior Backend Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                disabled={isGenerating}
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
                disabled={isGenerating}
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
              disabled={isGenerating}
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
          <CardTitle>3. Tone (optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {TONES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTone(t.value)}
                disabled={isGenerating}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  tone === t.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">{selectedResumeId ? "Ready to generate." : "Select a resume to continue."}</p>
        <Button type="button" size="lg" onClick={handleGenerate} disabled={!canGenerate}>
          {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <PenLine className="size-4" />}
          {isGenerating ? "Generating cover letter…" : content ? "Regenerate" : "Generate Cover Letter"}
        </Button>
      </div>

      {content != null && (
        <Card>
          <CardHeader>
            <CardTitle>Your cover letter</CardTitle>
            <CardDescription>Editable — your exact edits are what gets saved.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setSavedId(null);
              }}
              className="min-h-72"
              maxLength={8000}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {isSaving ? "Saving…" : "Save"}
              </Button>
              <Button type="button" variant="outline" onClick={handleGenerate} disabled={isGenerating}>
                <RefreshCw className="size-4" /> Regenerate
              </Button>
              <Button type="button" variant="outline" onClick={handleCopy}>
                <Copy className="size-4" /> Copy
              </Button>
              <Button type="button" variant="outline" onClick={handleDownload}>
                <Download className="size-4" /> Download .txt
              </Button>
            </div>
            {savedId && (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-emerald-600 dark:text-emerald-400">Saved.</p>
                <Button type="button" variant="ghost" size="sm" onClick={() => router.push(`/dashboard/cover-letter/${savedId}`)}>
                  View saved letter
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
