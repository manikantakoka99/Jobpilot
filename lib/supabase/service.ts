import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Thrown when SUPABASE_SERVICE_ROLE_KEY isn't set. Only the extension API
 * routes (app/api/extension/*) need this — everything else uses the
 * cookie-authenticated client from lib/supabase/server.ts.
 */
export class ServiceClientNotConfiguredError extends Error {
  constructor() {
    super("Extension API is not configured on this server.");
    this.name = "ServiceClientNotConfiguredError";
  }
}

/**
 * Service-role Supabase client — bypasses RLS entirely. This is why it is
 * confined to app/api/extension/* Route Handlers, which authenticate the
 * caller themselves (via a hashed bearer token, see lib/extension/tokens.ts)
 * and then explicitly filter every query by the resolved user_id in
 * application code, exactly like the RLS policies would.
 *
 * NEVER import this from client components, and NEVER send this key to the
 * browser extension or any other client. It is read only from
 * SUPABASE_SERVICE_ROLE_KEY, which is documented in .env.example but is not
 * required for the rest of the app to build or run — if it's absent, callers
 * get a clear "not configured" error instead of a crash.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new ServiceClientNotConfiguredError();
  }

  return createSupabaseClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
