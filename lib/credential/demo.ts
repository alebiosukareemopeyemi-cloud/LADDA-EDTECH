import type { CredentialPayload } from "@/lib/contract";
import { DEMO_CREDENTIALS } from "@/lib/demo/credentials";

// Sample credentials served when nothing else matches (there is no database lookup yet).
// demo-001 to demo-003 come from lib/demo. demo-revoked is demo-001 marked as withdrawn.
export function demoCredential(
  id: string
): { payload: CredentialPayload; summary: string; revoked: boolean } | null {
  if (id === "demo-revoked") {
    const base = DEMO_CREDENTIALS["demo-001"];
    return { payload: { ...base.payload, id }, summary: base.summary, revoked: true };
  }
  const found = Object.hasOwn(DEMO_CREDENTIALS, id) ? DEMO_CREDENTIALS[id] : undefined;
  if (!found) return null;
  return { payload: found.payload, summary: found.summary, revoked: false };
}
