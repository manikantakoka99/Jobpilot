import Link from "next/link";
import { UserCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ProfileCompletionCard({ completion }: { completion: number }) {
  const isComplete = completion === 100;

  return (
    <Card className="p-1">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
            <UserCircle2 className="size-4.5" />
          </div>
          <CardTitle className="text-base">Profile completion</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-2xl font-semibold tracking-tight">{completion}%</span>
          {!isComplete && (
            <span className="text-muted-foreground text-xs">
              {100 - completion}% left
            </span>
          )}
        </div>
        <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
          <div
            className="bg-gradient-brand h-full rounded-full transition-all"
            style={{ width: `${completion}%` }}
          />
        </div>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          {isComplete
            ? "Your profile is fully set up. Nice work!"
            : "Add your contact and links so your profile is ready when new features launch."}
        </p>
        {!isComplete && (
          <Button asChild size="sm" variant="outline" className="mt-4">
            <Link href="/dashboard/profile">Complete your profile</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
