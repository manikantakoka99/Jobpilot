"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, ExternalLink, FileCheck2, Loader2, PenLine, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ConfirmDeleteButton } from "@/components/ats/confirm-delete-button";
import { JobFormSheet } from "@/components/jobs/job-form-sheet";
import { deleteJobAction } from "@/app/dashboard/jobs/actions";
import { createApplicationAction } from "@/app/dashboard/applications/actions";
import { formatDateTime } from "@/lib/format";
import type { JobRow } from "@/types/database";

export function JobBoard({ jobs: initialJobs }: { jobs: JobRow[] }) {
  const router = useRouter();
  const [jobs, setJobs] = React.useState(initialJobs);
  const [markingId, setMarkingId] = React.useState<string | null>(null);

  async function handleMarkApplied(job: JobRow) {
    setMarkingId(job.id);
    const result = await createApplicationAction({
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      jobUrl: job.url ?? "",
      location: job.location ?? "",
      salary: job.salary ?? "",
      status: "Applied",
    });
    setMarkingId(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Marked as applied");
    router.push(`/dashboard/applications/${result.data.id}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {jobs.length} saved {jobs.length === 1 ? "job" : "jobs"}
        </p>
        <JobFormSheet onSaved={() => router.refresh()} />
      </div>

      {jobs.length === 0 ? (
        <Card>
          <EmptyState
            icon={Briefcase}
            title="No saved jobs yet"
            description="Save a job posting to analyze it against your resume and start an application."
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {jobs.map((job) => (
            <Card key={job.id} className="flex flex-col gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{job.title}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {job.company}
                  {job.location && ` · ${job.location}`}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">Saved {formatDateTime(job.saved_at)}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/ats-analyzer?jobId=${job.id}`}>
                    <Sparkles className="size-3.5" /> Analyze
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/jobs/${job.id}/start`}>
                    <FileCheck2 className="size-3.5" /> Start application
                  </Link>
                </Button>
                {job.url && (
                  <Button asChild variant="outline" size="sm">
                    <a href={job.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-3.5" /> Open
                    </a>
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                <Button type="button" variant="ghost" size="sm" disabled={markingId === job.id} onClick={() => handleMarkApplied(job)}>
                  {markingId === job.id ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                  Mark as applied
                </Button>
                <JobFormSheet
                  job={job}
                  onSaved={() => router.refresh()}
                  trigger={
                    <Button type="button" variant="ghost" size="sm">
                      <PenLine className="size-3.5" /> Edit
                    </Button>
                  }
                />
                <ConfirmDeleteButton
                  action={() => deleteJobAction(job.id)}
                  successMessage="Job deleted"
                  onDeleted={() => setJobs((prev) => prev.filter((j) => j.id !== job.id))}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
