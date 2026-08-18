import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";

interface LiveStatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  href: string;
}

/** A real-data stat tile, linking into the feature it summarizes — never a fake or placeholder number. */
export function LiveStatCard({ icon: Icon, label, value, hint, href }: LiveStatCardProps) {
  return (
    <Link href={href} className="focus-visible:ring-ring block rounded-2xl outline-none focus-visible:ring-2">
      <Card className="hover:border-primary/30 h-full p-5 transition-colors">
        <div className="mb-3 flex items-start justify-between">
          <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
            <Icon className="size-4.5" />
          </div>
        </div>
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
        <p className="text-muted-foreground mt-1 text-xs">{hint}</p>
      </Card>
    </Link>
  );
}
