import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AppShell from "@/components/shell/AppShell";
import MotionProvider from "@/components/shell/MotionProvider";

// Display: Anybody has a width axis, so headlines can be set wide.
// Bundled from @fontsource-variable so builds work without Google Fonts.
const display = localFont({
  src: "../node_modules/@fontsource-variable/anybody/files/anybody-latin-wdth-normal.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-display",
  display: "swap",
});
// Body and UI. Data (hashes, ids, hours) uses the system mono stack.
const body = localFont({
  src: "../node_modules/@fontsource-variable/onest/files/onest-latin-wght-normal.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-body",
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
      className={`dark ${display.variable} ${body.variable}`}
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
