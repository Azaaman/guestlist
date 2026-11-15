"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/parties", label: "Parties" },
  { href: "/season", label: "Prizes", wide: true },
  { href: "/host", label: "Hosts", wide: true },
  { href: "/profile", label: "Profile" },
];

export default function Nav() {
  const path = usePathname();
  if (path?.startsWith("/live")) return null; // the big screen has no chrome
  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="wordmark text-xl leading-none text-white sm:text-2xl">Nestly</Link>
        <nav className="flex items-center gap-1 text-sm font-semibold">
          {links.map((l) => (
            <Link key={l.href} href={l.href}
              className={`rounded-lg px-2.5 py-1.5 sm:px-3 ${"wide" in l ? "hidden sm:block" : ""} ${path?.startsWith(l.href) ? "bg-panel text-white" : "text-white/70 hover:text-white"}`}>
              {l.label}
            </Link>
          ))}
          <Link href="/pass" className="ml-1 whitespace-nowrap rounded-lg bg-hi px-3 py-1.5 text-[#17103f] hover:bg-white"><span className="sm:hidden">Pass</span><span className="hidden sm:inline">Season Pass</span></Link>
        </nav>
      </div>
    </header>
  );
}
