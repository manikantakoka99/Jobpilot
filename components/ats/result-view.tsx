import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  FileText,
  Calendar,
  GraduationCap,
  BriefcaseBusiness,
  BookOpenText,
  LayoutList,
  Sparkles,
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreGauge, scoreTone } from "@/components/ats/score-gauge";
import { ExpandableList } from "@/components/ats/expandable-list";
import { AnalysisDeleteButton } from "@/components/ats/analysis-delete-button";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AnalysisView } from "@/services/analysis-service";
import type { ScoreBreakdown, RecommendationPriority } from "@/lib/ats/types";

const SCORE_ROWS: { key: keyof ScoreBreakdown; label: string; weight: number }[] = [
  { key: "keywordMatch", label: "Keyword Match", weight: 35 },
  { key: "skillsMatch", label: "Skills Match", weight: 25 },
  { key: "experienceAlignment", label: "Experience Alignment", weight: 15 },
  { key: "educationCertification", label: "Education & Certifications", weight: 10 },
  { key: "resumeStructure", label: "Resume Structure", weight: 10 },
  { key: "readability", label: "Readability", weight: 5 },
];

const PRIORITY_META: Record<RecommendationPriority, { label: string; icon: typeof AlertCircle; className: string }> = {
  high: { label: "High priority", icon: AlertCircle, className: "text-destructive bg-destructive/10" },
  medium: { label: "Medium priority", icon: AlertTriangle, className: "text-amber-600 bg-amber-500/10 dark:text-amber-400" },
  low: { label: "Low priority", icon: Info, className: "text-muted-foreground bg-muted" },
};

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon: typeof FileText;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-md">
            <Icon className="size-3.5" />
          </div>
          <CardTitle>{title}</CardTitle>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function ResultView({ analysis }: { analysis: AnalysisView }) {
  const tone = scoreTone(analysis.atsScore);
  const recommendationsByPriority: Record<RecommendationPriority, typeof analysis.recommendations> = {
    high: analysis.recommendations.filter((r) => r.priority === "high"),
    medium: analysis.recommendations.filter((r) => r.priority === "medium"),
    low: analysis.recommendations.filter((r) => r.priority === "low"),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className="truncate text-xl font-semibold tracking-tight">{analysis.jobTitle || "Untitled position"}</h2>
          <p className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="inline-flex items-center gap-1">
              <FileText className="size-3.5" /> {analysis.resumeFileName}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3.5" /> {formatDateTime(analysis.createdAt)}
            </span>
          </p>
        </div>
        <AnalysisDeleteButton analysisId={analysis.id} />
      </div>

      <Card>
        <CardContent className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="flex flex-col items-center gap-2">
            <ScoreGauge score={analysis.atsScore} />
            <Badge className={cn("gap-1", tone.text, "bg-transparent")} variant="outline">
              {tone.label}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium">How this score is calculated</p>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed text-pretty">
              Your ATS score is computed deterministically from six weighted categories — no AI model or guesswork
              involved. Each category is scored 0–100, then combined using its fixed weight below.
            </p>
            <div className="mt-4 space-y-2.5">
              {SCORE_ROWS.map(({ key, label, weight }) => {
                const value = Math.round(analysis.scoreBreakdown?.[key] ?? 0);
                return (
                  <div key={key}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium">
                        {label} <span className="text-muted-foreground font-normal">({weight}%)</span>
                      </span>
                      <span className="text-muted-foreground">{value}/100</span>
                    </div>
                    <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                      <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${value}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Keyword match"
          description={`${analysis.keywordMatchPercentage}% of identified keywords from the job description were found in your resume.`}
          icon={LayoutList}
        >
          <div className="space-y-4">
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium">
                <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" /> Matched (
                {analysis.matchedKeywords.length})
              </p>
              {analysis.matchedKeywords.length === 0 ? (
                <p className="text-muted-foreground text-xs">No overlapping keywords found.</p>
              ) : (
                <ExpandableList
                  items={analysis.matchedKeywords}
                  renderItem={(keyword) => (
                    <Badge key={keyword} variant="secondary">
                      {keyword}
                    </Badge>
                  )}
                />
              )}
            </div>
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium">
                <XCircle className="text-destructive size-3.5" /> Missing ({analysis.missingKeywords.length})
              </p>
              {analysis.missingKeywords.length === 0 ? (
                <p className="text-muted-foreground text-xs">No gaps found — great coverage.</p>
              ) : (
                <ExpandableList
                  items={analysis.missingKeywords}
                  renderItem={(keyword) => (
                    <Badge key={keyword} variant="outline" className="border-destructive/30 text-destructive">
                      {keyword}
                    </Badge>
                  )}
                />
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Skills" description="Skills recognized from a curated technical skill dictionary." icon={BriefcaseBusiness}>
          <div className="space-y-4">
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium">
                <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" /> Found ({analysis.skillsFound.length})
              </p>
              {analysis.skillsFound.length === 0 ? (
                <p className="text-muted-foreground text-xs">No recognized skills found in your resume.</p>
              ) : (
                <ExpandableList
                  items={analysis.skillsFound}
                  renderItem={(skill) => (
                    <Badge key={skill.name} variant="secondary">
                      {skill.name}
                    </Badge>
                  )}
                />
              )}
            </div>
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium">
                <XCircle className="text-destructive size-3.5" /> Missing ({analysis.skillsMissing.length})
              </p>
              {analysis.skillsMissing.length === 0 ? (
                <p className="text-muted-foreground text-xs">No required skills appear to be missing.</p>
              ) : (
                <ExpandableList
                  items={analysis.skillsMissing}
                  renderItem={(skill) => (
                    <Badge key={skill.name} variant="outline" className="border-destructive/30 text-destructive">
                      {skill.name}
                    </Badge>
                  )}
                />
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Resume structure" description="Common resume sections and text-level formatting checks." icon={LayoutList}>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium">Detected sections</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.detectedSections.map((section) => (
                  <Badge key={section} variant="secondary">
                    {section}
                  </Badge>
                ))}
              </div>
            </div>
            {analysis.structureIssues.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium">Structure issues</p>
                <ul className="space-y-1.5">
                  {analysis.structureIssues.map((issue) => (
                    <li key={issue} className="text-muted-foreground flex items-start gap-1.5 text-xs">
                      <AlertTriangle className="mt-0.5 size-3 shrink-0 text-amber-500" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.formattingIssues.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium">Formatting notes</p>
                <ul className="space-y-1.5">
                  {analysis.formattingIssues.map((issue) => (
                    <li key={issue} className="text-muted-foreground flex items-start gap-1.5 text-xs">
                      <Info className="mt-0.5 size-3 shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Readability" description="Plain text-level signals — not a visual layout review." icon={BookOpenText}>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Word count</p>
              <p className="font-medium">{analysis.readability?.wordCount ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Avg. sentence length</p>
              <p className="font-medium">{analysis.readability?.averageSentenceLength ?? "—"} words</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Contact info detected</p>
              <p className="font-medium">{analysis.readability?.hasContactInfo ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Score</p>
              <p className="font-medium">{Math.round(analysis.readability?.score ?? 0)}/100</p>
            </div>
          </div>
          {(analysis.readability?.notes?.length ?? 0) > 0 && (
            <ul className="mt-4 space-y-1.5">
              {analysis.readability.notes.map((note) => (
                <li key={note} className="text-muted-foreground flex items-start gap-1.5 text-xs">
                  <Info className="mt-0.5 size-3 shrink-0" />
                  {note}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Experience alignment" icon={BriefcaseBusiness}>
          <div className="space-y-2">
            <p className="text-sm">{analysis.experience?.detail}</p>
            <p className="text-muted-foreground text-xs">Score: {Math.round(analysis.experience?.score ?? 0)}/100</p>
          </div>
        </SectionCard>

        <SectionCard title="Education & certifications" icon={GraduationCap}>
          <div className="space-y-3">
            {(analysis.education?.requirements?.length ?? 0) === 0 ? (
              <p className="text-muted-foreground text-sm">No explicit education or certification requirements were detected in the job description.</p>
            ) : (
              <>
                <div>
                  <p className="mb-1.5 text-xs font-medium">Met</p>
                  {(analysis.education?.met?.length ?? 0) === 0 ? (
                    <p className="text-muted-foreground text-xs">None detected in your resume.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.education.met.map((item) => (
                        <Badge key={item} variant="secondary">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                {(analysis.education?.missing?.length ?? 0) > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium">Missing</p>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.education.missing.map((item) => (
                        <Badge key={item} variant="outline" className="border-destructive/30 text-destructive">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            <p className="text-muted-foreground text-xs">Score: {Math.round(analysis.education?.score ?? 0)}/100</p>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Recommendations" description="Grounded in your actual resume and job description — nothing fabricated." icon={Sparkles}>
        <div className="space-y-5">
          {(["high", "medium", "low"] as const).map((priority) => {
            const items = recommendationsByPriority[priority];
            if (items.length === 0) return null;
            const meta = PRIORITY_META[priority];
            return (
              <div key={priority}>
                <p className={cn("mb-2 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium", meta.className)}>
                  <meta.icon className="size-3.5" /> {meta.label}
                </p>
                <ul className="space-y-2">
                  {items.map((rec, i) => (
                    <li key={i} className="text-sm leading-relaxed text-pretty">
                      {rec.message}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {analysis.recommendations.length === 0 && (
            <p className="text-muted-foreground text-sm">No specific recommendations — your resume looks well aligned with this job description.</p>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
