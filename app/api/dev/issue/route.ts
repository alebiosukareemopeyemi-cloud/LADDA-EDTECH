import { NextResponse } from "next/server";
import { issueCredential } from "@/lib/credential/issue";

export const runtime = "nodejs";

// Development only: issue a credential in mock mode for a made-up user, so the issue and verify
// path can be tested from a terminal. Answers 404 everywhere else. Delete with /dev before the demo.
export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") return new NextResponse(null, { status: 404 });
  let body: { reviews?: { skillId: string; repoUrl: string; commitHash: string }[] } = {};
  try {
    body = await req.json();
  } catch {
    // empty body: nothing verified
  }
  const res = await issueCredential({
    user: { id: "dev-user", email: "dev@example.com", metadata: { display_name: "Dev Student", university: "University of Lagos", department: "Computer Science" } },
    mock: true,
    clientReviews: body.reviews,
  });
  return NextResponse.json(res.body, { status: res.status });
}
