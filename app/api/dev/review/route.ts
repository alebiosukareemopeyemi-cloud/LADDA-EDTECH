import { NextResponse } from "next/server";
import { handleReview } from "@/lib/review/handler";

export const runtime = "nodejs";

// Development only: the same review pipeline as /api/review, without a sign-in, so it can
// be tested from a terminal. It answers 404 everywhere else. Delete with /dev before the demo.
export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") return new NextResponse(null, { status: 404 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, code: "VALIDATION", message: "Bad request." }, { status: 400 });
  }
  // mock: true so the dev route never writes to the database.
  const res = await handleReview(body, { userId: "dev-user", mock: true });
  return NextResponse.json(res.body, { status: res.status });
}
