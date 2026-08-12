import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function ResumeOptimizerLoading() {
  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </Card>
      <Card className="space-y-4 p-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-40 w-full" />
      </Card>
    </div>
  );
}
