"use client";
// Client hook that polls the live state of a party, plus the shape of that state.
import { useCallback, useEffect, useRef, useState } from "react";

export interface RoomPerson {
  id: string;
  name: string;
  demo: boolean;
}
export interface LiveData {
  status: "lobby" | "running" | "finished";
  people: RoomPerson[];
  players: { id: string; name: string; gender: string }[];
  room: {
    vibe: number | null;
    vibeCount: number;
    met: number;
    reports: { id: string; name: string; count: number; reasons: string[] }[];
    removed: {
      id: string;
      name: string;
      status: "open" | "banned" | "cleared";
      outcome: { pass: boolean; refund: number; fee: number } | null;
    }[];
    damage: {
      id: string;
      name: string;
      amount: number;
      note: string;
      kept: number;
      covered: number;
      card: boolean;
    }[];
    partyRating: number | null;
    hostRating: number | null;
    ratingCount: number;
  };
  me: {
    removed: boolean;
    conduct: {
      status: "open" | "banned" | "cleared";
      reasons: string[];
      appealed: boolean;
      outcome: { pass: boolean; refund: number; fee: number } | null;
    } | null;
    damage: { amount: number; note: string; kept: number; covered: number; card: boolean } | null;
    intros: { id: string; name: string; why: string; icebreaker: string }[];
    met: string[];
    reported: string[];
    pulse: number | null;
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
      const res = await fetch(`/api/live/${sid}${playerId ? `?player=${playerId}` : ""}`, {
        cache: "no-store",
      });
      const d = await res.json();
      if (!res.ok) setError(d.error || "Connection problem");
      else {
        setError("");
        setData(d);
      }
    } catch {
      setError("Connection problem, retrying…");
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
