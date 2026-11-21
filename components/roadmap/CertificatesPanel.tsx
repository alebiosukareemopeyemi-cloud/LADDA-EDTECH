import { Lock } from "lucide-react";
import type { CertificateSuggestion } from "@/lib/contract";

// Mock only: the whole panel is visible but locked until it is built for real.
export function CertificatesPanel({ suggested }: { suggested: CertificateSuggestion[] }) {
  return (
    <section aria-labelledby="certs-title" className="mt-14 border-t border-line pt-8">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="certs-title" className="font-display text-3xl font-bold leading-none">
          Certificates
        </h2>
        <span className="badge badge-locked">
          <Lock aria-hidden="true" /> Coming soon
        </span>
      </div>
      <p className="measure mt-3 text-text-soft">
        A certificate can skip the Learn step and shows on your credential, but only an approved project verifies a
        skill.
      </p>

      {suggested.length > 0 && (
        <ul className="mt-4 divide-y divide-line border-y border-line text-text-mute">
          {suggested.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-4 py-3">
              <span>
                <span className="block font-medium text-text-soft">{c.title}</span>
                <span className="text-sm">{c.provider}</span>
              </span>
              <span className="text-sm">{c.cost === "free" ? "Free" : "Paid"}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
