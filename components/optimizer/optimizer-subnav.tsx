"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, History } from "lucide-react";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard/resume-optimizer", label: "Optimize", icon: Sparkles },
  { href: "/dashboard/resume-optimizer/versions", label: "Versions", icon: History },
] as const;

export function OptimizerSubnav() {
  const pathname = usePathname();

  return (
    <nav className="border-border flex gap-1 overflow-x-auto border-b">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = href === "/dashboard/resume-optimizer" ? pathname === href : pathname.startsWith(href);

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
