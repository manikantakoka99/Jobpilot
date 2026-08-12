import type { Metadata } from "next";
import { FolderOpen } from "lucide-react";

import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = { title: "Documents" };

export default function DocumentsPage() {
  return (
    <ComingSoon
      icon={FolderOpen}
      title="Documents"
      description="Store and manage your resumes, cover letters, and other job search documents in one place."
    />
  );
}
