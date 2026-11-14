# Nestly — get on the list, win the season

Business Cup 2.0 · Track 02 Entertainment · B2C · Web only · US adults 25–45

Invite-only house parties for adults 30–40 in the US. Guests apply to a party, members of the
opposite gender vote on the application, the card is only **held** until approval. At the party,
AI pairs everyone into couples and writes the contest program; guests play and vote from their
phones; points stack across a 12-week season. The top 3 couples win trips (Europe, Hawaii, Wild West).

Inspired by the CeleBreak pickup-football model (the platform organises, you buy a spot, a host runs it),
applied to social nights. Hosts provide the house; everything else is software.

## Try it (no sign-up)
1. `/parties` → open **Hill Country Pool Party** (tonight) → **Apply** → “Fill with a sample guest”.
2. AI builds your profile card and trust score.
3. Hold the price with Stripe test card `4242 4242 4242 4242` (any future date, any CVC).
4. Watch members vote (AI role-plays each member). 3+ yes → card captured, address revealed. Otherwise the hold is released ($0).
5. Big screen: `/live/tonight`. Phones: scan the QR (`/play/tonight`). Host presses **Pair everyone & start** → AI pairs and generates quiz + contests → phones answer/vote → live leaderboard.

6. When the party ends, phones rate the night and the host (this releases the host payout at 4.2+) and pick who they'd like to see again; mutual picks become matches.
7. `/pass` sells the Season Pass ($499, Stripe test). `/host` shows host checks and live numbers from real applications.

Also worth trying: on the application form, "Fill in one that gets rejected" shows the screening saying no and the card hold being released.

## What is real vs simulated
- **Real:** AI profile + screening, AI member votes, Stripe manual-capture hold/capture/cancel, AI pairing, AI-generated quiz questions and contest program, live answers/votes from phones, scoring and leaderboard, ticket check-in, live room pulse, safety alerts, after-party ratings and mutual matches, Season Pass payment.
- **Seed data:** Austin parties, hosts, season standings and the season members who vote and fill the room (marked as simulated in the UI). Government ID check is shown as pending (Stripe Identity in production).

## Stack
Next.js 15 (App Router, TypeScript, Tailwind) · Supabase Postgres · Stripe (test mode, manual capture) · Gemini or Anthropic API · Vercel.

## Run locally
```bash
cp .env.example .env.local   # fill in keys
npm install
npm run dev
```
Create the tables: paste `supabase/schema.sql` into Supabase → SQL Editor → Run.

## Structure
- `src/lib/data.ts` — seed data (parties, hosts, members, season) and dynamic pricing
- `src/lib/ai.ts` — provider-agnostic JSON generation (Gemini/Anthropic with fallback)
- `src/lib/live.ts` — Party Mode engine: pairing, program, scoring
- `src/app/api/*` — apply, checkout (hold), hold, decide (capture/cancel), live session endpoints
- `src/app/live/[sid]` — big screen · `src/app/play/[sid]` — phone

Secrets live only in environment variables; nothing sensitive is committed.
