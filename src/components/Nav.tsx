"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/parties", label: "Parties" },
  { href: "/season", label: "Season" },
  { href: "/host", label: "Hosts" },
];

export default function Nav() {
  const path = usePathname();
  if (path?.startsWith("/live")) return null; // big screen has no chrome
  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-mono text-sm font-bold tracking-[0.25em] text-white">
          GUEST<span className="text-brand-2">LIST</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-1.5 ${path?.startsWith(l.href) ? "bg-panel text-white" : "text-white/70 hover:text-white"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
