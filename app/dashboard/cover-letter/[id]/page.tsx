import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getCoverLetterById } from "@/services/cover-letter-service";
import { CoverLetterDetail } from "@/components/cover-letter/cover-letter-detail";

export const metadata: Metadata = { title: "Cover Letter" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CoverLetterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  // getCoverLetterById always filters by the authenticated user's id — a
  // browser-supplied letter id can never load another user's letter.
  const letter = await getCoverLetterById(supabase, user.id, id);
  if (!letter) notFound();

  return <CoverLetterDetail letter={letter} />;
}
