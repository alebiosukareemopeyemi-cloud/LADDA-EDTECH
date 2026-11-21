import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { issueCredential } from "@/lib/credential/issue";

export const runtime = "nodejs";

// Mock mode only: the browser lists what it verified. Real mode ignores the body.
const BodySchema = z
  .object({
    reviews: z
      .array(z.object({ skillId: z.string(), repoUrl: z.string(), commitHash: z.string() }))
      .max(50)
      .optional(),
  })
  .optional();

// POST /api/credential/issue
// The user comes from the session cookie. Issues once every required skill is verified.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) {
    return NextResponse.json({ ok: false, code: "UNAUTHENTICATED", message: "Please sign in again." }, { status: 401 });
  }

  let body: unknown = undefined;
  try {
    body = await req.json();
  } catch {
    // An empty body is fine.
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, code: "VALIDATION", message: "Bad request." }, { status: 400 });
  }

  const mock = process.env.NEXT_PUBLIC_USE_MOCKS === "1";
  const res = await issueCredential({
    user: { id: user.id, email: user.email, metadata: user.user_metadata ?? {} },
    mock,
    clientReviews: mock ? parsed.data?.reviews : undefined,
  });
  return NextResponse.json(res.body, { status: res.status });
}
