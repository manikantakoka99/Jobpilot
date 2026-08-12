"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Calendar, Copy, Download, Loader2, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDeleteButton } from "@/components/ats/confirm-delete-button";
import { generateCoverLetterAction, updateCoverLetterAction, deleteCoverLetterAction } from "@/app/dashboard/cover-letter/actions";
import { formatDateTime } from "@/lib/format";
import { downloadTextFile } from "@/lib/download";
import type { CoverLetterRow } from "@/types/database";

const TONE_LABELS: Record<string, string> = {
  professional: "Professional",
  concise: "Concise",
  confident: "Confident",
  friendly: "Friendly",
};

export function CoverLetterDetail({ letter }: { letter: CoverLetterRow }) {
  const router = useRouter();
  const [content, setContent] = React.useState(letter.content);
  const [isDirty, setIsDirty] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isRegenerating, setIsRegenerating] = React.useState(false);

  async function handleSave() {
    if (isSaving) return;
    setIsSaving(true);

    const result = await updateCoverLetterAction({ id: letter.id, content });

    setIsSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setIsDirty(false);
    toast.success("Saved");
  }

  async function handleRegenerate() {
    if (isRegenerating) return;
    setIsRegenerating(true);

    const result = await generateCoverLetterAction({
      resumeId: letter.resume_id,
      resumeVersionId: letter.resume_version_id ?? undefined,
      jobTitle: letter.job_title,
      company: letter.company ?? undefined,
      jobDescription: letter.job_description,
      tone: letter.tone,
    });

    setIsRegenerating(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setContent(result.data.content);
    setIsDirty(true);
    toast.success("Regenerated — remember to save if you want to keep this version");
  }

  function handleCopy() {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  }

  function handleDownload() {
    downloadTextFile(`cover-letter-${letter.job_title.toLowerCase().replace(/\s+/g, "-")}.txt`, content);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className="truncate text-xl font-semibold tracking-tight">
            {letter.job_title}
            {letter.company && <span className="text-muted-foreground font-normal"> @ {letter.company}</span>}
          </h2>
          <p className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3.5" /> {formatDateTime(letter.created_at)}
            </span>
            <Badge variant="outline">{TONE_LABELS[letter.tone] ?? letter.tone}</Badge>
          </p>
        </div>
        <ConfirmDeleteButton
          action={() => deleteCoverLetterAction(letter.id)}
          label="Delete letter"
          successMessage="Cover letter deleted"
          onDeleted={() => router.push("/dashboard/cover-letter/history")}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
          <CardDescription>Editable — your exact edits are what gets saved.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setIsDirty(true);
            }}
            className="min-h-72"
            maxLength={8000}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handleSave} disabled={isSaving || !isDirty}>
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
            <Button type="button" variant="outline" onClick={handleRegenerate} disabled={isRegenerating}>
              {isRegenerating ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Regenerate
            </Button>
            <Button type="button" variant="outline" onClick={handleCopy}>
              <Copy className="size-4" /> Copy
            </Button>
            <Button type="button" variant="outline" onClick={handleDownload}>
              <Download className="size-4" /> Download .txt
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
