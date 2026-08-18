"use client";

import * as React from "react";
import { FileText, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ConfirmDeleteButton } from "@/components/ats/confirm-delete-button";
import { deleteResumeAction } from "@/app/dashboard/ats-analyzer/actions";
import { getResumeUrlAction } from "@/app/dashboard/documents/actions";
import { formatFileSize, formatDateTime } from "@/lib/format";
import type { ResumeRow } from "@/types/database";

const STATUS_LABEL: Record<ResumeRow["text_extraction_status"], { label: string; variant: "secondary" | "destructive" | "outline" }> = {
  success: { label: "Ready", variant: "secondary" },
  pending: { label: "Processing", variant: "outline" },
  no_text_layer: { label: "No text layer", variant: "destructive" },
  password_protected: { label: "Password protected", variant: "destructive" },
  failed: { label: "Extraction failed", variant: "destructive" },
};

/** Original uploaded resume files — reuses ats-analyzer's deleteResumeAction and resume-service's signed-URL helper, no new storage logic. */
export function DocumentResumes({ resumes: initialResumes }: { resumes: ResumeRow[] }) {
  const [resumes, setResumes] = React.useState(initialResumes);
  const [openingId, setOpeningId] = React.useState<string | null>(null);

  async function handleOpen(resumeId: string) {
    setOpeningId(resumeId);
    const result = await getResumeUrlAction(resumeId);
    setOpeningId(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    window.open(result.data.url, "_blank", "noopener,noreferrer");
  }

  if (resumes.length === 0) {
    return (
      <Card>
        <EmptyState icon={FileText} title="No resumes uploaded yet" description="Upload a resume from the ATS Analyzer to see it here." />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {resumes.map((resume) => {
        const status = STATUS_LABEL[resume.text_extraction_status];
        return (
          <Card key={resume.id} className="flex flex-row flex-wrap items-center gap-3 p-4">
            <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
              <FileText className="size-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{resume.file_name}</p>
              <p className="text-muted-foreground text-xs">
                {formatFileSize(resume.file_size)} · Uploaded {formatDateTime(resume.created_at)}
              </p>
            </div>
            <Badge variant={status.variant} className="shrink-0">
              {status.label}
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              disabled={openingId === resume.id}
              onClick={() => handleOpen(resume.id)}
            >
              {openingId === resume.id ? <Loader2 className="size-3.5 animate-spin" /> : <ExternalLink className="size-3.5" />}
              Open
            </Button>
            <ConfirmDeleteButton
              action={() => deleteResumeAction(resume.id)}
              successMessage="Resume deleted"
              onDeleted={() => setResumes((prev) => prev.filter((r) => r.id !== resume.id))}
            />
          </Card>
        );
      })}
    </div>
  );
}
