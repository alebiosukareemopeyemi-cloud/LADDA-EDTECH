import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleReview } from "@/lib/review/handler";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/review { nodeId, repoUrl }
// The user always comes from the session cookie, never from the body.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ ok: false, code: "UNAUTHENTICATED", message: "Please sign in again." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, code: "VALIDATION", message: "Bad request." }, { status: 400 });
  }

  const res = await handleReview(body, { userId: auth.user.id, mock: process.env.NEXT_PUBLIC_USE_MOCKS === "1" });
  return NextResponse.json(res.body, { status: res.status });
}
