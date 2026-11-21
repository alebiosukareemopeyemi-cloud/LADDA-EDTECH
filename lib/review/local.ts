// Mock mode keeps verified skills in this browser so a demo survives a refresh.
// Browser only. Every call is safe when storage is blocked.

const KEY = "ladda:progress:v1";

export type LocalReview = {
  repoUrl: string;
  commitHash: string;
  criteria: string[];
  at: string;
};
type Store = { verified: Record<string, LocalReview>; credentialId?: string };

function read(): Store {
  if (typeof window === "undefined") return { verified: {} };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { verified: {} };
    const j = JSON.parse(raw) as Store;
    return { verified: j.verified ?? {}, credentialId: j.credentialId };
  } catch {
    return { verified: {} };
  }
}

function write(s: Store) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Storage is blocked: the demo still works until the page reloads.
  }
}

export const localVerifiedIds = () => Object.keys(read().verified);
export const localReviews = () => read().verified;

export function markLocalVerified(nodeId: string, review: LocalReview) {
  const s = read();
  s.verified[nodeId] = review;
  write(s);
}

export const localCredentialId = () => read().credentialId ?? null;

export function saveLocalCredentialId(id: string) {
  const s = read();
  s.credentialId = id;
  write(s);
}

export function clearLocalProgress() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}
