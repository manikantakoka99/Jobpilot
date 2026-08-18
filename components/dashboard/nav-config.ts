import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FileCheck2,
  FileEdit,
  Mail,
  ClipboardList,
  MessagesSquare,
  BarChart3,
  Bot,
  FolderOpen,
  Briefcase,
  User,
  Settings,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Phase 1 pages are "active"; everything else renders a "coming soon" state. */
  status: "active" | "soon";
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, status: "active" },
      { title: "ATS Analyzer", href: "/dashboard/ats-analyzer", icon: FileCheck2, status: "active" },
      { title: "Resume Optimizer", href: "/dashboard/resume-optimizer", icon: FileEdit, status: "active" },
      { title: "Cover Letter", href: "/dashboard/cover-letter", icon: Mail, status: "active" },
      { title: "Jobs", href: "/dashboard/jobs", icon: Briefcase, status: "active" },
      { title: "Applications", href: "/dashboard/applications", icon: ClipboardList, status: "active" },
      { title: "Interview Prep", href: "/dashboard/interview-prep", icon: MessagesSquare, status: "active" },
      { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3, status: "active" },
    ],
  },
  {
    label: "Tools",
    items: [
      { title: "Career Assistant", href: "/dashboard/career-assistant", icon: Bot, status: "active" },
      { title: "Documents", href: "/dashboard/documents", icon: FolderOpen, status: "active" },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Profile", href: "/dashboard/profile", icon: User, status: "active" },
      { title: "Settings", href: "/dashboard/settings", icon: Settings, status: "active" },
    ],
  },
];

export const PAGE_TITLES: Record<string, string> = {
  ...Object.fromEntries(NAV_SECTIONS.flatMap((section) => section.items.map((item) => [item.href, item.title]))),
  // Nested ATS Analyzer routes aren't in NAV_SECTIONS (only the top-level tab is a sidebar item).
  "/dashboard/ats-analyzer/history": "ATS Analyzer",
  "/dashboard/ats-analyzer/resumes": "ATS Analyzer",
  // Nested Resume Optimizer / Cover Letter routes — same pattern.
  "/dashboard/resume-optimizer/versions": "Resume Optimizer",
  "/dashboard/cover-letter/history": "Cover Letter",
  // Nested Interview Prep routes — same pattern.
  "/dashboard/interview-prep/history": "Interview Prep",
  // Apply Assistant is reached contextually (from an application), not via the sidebar.
  "/dashboard/apply-assistant": "Apply Assistant",
};
