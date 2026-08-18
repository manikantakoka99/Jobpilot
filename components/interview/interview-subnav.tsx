"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquarePlus, History } from "lucide-react";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard/interview-prep", label: "New session", icon: MessageSquarePlus },
  { href: "/dashboard/interview-prep/history", label: "History", icon: History },
] as const;

export function InterviewSubnav() {
  const pathname = usePathname();

  return (
    <nav className="border-border flex gap-1 overflow-x-auto border-b">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = href === "/dashboard/interview-prep" ? pathname === href : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
