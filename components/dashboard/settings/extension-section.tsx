"use client";

import * as React from "react";
import { Check, Copy, Loader2, Plug } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteButton } from "@/components/ats/confirm-delete-button";
import { createExtensionTokenAction, revokeExtensionTokenAction } from "@/app/dashboard/settings/actions";
import { formatDateTime } from "@/lib/format";
import type { ExtensionTokenSummary } from "@/services/extension-token-service";

/**
 * Pairs the Chrome extension with this account. A raw token is shown here
 * exactly once — only its hash is ever stored (see 0006_extension_tokens.sql).
 * The extension never talks to Supabase directly, only to JobPilot's own
 * /api/extension/* routes, which validate this token server-side.
 */
export function ExtensionSection({ tokens: initialTokens }: { tokens: ExtensionTokenSummary[] }) {
  const [tokens, setTokens] = React.useState(initialTokens);
  const [label, setLabel] = React.useState("Chrome Extension");
  const [isCreating, setIsCreating] = React.useState(false);
  const [newToken, setNewToken] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  async function handleCreate() {
    setIsCreating(true);
    const result = await createExtensionTokenAction(label);
    setIsCreating(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setNewToken(result.data.token);
    setTokens((prev) => [result.data.summary, ...prev]);
  }

  function handleCopy() {
    if (!newToken) return;
    navigator.clipboard.writeText(newToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Chrome extension</CardTitle>
        <CardDescription>
          Connect the JobPilot Chrome extension so it can suggest values from your profile while you fill out an application. It never
          submits anything for you — see the Apply Assistant.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {newToken && (
          <div className="border-primary/30 bg-primary/5 space-y-2 rounded-lg border p-3">
            <p className="text-sm font-medium">Copy this token now — it won&apos;t be shown again.</p>
            <div className="flex items-center gap-2">
              <Input readOnly value={newToken} className="font-mono text-xs" onFocus={(e) => e.target.select()} />
              <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">Paste this into the extension&apos;s popup to finish pairing it.</p>
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="token-label">Token label</Label>
            <Input id="token-label" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={50} />
          </div>
          <Button type="button" onClick={handleCreate} disabled={isCreating}>
            {isCreating ? <Loader2 className="size-4 animate-spin" /> : <Plug className="size-4" />}
            Generate token
          </Button>
        </div>

        {tokens.length > 0 && (
          <div className="space-y-2">
            {tokens.map((token) => (
              <div key={token.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{token.label}</p>
                  <p className="text-muted-foreground text-xs">
                    Created {formatDateTime(token.createdAt)}
                    {token.lastUsedAt ? ` · Last used ${formatDateTime(token.lastUsedAt)}` : " · Never used"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline">Expires {new Date(token.expiresAt).toLocaleDateString()}</Badge>
                  <ConfirmDeleteButton
                    action={() => revokeExtensionTokenAction(token.id)}
                    label="Revoke"
                    successMessage="Token revoked"
                    onDeleted={() => setTokens((prev) => prev.filter((t) => t.id !== token.id))}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
