"use client";

import { FileText, CheckCircle2, AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatFileSize, formatDateTime } from "@/lib/format";
import type { ResumeRow } from "@/types/database";

interface ExistingResumePickerProps {
  resumes: ResumeRow[];
  selectedId: string | null;
  onSelect: (resume: ResumeRow) => void;
}

/** A selectable list of previously-uploaded resumes. Resumes without extracted text can't be selected. */
export function ExistingResumePicker({ resumes, selectedId, onSelect }: ExistingResumePickerProps) {
  return (
    <div className="space-y-2">
      {resumes.map((resume) => {
        const usable = resume.text_extraction_status === "success";
        const selected = resume.id === selectedId;
        return (
          <button
            key={resume.id}
            type="button"
            disabled={!usable}
            onClick={() => onSelect(resume)}
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
  );
}
