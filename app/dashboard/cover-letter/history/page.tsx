import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { listCoverLetters } from "@/services/cover-letter-service";
import { CoverLetterHistoryList } from "@/components/cover-letter/cover-letter-history-list";

export const metadata: Metadata = { title: "History – Cover Letter" };

export default async function CoverLetterHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const letters = await listCoverLetters(supabase, user.id);

  return <CoverLetterHistoryList letters={letters} />;
}
