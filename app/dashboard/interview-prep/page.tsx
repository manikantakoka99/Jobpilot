import type { Metadata } from "next";
import { MessagesSquare } from "lucide-react";

import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = { title: "Interview Prep" };

export default function InterviewPrepPage() {
  return (
    <ComingSoon
      icon={MessagesSquare}
      title="Interview Prep"
      description="Practice with role-specific questions and get structured feedback before your next interview."
    />
  );
}
