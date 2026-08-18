import type { NextRequest } from "next/server";

import { createServiceClient, ServiceClientNotConfiguredError } from "@/lib/supabase/service";
import { extractBearerToken, hashToken } from "@/lib/extension/tokens";

export class ExtensionAuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/**
 * Authenticates an incoming extension request by its `Authorization: Bearer
 * <token>` header. Looks up the token by its SHA-256 hash (never the raw
 * value) via the service-role client, then returns that same client plus
 * the resolved `userId` — every subsequent query in the route handler must
 * still filter explicitly by this `userId`, since the service-role client
 * itself bypasses RLS entirely.
 */
export async function authenticateExtensionRequest(request: NextRequest) {
  const token = extractBearerToken(request.headers.get("authorization"));
  if (!token) throw new ExtensionAuthError("Missing bearer token.");

  let supabase: ReturnType<typeof createServiceClient>;
  try {
    supabase = createServiceClient();
  } catch (error) {
    if (error instanceof ServiceClientNotConfiguredError) {
      throw new ExtensionAuthError("Extension API is not configured on this server.", 503);
    }
    throw error;
  }

  const { data, error } = await supabase
    .from("extension_tokens")
    .select("id, user_id, expires_at, revoked_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle();

  if (error || !data) throw new ExtensionAuthError("Invalid token.");
  if (data.revoked_at) throw new ExtensionAuthError("This token has been revoked.");
  if (new Date(data.expires_at).getTime() < Date.now()) throw new ExtensionAuthError("This token has expired.");

  // Best-effort — never blocks or fails the request if this update fails.
  void supabase.from("extension_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", data.id).then(
    () => undefined,
    () => undefined,
  );

  return { supabase, userId: data.user_id as string };
}
