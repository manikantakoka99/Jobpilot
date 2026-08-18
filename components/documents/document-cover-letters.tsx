"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, Copy, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ConfirmDeleteButton } from "@/components/ats/confirm-delete-button";
import { deleteCoverLetterAction } from "@/app/dashboard/cover-letter/actions";
import { getCoverLetterContentAction } from "@/app/dashboard/documents/actions";
import { downloadTextFile } from "@/lib/download";
import { formatDateTime } from "@/lib/format";
import type { CoverLetterSummary } from "@/services/cover-letter-service";

/** Generated cover letters — reuses cover-letter-service for content and deletion, no duplicate storage logic. */
export function DocumentCoverLetters({ letters: initialLetters }: { letters: CoverLetterSummary[] }) {
  const [letters, setLetters] = React.useState(initialLetters);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function withContent(id: string, onLoaded: (content: string, jobTitle: string) => void) {
    setPendingId(id);
    const result = await getCoverLetterContentAction(id);
    setPendingId(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    onLoaded(result.data.content, result.data.jobTitle);
  }

  if (letters.length === 0) {
    return (
      <Card>
        <EmptyState icon={Mail} title="No cover letters yet" description="Generate a cover letter to see it here." />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {letters.map((letter) => (
        <Card key={letter.id} className="flex flex-row flex-wrap items-center gap-3 p-4">
          <Link
            href={`/dashboard/cover-letter/${letter.id}`}
            className="focus-visible:ring-ring min-w-0 flex-1 rounded-md outline-none focus-visible:ring-2"
          >
            <p className="truncate text-sm font-medium">
              {letter.jobTitle}
              {letter.company && <span className="text-muted-foreground font-normal"> @ {letter.company}</span>}
            </p>
            <p className="text-muted-foreground truncate text-xs">{formatDateTime(letter.createdAt)}</p>
          </Link>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            disabled={pendingId === letter.id}
            onClick={() =>
              withContent(letter.id, (content) => {
                navigator.clipboard.writeText(content);
                toast.success("Copied to clipboard");
              })
            }
          >
            {pendingId === letter.id ? <Loader2 className="size-3.5 animate-spin" /> : <Copy className="size-3.5" />}
            Copy
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            disabled={pendingId === letter.id}
            onClick={() =>
              withContent(letter.id, (content, jobTitle) => {
                downloadTextFile(`cover-letter-${jobTitle.toLowerCase().replace(/\s+/g, "-")}.txt`, content);
              })
            }
          >
            <Download className="size-3.5" /> Download
          </Button>
          <ConfirmDeleteButton
            action={() => deleteCoverLetterAction(letter.id)}
            label="Delete letter"
            successMessage="Cover letter deleted"
            onDeleted={() => setLetters((prev) => prev.filter((l) => l.id !== letter.id))}
          />
        </Card>
      ))}
    </div>
  );
}
