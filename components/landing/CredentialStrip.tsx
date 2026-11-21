import Link from "next/link";

// Sample data. Hours are real-looking but fake, as everywhere in the demo.
const SAMPLES = [
  { id: "demo-001", name: "Amina Bello", hours: 96 },
  { id: "demo-002", name: "Tunde Okafor", hours: 98 },
  { id: "demo-003", name: "Chiamaka Eze", hours: 105 },
];

// A plain row with hairline dividers. Not cards.
export default function CredentialStrip() {
  return (
    <footer className="relative z-10 border-t border-line">
      <div className="mx-auto grid max-w-[1440px] divide-y divide-line px-4 md:grid-cols-[auto_1fr_1fr_1fr] md:divide-x md:divide-y-0 md:px-12">
        <p className="py-4 text-sm text-text-mute md:max-w-52 md:pr-8">
          Sample credentials. Open one to see what an employer sees.
        </p>
        {SAMPLES.map((s) => (
          <Link
            key={s.id}
            href={`/verify/${s.id}`}
            className="group block py-4 md:px-8"
            aria-label={`${s.name}, Backend with Node.js, ${s.hours} verified hours`}
          >
            <span className="block text-base font-semibold group-hover:underline">{s.name}</span>
            <span className="block text-sm text-text-soft">Backend with Node.js</span>
            <span className="block text-sm text-text-mute">
              <span className="data">{s.hours}</span> verified hours
            </span>
          </Link>
        ))}
      </div>
    </footer>
  );
}
