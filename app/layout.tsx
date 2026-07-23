import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const display = Orbitron({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "The Shiva Bowl — Dynasty Hub",
  description: "League history, rivalries, schedule luck, trade receipts, and Dynasty Wrapped for The Shiva Bowl.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-10 text-xs text-[var(--muted)]">
          Built on the free Sleeper API · data is read-only league history · trade verdicts are
          &ldquo;realized&rdquo; points, not dynasty market value.
        </footer>
      </body>
    </html>
  );
}
