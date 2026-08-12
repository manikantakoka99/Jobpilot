"use client";

import { FileText, CheckCircle2, AlertTriangle, GitBranch } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatFileSize, formatDateTime } from "@/lib/format";
import type { ResumeRow } from "@/types/database";
import type { ResumeVersionSummary } from "@/services/resume-optimizer-service";

interface ResumeVersionSelectProps {
  resumes: ResumeRow[];
  versions: ResumeVersionSummary[];
  selectedResumeId: string | null;
  selectedSourceVersionId: string | null;
  onSelectResume: (resume: ResumeRow) => void;
  onSelectSourceVersion: (versionId: string | null) => void;
  sourceLabel?: string;
}

/** Pick a base resume, then optionally pick a previously-generated version of it (e.g. to optimize further, or to ground a cover letter). */
export function ResumeVersionSelect({
  resumes,
  versions,
  selectedResumeId,
  selectedSourceVersionId,
  onSelectResume,
  onSelectSourceVersion,
  sourceLabel = "Optimize from",
}: ResumeVersionSelectProps) {
  const versionsForResume = versions.filter((v) => v.resumeId === selectedResumeId);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {resumes.map((resume) => {
          const usable = resume.text_extraction_status === "success";
          const selected = resume.id === selectedResumeId;
          return (
            <button
              key={resume.id}
              type="button"
              disabled={!usable}
              onClick={() => onSelectResume(resume)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                !usable && "cursor-not-allowed opacity-50",
              )}
            >
              <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{resume.file_name}</p>
                <p className="text-muted-foreground text-xs">
                  {formatFileSize(resume.file_size)} · Uploaded {formatDateTime(resume.created_at)}
                  {!usable && " · No extractable text"}
                </p>
              </div>
              {selected && <CheckCircle2 className="text-primary size-4 shrink-0" />}
              {!usable && <AlertTriangle className="text-muted-foreground size-4 shrink-0" />}
            </button>
          );
        })}
      </div>

      {selectedResumeId && versionsForResume.length > 0 && (
        <div className="space-y-2">
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
            <GitBranch className="size-3.5" /> {sourceLabel}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onSelectSourceVersion(null)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                selectedSourceVersionId === null ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              Original resume
            </button>
            {versionsForResume.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelectSourceVersion(v.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  selectedSourceVersionId === v.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {v.versionName || `Version ${v.versionNumber}`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
