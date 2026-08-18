import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}

/** A real-data stat tile — never renders a placeholder or invented number. */
export function MetricCard({ icon: Icon, label, value, hint }: MetricCardProps) {
  return (
    <Card className="p-5">
      <div className="bg-muted text-muted-foreground mb-3 flex size-9 items-center justify-center rounded-lg">
        <Icon className="size-4.5" />
      </div>
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
    </Card>
  );
}
