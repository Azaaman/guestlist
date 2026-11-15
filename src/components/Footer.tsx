"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const path = usePathname();
  if (path?.startsWith("/live")) return null; // the big screen has no chrome
  return (
    <footer className="border-t border-line/60">
      <div className="mx-auto flex max-w-5xl flex-wrap gap-x-6 gap-y-2 px-4 py-6 text-sm text-white/55">
        <span>Nestly, Season 1 in Miami. A Business Cup 2.0 demo: payments run in Stripe test mode.</span>
        <Link href="/host" className="hover:text-white">For hosts</Link>
        <Link href="/host/apply" className="hover:text-white">Become a host</Link>
        <Link href="/season" className="hover:text-white">Prizes</Link>
        <Link href="/policy" className="hover:text-white">House rules</Link>
      </div>
    </footer>
  );
}
