import Link from "next/link";
import { KeyRound } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AccountSection({ email }: { email: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Account</CardTitle>
        <CardDescription>Your login credentials for JobPilot AI.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="settings-email">Email</Label>
          <Input id="settings-email" value={email} disabled readOnly />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div>
            <p className="text-sm font-medium">Password</p>
            <p className="text-muted-foreground text-xs">Send yourself a reset link by email.</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/forgot-password">
              <KeyRound className="size-3.5" />
              Change password
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
