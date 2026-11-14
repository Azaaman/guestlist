"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export interface PublicQuestion { q: string; options: string[]; answer: number | null }
export interface PublicContest { type: "quiz" | "vote"; title: string; description: string; emoji: string; questions?: PublicQuestion[] }
export interface PublicPerson { id: string; name: string; gender: string; demo: boolean; skill?: string }
export interface PublicPair { id: string; name: string; a: PublicPerson; b: PublicPerson; why: string }
export interface LiveData {
  state: { status: "lobby" | "running" | "finished"; pairs: PublicPair[]; program: PublicContest[]; current: number; qIndex: number; phase: "open" | "reveal" };
  players: { id: string; name: string; gender: string }[];
  scores: { totals: Record<string, number>; perContest: Record<string, number[]> };
  responses: number;
  room: { vibe: number | null; vibeCount: number; reports: number; partyRating: number | null; hostRating: number | null; ratingCount: number };
  me: {
    pairId: string | null;
    answered: number | null;
    votes: Record<string, number>;
    pulse: number | null;
    reported: boolean;
    rates: Record<string, number>;
    again: string[];
    matches: { id: string; name: string; demo: boolean }[];
  } | null;
}

export function useLive(sid: string, playerId?: string | null, intervalMs = 1500) {
  const [data, setData] = useState<LiveData | null>(null);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const res = await fetch(`/api/live/${sid}${playerId ? `?player=${playerId}` : ""}`, { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) setError(d.error || "Connection problem");
      else {
        setError("");
        setData(d);
      }
    } catch {
      setError("Connection problem — retrying…");
    } finally {
      busy.current = false;
    }
  }, [sid, playerId]);
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, intervalMs);
    return () => clearInterval(t);
  }, [refresh, intervalMs]);
  return { data, error, refresh };
}

export function ranked(d: LiveData) {
  return [...d.state.pairs].sort((a, b) => (d.scores.totals[b.id] ?? 0) - (d.scores.totals[a.id] ?? 0));
}
