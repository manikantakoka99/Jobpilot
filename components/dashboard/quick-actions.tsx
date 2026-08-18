import Link from "next/link";
import { UserCircle2, FileCheck2, ClipboardList, MessagesSquare, ArrowUpRight } from "lucide-react";

import { Card } from "@/components/ui/card";

const ACTIONS = [
  {
    icon: UserCircle2,
    title: "Complete your profile",
    description: "Add your details so you're ready for what's next.",
    href: "/dashboard/profile",
  },
  {
    icon: FileCheck2,
    title: "Run an ATS Analysis",
    description: "Score your resume against a job description in seconds.",
    href: "/dashboard/ats-analyzer",
  },
  {
    icon: ClipboardList,
    title: "Log an application",
    description: "Track a job you've applied to and follow its status.",
    href: "/dashboard/applications",
  },
  {
    icon: MessagesSquare,
    title: "Practice an interview",
    description: "Get grounded questions and feedback for your target role.",
    href: "/dashboard/interview-prep",
  },
];

export function QuickActions() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {ACTIONS.map(({ icon: Icon, title, description, href }) => (
        <Link key={href} href={href} className="focus-visible:ring-ring rounded-2xl outline-none focus-visible:ring-2">
          <Card className="group hover:border-primary/30 h-full p-5 transition-colors">
            <div className="mb-3 flex items-center justify-between">
              <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                <Icon className="size-4.5" />
              </div>
              <ArrowUpRight className="text-muted-foreground group-hover:text-foreground size-4 transition-colors" />
            </div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{description}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
