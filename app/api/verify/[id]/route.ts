import { NextResponse } from "next/server";
import { signPayload, publicKeyBase64 } from "@/lib/credential/sign";
import { demoCredential } from "@/lib/credential/demo";
import { findCredentialById } from "@/lib/credential/store";
import { isCredentialIdShape } from "@/lib/credential/id";
import { summarize } from "@/lib/credential/build";

export const runtime = "nodejs";

const notFound = () =>
  NextResponse.json({ ok: false, code: "VALIDATION", message: "Credential not found." }, { status: 404 });

// GET /api/verify/[id] (public). Looks in the database first, then the sample credentials.
// Only the PUBLIC key is ever returned. The browser checks the signature itself.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isCredentialIdShape(id)) return notFound();

  try {
    // 1. A real credential that Ladda issued (stored with its original signature).
    const stored = await findCredentialById(id);
    if (stored) {
      return NextResponse.json({
        ok: true,
        data: {
          status: "valid",
          payload: stored.payload,
          signature: stored.signature,
          publicKey: await publicKeyBase64(),
          summary: summarize(stored.payload),
          summaryFallback: true,
        },
      });
    }

    // 2. The sample credentials for the demo and the tour.
    const demo = demoCredential(id);
    if (!demo) return notFound();
    const { signature, publicKey } = await signPayload(demo.payload);
    return NextResponse.json({
      ok: true,
      data: {
        status: demo.revoked ? "revoked" : "valid",
        payload: demo.payload,
        signature,
        publicKey,
        summary: demo.summary,
        summaryFallback: true,
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, code: "VALIDATION", message: "We could not check this credential right now. Try again in a moment." },
      { status: 500 }
    );
  }
}
