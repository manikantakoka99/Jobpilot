import { NextResponse, type NextRequest } from "next/server";

import { authenticateExtensionRequest, ExtensionAuthError } from "@/app/api/extension/_lib/auth";
import { markAppliedSchema } from "@/lib/validations/extension";
import { ApplicationServiceError, markApplicationApplied } from "@/services/application-service";

/**
 * POST /api/extension/mark-applied — the extension's half of "I submitted
 * this application". Only ever called from an explicit click on the
 * extension's own confirmation button (mirroring the web app's Apply
 * Assistant) — never fired just because a page was opened or a form was
 * filled. Stamps status=Applied and applied_at, same as the web quick-action.
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, userId } = await authenticateExtensionRequest(request);

    const body = await request.json().catch(() => null);
    const parsed = markAppliedSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }

    const application = await markApplicationApplied(supabase, userId, parsed.data.applicationId);

    return NextResponse.json({ application });
  } catch (error) {
    if (error instanceof ExtensionAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof ApplicationServiceError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[api/extension/mark-applied]", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
