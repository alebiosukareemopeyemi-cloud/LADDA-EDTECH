import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { CredentialPayload } from "@/lib/contract";
import { createAdminClient } from "@/lib/supabase/admin";

// Server only. Credentials are read through /api/verify with the service-role key:
// the table has no public policy, so nobody can list or read it directly.
export type StoredCredential = {
  id: string;
  userId: string;
  payload: CredentialPayload;
  signature: string;
  createdAt: string;
};

/* ---------- Mock mode: memory plus a file, so a dev restart does not lose the demo ---------- */

const FILE = join(process.cwd(), ".data", "mock-credentials.json");
const g = globalThis as unknown as { __ladda_mock_creds?: Map<string, StoredCredential> };

function mockMap(): Map<string, StoredCredential> {
  if (g.__ladda_mock_creds) return g.__ladda_mock_creds;
  const map = new Map<string, StoredCredential>();
  try {
    const list = JSON.parse(readFileSync(FILE, "utf8")) as StoredCredential[];
    for (const c of list) map.set(c.id, c);
  } catch {
    // No file yet, or it cannot be read: start empty.
  }
  g.__ladda_mock_creds = map;
  return map;
}

function persistMock(map: Map<string, StoredCredential>) {
  if (process.env.NODE_ENV === "production") return; // read-only disks on most hosts
  try {
    mkdirSync(join(process.cwd(), ".data"), { recursive: true });
    writeFileSync(FILE, JSON.stringify([...map.values()], null, 2));
  } catch {
    // Memory still holds it for this run.
  }
}

/* ---------- Public API ---------- */

type Row = { id: string; user_id: string; payload: CredentialPayload; signature: string; created_at: string };
const fromRow = (r: Row): StoredCredential => ({
  id: r.id,
  userId: r.user_id,
  payload: r.payload,
  signature: r.signature,
  createdAt: r.created_at,
});

// True if saved. False means the id is taken (try another) or the store failed.
export async function saveCredential(c: StoredCredential, mock: boolean): Promise<boolean> {
  if (mock) {
    const map = mockMap();
    if (map.has(c.id)) return false;
    map.set(c.id, c);
    persistMock(map);
    return true;
  }
  const admin = createAdminClient();
  if (!admin) return false;
  const { error } = await admin
    .from("credentials")
    .insert({ id: c.id, user_id: c.userId, payload: c.payload, signature: c.signature, created_at: c.createdAt });
  return !error;
}

// Database first, then the mock store. Either one failing just means "not found here".
export async function findCredentialById(id: string): Promise<StoredCredential | null> {
  const admin = createAdminClient();
  if (admin) {
    try {
      const { data } = await admin.from("credentials").select("*").eq("id", id).maybeSingle();
      if (data) return fromRow(data as Row);
    } catch {
      // The table may not exist yet. Fall through.
    }
  }
  return mockMap().get(id) ?? null;
}

export async function findCredentialByUser(userId: string, mock: boolean): Promise<StoredCredential | null> {
  if (mock) {
    return [...mockMap().values()].filter((c) => c.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
  }
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("credentials")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? fromRow(data as Row) : null;
}
