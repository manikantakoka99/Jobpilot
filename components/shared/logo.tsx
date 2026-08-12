import Link from "next/link";
import { Rocket } from "lucide-react";

import { cn } from "@/lib/utils";

interface LogoProps {
  href?: string | false;
  className?: string;
  iconOnly?: boolean;
}

/**
 * JobPilot AI wordmark. Uses an existing Lucide icon (no external logo
 * service) inside a brand-gradient tile.
 */
export function Logo({ href = "/", className, iconOnly = false }: LogoProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-2 font-semibold", className)}>
      <span className="bg-gradient-brand flex size-8 shrink-0 items-center justify-center rounded-lg text-white shadow-sm">
        <Rocket className="size-4.5" strokeWidth={2.25} />
      </span>
      {!iconOnly && (
        <span className="text-foreground text-lg tracking-tight">
          JobPilot <span className="text-gradient-brand">AI</span>
        </span>
      )}
    </span>
  );

  if (href === false) return content;

  return (
    <Link href={href} className="focus-visible:ring-ring rounded-md outline-none focus-visible:ring-2">
      {content}
    </Link>
  );
}
