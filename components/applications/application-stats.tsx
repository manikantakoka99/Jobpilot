import { Briefcase, Send, MessagesSquare, Award, XCircle } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { ApplicationRow } from "@/types/database";

function StatTile({ icon: Icon, label, value }: { icon: typeof Briefcase; label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="bg-muted text-muted-foreground flex size-7 items-center justify-center rounded-lg">
          <Icon className="size-3.5" />
        </div>
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
      </div>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
    </Card>
  );
}

/** Top metrics row for the Applications dashboard. */
export function ApplicationStats({ applications }: { applications: ApplicationRow[] }) {
  const total = applications.length;
  const applied = applications.filter((a) => a.status !== "Saved" && a.status !== "Preparing").length;
  const interviews = applications.filter((a) => a.status === "Interview").length;
  const offers = applications.filter((a) => a.status === "Offer").length;
  const rejected = applications.filter((a) => a.status === "Rejected").length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      <StatTile icon={Briefcase} label="Total" value={total} />
      <StatTile icon={Send} label="Applied" value={applied} />
      <StatTile icon={MessagesSquare} label="Interviews" value={interviews} />
      <StatTile icon={Award} label="Offers" value={offers} />
      <StatTile icon={XCircle} label="Rejected" value={rejected} />
    </div>
  );
}
