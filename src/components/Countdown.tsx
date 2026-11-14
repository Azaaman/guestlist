"use client";
import { useEffect, useState } from "react";

const PARTY_HOURS = 5; // how long a party counts as "happening now" after it starts

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${String(m).padStart(2, "0")}m ${String(sec).padStart(2, "0")}s`;
}

// Live countdown to a moment. Renders nothing until mounted, so server and browser never disagree.
export default function Countdown({ to, label = "Starts in", className = "", event = true }: { to: string; label?: string; className?: string; event?: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return <span className={className}>&nbsp;</span>;
  const left = new Date(to).getTime() - now;
  if (left > 0)
    return (
      <span className={className}>
        {label} <span className="tabular-nums">{parts(left)}</span>
      </span>
    );
  if (event && -left < PARTY_HOURS * 3600000) return <span className={className}>Happening now</span>;
  return <span className={className}>{event ? "This party has ended" : "Closed"}</span>;
}
