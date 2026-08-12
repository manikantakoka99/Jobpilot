import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const PREFERENCES = [
  { id: "product-updates", label: "Product updates", description: "News about new JobPilot AI features." },
  { id: "application-reminders", label: "Application reminders", description: "Nudges to follow up on applications." },
];

export function NotificationsSection() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Notifications</CardTitle>
          <Badge variant="secondary" className="text-[10px]">
            Coming soon
          </Badge>
        </div>
        <CardDescription>Notification preferences will be available in a future phase.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {PREFERENCES.map((pref) => (
          <div key={pref.id} className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor={pref.id} className="text-sm font-medium">
                {pref.label}
              </Label>
              <p className="text-muted-foreground text-xs">{pref.description}</p>
            </div>
            <Switch id={pref.id} disabled />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
