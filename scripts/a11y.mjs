// Accessibility and mobile check for every route. Uses your installed Chrome.
//
//   1. Start the dev server with the test bypass:   $env:LADDA_E2E_BYPASS = "1"; npm run dev
//   2. In another terminal:                          npm run a11y
//
// For each route and each screen size it runs axe-core (WCAG 2.0, 2.1 and 2.2 AA plus best practice),
// then checks for sideways scrolling and for tap targets smaller than 44px.
// Screenshots go to .data/a11y/ (git-ignored). Exit code 1 if any serious or critical issue is found.
import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = ".data/a11y";
mkdirSync(OUT, { recursive: true });

const ROUTES = [
  "/",
  "/tour",
  "/verify",
  "/verify/demo-001",
  "/verify/demo-999",
  "/auth",
  "/auth/verify-email?email=ada@school.edu.ng",
  "/dashboard",
  "/intake",
  "/roadmap",
  "/roadmap/node-express",
  "/roadmap/complete",
  "/opportunities",
  "/opportunities/aws-hacktoberfest",
  "/design",
  "/this-page-does-not-exist",
];

const SIZES = [
  { name: "mobile", width: 360, height: 740 },
  { name: "desktop", width: 1280, height: 800 },
];

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

// Interactive things that are smaller than 44px in either direction (inline links in text are exempt).
const SMALL_TARGETS = () => {
  const sel = 'a[href], button, input:not([type="hidden"]), select, textarea, [role="button"], [role="option"], summary, [tabindex="0"]';
  const out = [];
  for (const el of document.querySelectorAll(sel)) {
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || el.closest("[hidden],[inert]")) continue;
    if (el.classList.contains("sr-only") || el.closest(".sr-only")) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.bottom < 0 || r.top > document.documentElement.scrollHeight) continue;
    const inline = cs.display === "inline" && !!el.closest("p, li, dd, dt, label, h1, h2, h3");
    if (inline) continue;
    // A radio or checkbox hidden for a styled label counts through its label.
    if (el.matches('input[type="radio"], input[type="checkbox"]') && el.closest("label")) continue;
    if (r.width < 43.5 || r.height < 43.5) {
      out.push(`${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""} "${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
  }
  return out;
};

const browser = await chromium.launch({ channel: "chrome", headless: true });
let seriousTotal = 0;
const summary = [];

for (const size of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: size.width, height: size.height }, reducedMotion: "reduce" });
  for (const route of ROUTES) {
    const page = await ctx.newPage();
    let status = "?";
    try {
      const res = await page.goto(BASE + route, { waitUntil: "load", timeout: 90000 });
      status = res ? res.status() : "?";
      await page.waitForTimeout(2200); // client data, mock delays and first compile

      const axe = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      const bad = axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      const minor = axe.violations.filter((v) => !(v.impact === "serious" || v.impact === "critical"));
      seriousTotal += bad.length;

      const overflow = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        iw: window.innerWidth,
      }));
      const sideways = overflow.sw > overflow.iw + 1;
      const small = await page.evaluate(SMALL_TARGETS);

      const shot = `${OUT}/${size.name}${route.replace(/[^a-z0-9]+/gi, "_") || "_home"}.png`;
      await page.screenshot({ path: shot, fullPage: false });

      summary.push({ size: size.name, route, status, bad, minor, sideways, overflow, small });
    } catch (e) {
      summary.push({ size: size.name, route, status: "ERROR " + String(e.message).slice(0, 120), bad: [], minor: [], sideways: false, small: [] });
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();

for (const s of summary) {
  const flags = [
    `HTTP ${s.status}`,
    `axe serious/critical: ${s.bad.length}`,
    `other axe: ${s.minor.length}`,
    s.sideways ? `SIDEWAYS SCROLL (${s.overflow.sw} > ${s.overflow.iw})` : "no sideways scroll",
    `small targets: ${s.small.length}`,
  ];
  console.log(`\n[${s.size}] ${s.route}\n  ${flags.join(" | ")}`);
  for (const v of s.bad) {
    console.log(`  ! ${v.impact} ${v.id}: ${v.help}`);
    for (const n of v.nodes.slice(0, 3)) console.log(`      ${n.target.join(" ")}  ${(n.failureSummary || "").split("\n")[1] ?? ""}`);
  }
  for (const v of s.minor) console.log(`  - ${v.impact} ${v.id}: ${v.help} (${v.nodes.length})`);
  for (const t of s.small.slice(0, 8)) console.log(`  . small: ${t}`);
}

console.log(`\nSerious or critical axe violations in total: ${seriousTotal}`);
process.exit(seriousTotal > 0 ? 1 : 0);
