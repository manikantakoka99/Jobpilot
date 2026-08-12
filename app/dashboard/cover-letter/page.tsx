import type { Metadata } from "next";
import { Mail } from "lucide-react";

import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = { title: "Cover Letter" };

export default function CoverLetterPage() {
  return (
    <ComingSoon
      icon={Mail}
      title="Cover Letter"
      description="Generate personalized cover letters that match your voice and the role you're applying for."
    />
  );
}
