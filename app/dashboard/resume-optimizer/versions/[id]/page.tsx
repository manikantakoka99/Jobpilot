import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getResumeVersionById } from "@/services/resume-optimizer-service";
import { getResumeById } from "@/services/resume-service";
import { VersionDetail } from "@/components/optimizer/version-detail";

export const metadata: Metadata = { title: "Version – Resume Optimizer" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ResumeVersionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  // getResumeVersionById always filters by the authenticated user's id — a
  // browser-supplied version id can never load another user's version.
  const version = await getResumeVersionById(supabase, user.id, id);
  if (!version) notFound();

  // Resolve what to compare this version against: the version it was
  // generated from, or the original resume's extracted text.
  let baseText: string | null = null;
  let baseLabel = "Original resume";
  if (version.source_version_id) {
    const sourceVersion = await getResumeVersionById(supabase, user.id, version.source_version_id);
    if (sourceVersion) {
      baseText = sourceVersion.content;
      baseLabel = sourceVersion.version_name || `Version ${sourceVersion.version_number}`;
    }
  } else {
    const resume = await getResumeById(supabase, user.id, version.resume_id);
    baseText = resume?.extracted_text ?? null;
  }

  return <VersionDetail version={version} baseText={baseText} baseLabel={baseLabel} />;
}
