import type { Metadata, Viewport } from "next";
import "./globals.css";
import Link from "next/link";
import Nav from "@/components/Nav";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "Nestly — Secret house parties in Austin",
  description:
    "Invite-only parties for adults 30–40. Every guest is verified. AI introduces you to three people. Bad behaviour means a permanent ban.",
};

export const viewport: Viewport = { themeColor: "#150f4f", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Nav />
        <ScrollReveal />
        <main>{children}</main>
        <footer className="border-t border-line/60">
          <div className="mx-auto flex max-w-5xl flex-wrap gap-x-6 gap-y-2 px-4 py-6 text-sm text-white/55">
            <span>Nestly, Season 1 in Austin. A Business Cup 2.0 demo: payments run in Stripe test mode.</span>
            <Link href="/host" className="hover:text-white">For hosts</Link>
            <Link href="/season" className="hover:text-white">Prizes</Link>
            <Link href="/policy" className="hover:text-white">House rules</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
