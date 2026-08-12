import type { Metadata } from "next";
import { FileEdit } from "lucide-react";

import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = { title: "Resume Optimizer" };

export default function ResumeOptimizerPage() {
  return (
    <ComingSoon
      icon={FileEdit}
      title="Resume Optimizer"
      description="Get targeted, AI-powered suggestions to tailor your resume to any job description."
    />
  );
}
