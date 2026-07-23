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

/**
 * Applies a stored theme choice before the browser paints. Runs synchronously
 * during HTML parsing, so there is no flash of the wrong theme even on a slow
 * connection where the HTML lands well before React hydrates.
 *
 * No attribute is set when nothing is stored — that deliberately leaves the OS
 * `prefers-color-scheme` media query in charge as the default.
 */
const NO_FLASH = `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
      </head>
      <body className="min-h-full">
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl border-t border-[var(--border)] px-4 py-8 text-xs text-[var(--muted)]">
          Built on the free Sleeper API · data is read-only league history · trade verdicts are
          &ldquo;realized&rdquo; points, not dynasty market value.
        </footer>
      </body>
    </html>
  );
}
