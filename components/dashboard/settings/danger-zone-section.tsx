import { Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function DangerZoneSection() {
  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-base">Danger zone</CardTitle>
        <CardDescription>Permanently delete your account and all associated data.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div>
            <p className="text-sm font-medium">Delete account</p>
            <p className="text-muted-foreground text-xs">This action cannot be undone.</p>
          </div>
          <Button variant="destructive" size="sm" disabled className="gap-1.5">
            <Trash2 className="size-3.5" />
            Delete
            <Badge variant="secondary" className="ml-1 text-[10px]">
              Soon
            </Badge>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
