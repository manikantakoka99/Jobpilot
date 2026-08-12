import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Only run on routes that actually need a session: protected dashboard
  // pages (to enforce auth) and the login/signup pages (to redirect already
  // signed-in users away). This keeps public marketing pages independent of
  // Supabase being configured.
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};
