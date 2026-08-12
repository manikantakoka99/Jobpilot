"use client";

import * as React from "react";
import { UploadCloud, FileText, X, Loader2, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/format";
import { MAX_RESUME_SIZE_LABEL, validateResumeFileMeta, type ResumeFileType } from "@/lib/ats/file-validation";
import { uploadResumeAction } from "@/app/dashboard/ats-analyzer/actions";

export interface UploadedResume {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: ResumeFileType;
}

interface ResumeDropzoneProps {
  onUploaded: (resume: UploadedResume) => void;
  onCleared: () => void;
  disabled?: boolean;
}

type Status = "uploading" | "success" | "error";

/** Drag-and-drop + browse resume upload. Validates client-side for instant feedback, then uploads via a Server Action. */
export function ResumeDropzone({ onUploaded, onCleared, disabled }: ResumeDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [status, setStatus] = React.useState<Status | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<{ fileName: string; fileSize: number } | null>(null);

  async function handleFiles(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file || disabled) return;

    setSelected({ fileName: file.name, fileSize: file.size });

    const meta = validateResumeFileMeta(file);
    if (!meta.ok) {
      setStatus("error");
      setError(meta.error);
      return;
    }

    setStatus("uploading");
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadResumeAction(formData);
    if (!result.success) {
      setStatus("error");
      setError(result.error);
      return;
    }

    setStatus("success");
    onUploaded({ id: result.data.resumeId, fileName: file.name, fileSize: file.size, fileType: meta.fileType });
  }

  function handleRemove() {
    setStatus(null);
    setError(null);
    setSelected(null);
    if (inputRef.current) inputRef.current.value = "";
    onCleared();
  }

  if (selected && status) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border p-3.5 transition-colors",
          status === "success" && "border-emerald-500/30 bg-emerald-500/5",
          status === "error" && "border-destructive/30 bg-destructive/5",
          status === "uploading" && "border-border bg-muted/30",
        )}
      >
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            status === "success" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
            status === "error" && "bg-destructive/15 text-destructive",
            status === "uploading" && "bg-muted text-muted-foreground",
          )}
        >
          {status === "uploading" && <Loader2 className="size-4 animate-spin" />}
          {status === "success" && <CheckCircle2 className="size-4" />}
          {status === "error" && <FileText className="size-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{selected.fileName}</p>
          <p className={cn("text-xs", status === "error" ? "text-destructive" : "text-muted-foreground")}>
            {status === "uploading" && "Uploading and extracting text…"}
            {status === "success" && `${formatFileSize(selected.fileSize)} · Ready to analyze`}
            {status === "error" && error}
          </p>
        </div>
        {status !== "uploading" && (
          <Button type="button" variant="ghost" size="icon-sm" onClick={handleRemove} aria-label="Remove file">
            <X className="size-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragActive(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragActive(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        void handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
        dragActive ? "border-primary bg-primary/5" : "border-border",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-full">
        <UploadCloud className="size-5" />
      </div>
      <p className="text-sm font-medium">Drag & drop your resume here</p>
      <p className="text-muted-foreground text-xs">PDF or DOCX, up to {MAX_RESUME_SIZE_LABEL}</p>
      <Button type="button" variant="outline" size="sm" className="mt-1" onClick={() => inputRef.current?.click()}>
        Browse files
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
        aria-label="Upload resume file"
      />
    </div>
  );
}
