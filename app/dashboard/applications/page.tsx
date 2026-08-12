import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";

import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = { title: "Applications" };

export default function ApplicationsPage() {
  return (
    <ComingSoon
      icon={ClipboardList}
      title="Applications"
      description="Track every application from submission to offer in one organized board."
    />
  );
}
