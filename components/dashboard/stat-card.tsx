import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Lock } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  href: string;
}

/** A locked, "coming soon" stat tile — deliberately shows no fake numbers. */
export function StatCard({ icon: Icon, label, value, hint, href }: StatCardProps) {
  return (
    <Link href={href} className="focus-visible:ring-ring block rounded-2xl outline-none focus-visible:ring-2">
      <Card className="hover:border-primary/30 h-full p-5 transition-colors">
        <div className="mb-3 flex items-start justify-between">
          <div className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-lg">
            <Icon className="size-4.5" />
          </div>
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <Lock className="size-2.5" />
            Soon
          </Badge>
        </div>
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
        <p className="text-foreground/40 mt-1 text-2xl font-semibold tracking-tight">{value}</p>
        <p className="text-muted-foreground mt-1 text-xs">{hint}</p>
      </Card>
    </Link>
  );
}
