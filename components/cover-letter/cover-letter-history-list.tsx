"use client";

import * as React from "react";
import Link from "next/link";
import { History } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ConfirmDeleteButton } from "@/components/ats/confirm-delete-button";
import { deleteCoverLetterAction } from "@/app/dashboard/cover-letter/actions";
import { formatDateTime } from "@/lib/format";
import type { CoverLetterSummary } from "@/services/cover-letter-service";

const TONE_LABELS: Record<string, string> = {
  professional: "Professional",
  concise: "Concise",
  confident: "Confident",
  friendly: "Friendly",
};

export function CoverLetterHistoryList({ letters: initialLetters }: { letters: CoverLetterSummary[] }) {
  const [letters, setLetters] = React.useState(initialLetters);

  if (letters.length === 0) {
    return (
      <Card>
        <EmptyState icon={History} title="No cover letters yet" description="Generate your first cover letter to see it here." />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {letters.map((letter) => (
        <Card key={letter.id} className="flex flex-row flex-wrap items-center gap-3 p-4">
          <Link href={`/dashboard/cover-letter/${letter.id}`} className="min-w-0 flex-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <p className="truncate text-sm font-medium">
              {letter.jobTitle}
              {letter.company && <span className="text-muted-foreground font-normal"> @ {letter.company}</span>}
            </p>
            <p className="text-muted-foreground truncate text-xs">{formatDateTime(letter.createdAt)}</p>
          </Link>
          <Badge variant="outline">{TONE_LABELS[letter.tone] ?? letter.tone}</Badge>
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
