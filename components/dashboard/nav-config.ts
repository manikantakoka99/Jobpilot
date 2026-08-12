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
      { title: "ATS Analyzer", href: "/dashboard/ats-analyzer", icon: FileCheck2, status: "soon" },
      { title: "Resume Optimizer", href: "/dashboard/resume-optimizer", icon: FileEdit, status: "soon" },
      { title: "Cover Letter", href: "/dashboard/cover-letter", icon: Mail, status: "soon" },
      { title: "Applications", href: "/dashboard/applications", icon: ClipboardList, status: "soon" },
      { title: "Interview Prep", href: "/dashboard/interview-prep", icon: MessagesSquare, status: "soon" },
      { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3, status: "soon" },
    ],
  },
  {
    label: "Tools",
    items: [
      { title: "Career Assistant", href: "/dashboard/career-assistant", icon: Bot, status: "soon" },
      { title: "Documents", href: "/dashboard/documents", icon: FolderOpen, status: "soon" },
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

export const PAGE_TITLES: Record<string, string> = Object.fromEntries(
  NAV_SECTIONS.flatMap((section) => section.items.map((item) => [item.href, item.title])),
);
