import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function ComingSoon({ icon: Icon, title, description }: ComingSoonProps) {
  return (
    <Card className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-10 text-center">
      <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl">
        <Icon className="size-6" />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="size-3" />
            Coming soon
          </Badge>
        </div>
        <p className="text-muted-foreground max-w-md text-sm leading-relaxed text-pretty">{description}</p>
      </div>
      <p className="text-muted-foreground/70 text-xs">Coming in a future phase.</p>
    </Card>
  );
}
