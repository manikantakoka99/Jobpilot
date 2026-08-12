"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Download, ArrowRight, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScoreGauge, scoreTone } from "@/components/ats/score-gauge";
import { cn } from "@/lib/utils";
import { downloadTextFile } from "@/lib/download";
import { saveResumeVersionAction } from "@/app/dashboard/resume-optimizer/actions";
import type { OptimizePreview } from "@/services/resume-optimizer-service";

export function OptimizationResult({ preview }: { preview: OptimizePreview }) {
  const router = useRouter();
  const [versionName, setVersionName] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [savedVersionId, setSavedVersionId] = React.useState<string | null>(null);

  const originalTone = scoreTone(preview.atsScoreOriginal);
  const optimizedTone = scoreTone(preview.atsScoreOptimized);
  const deltaLabel = preview.atsScoreDelta > 0 ? `+${preview.atsScoreDelta}` : `${preview.atsScoreDelta}`;

  async function handleSave() {
    if (savedVersionId || isSaving) return;
    setIsSaving(true);

    const result = await saveResumeVersionAction({
      resumeId: preview.resumeId,
      sourceVersionId: preview.sourceVersionId ?? undefined,
      versionName: versionName.trim() || undefined,
      targetJobTitle: preview.targetJobTitle,
      targetCompany: preview.targetCompany ?? undefined,
      jobDescription: preview.jobDescription,
      content: preview.optimizedText,
      changeSummary: preview.changes,
      atsScoreOriginal: preview.atsScoreOriginal,
      atsScoreOptimized: preview.atsScoreOptimized,
      remainingMissingKeywords: preview.remainingMissingKeywords,
      remainingIssues: preview.remainingIssues,
    });

    setIsSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setSavedVersionId(result.data.versionId);
    toast.success("Saved as a new resume version");
  }

  function handleDownload() {
    const fileName = `${preview.resumeFileName.replace(/\.[^.]+$/, "")}-optimized.txt`;
    downloadTextFile(fileName, preview.optimizedText);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="grid gap-6 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div className="flex flex-col items-center gap-2">
            <ScoreGauge score={preview.atsScoreOriginal} size={104} />
            <Badge variant="outline" className={cn("bg-transparent", originalTone.text)}>
              Original
            </Badge>
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <ArrowRight className="text-muted-foreground size-5" />
            <Badge variant={preview.atsScoreDelta > 0 ? "default" : "secondary"}>{deltaLabel} points</Badge>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ScoreGauge score={preview.atsScoreOptimized} size={104} />
            <Badge variant="outline" className={cn("bg-transparent", optimizedTone.text)}>
              Optimized
            </Badge>
          </div>
        </CardContent>
        <CardContent className="pt-0">
          <p className="text-muted-foreground text-center text-xs text-pretty">
            Both scores are computed with the same deterministic ATS engine used in the ATS Analyzer — nothing here is a
            manufactured or AI-claimed score.
          </p>
        </CardContent>
      </Card>

      {preview.changes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Changes ({preview.changes.length})</CardTitle>
            <CardDescription>Every change is grounded in your existing resume content — nothing invented.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {preview.changes.map((change, i) => (
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

      {preview.unsupportedRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Consider adding — if true</CardTitle>
            <CardDescription>
              The job description suggests these, but nothing in your resume supports them. Only add what you genuinely
              have experience with.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {preview.unsupportedRecommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-1.5 text-sm text-pretty">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {(preview.remainingMissingKeywords.length > 0 || preview.remainingIssues.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Still remaining</CardTitle>
            <CardDescription>What the re-analysis still flags after optimization.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {preview.remainingMissingKeywords.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium">Missing keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {preview.remainingMissingKeywords.map((kw) => (
                    <Badge key={kw} variant="outline" className="border-destructive/30 text-destructive">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {preview.remainingIssues.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium">Issues</p>
                <ul className="space-y-1.5">
                  {preview.remainingIssues.map((issue) => (
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
          <CardTitle>Save this version</CardTitle>
          <CardDescription>Saved as a brand-new version — your original resume is never overwritten.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {savedVersionId ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" /> Saved.
              </p>
              <Button type="button" variant="outline" size="sm" onClick={() => router.push(`/dashboard/resume-optimizer/versions/${savedVersionId}`)}>
                View version
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => router.push("/dashboard/resume-optimizer/versions")}>
                All versions
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="versionName">Version name (optional)</Label>
                <Input
                  id="versionName"
                  placeholder="e.g. Backend Engineer @ Acme"
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  disabled={isSaving}
                  maxLength={120}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  {isSaving ? "Saving…" : "Save as New Version"}
                </Button>
                <Button type="button" variant="outline" onClick={handleDownload}>
                  <Download className="size-4" /> Download .txt
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
