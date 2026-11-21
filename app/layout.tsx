import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AppShell from "@/components/shell/AppShell";
import MotionProvider from "@/components/shell/MotionProvider";

// All fonts are bundled from @fontsource packages. No network fetch at build.

// Headlines and waypoint names.
const display = localFont({
  src: [
    { path: "../node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});

// All app text.
const body = localFont({
  src: [
    { path: "../node_modules/@fontsource/barlow/files/barlow-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../node_modules/@fontsource/barlow/files/barlow-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../node_modules/@fontsource/barlow/files/barlow-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
});

// The credential page only.
const serif = localFont({
  src: [
    { path: "../node_modules/@fontsource-variable/newsreader/files/newsreader-latin-wght-normal.woff2", weight: "200 800", style: "normal" },
    { path: "../node_modules/@fontsource-variable/newsreader/files/newsreader-latin-wght-italic.woff2", weight: "200 800", style: "italic" },
  ],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ladda: Pick right. Learn real. Get hired.",
  description:
    "Find your path, build real projects, and earn credentials employers can check in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`dark ${display.variable} ${body.variable} ${serif.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh antialiased">
        <MotionProvider>
          <AppShell />
          {children}
        </MotionProvider>
      </body>
    </html>
  );
}
