# Nestly — secret house parties, approved by members

Business Cup 2.0 · Track 02 Entertainment · B2C · Web only · US adults 25–45

Invite-only house parties for adults 30–40 in the US. Like a dating app, Nestly only brings people together:
there are no games. Guests apply to a party, members vote on the application, and the card is only **held**
until approval. At the door AI gives each guest three people to meet. Guests rate the host and can report
another guest; three reports, or one the host confirms, is a permanent ban.

Inspired by the CeleBreak pickup-football model (the platform organises, you buy a spot, a host runs it).
Hosts provide the house; everything else is software.

## Try it (no sign-up)
1. `/parties` → open **Hill Country Pool Party** (tonight) → **Apply** → "Fill in a strong application".
2. AI builds your profile card and trust score.
3. Hold the price with Stripe test card `4242 4242 4242 4242` (any future date, any CVC).
4. Watch members vote (AI role-plays each member). 3+ yes → card captured, address revealed. Otherwise the hold is released ($0).
5. Big screen: `/live/tonight`. Phones: scan the QR (`/play/tonight`). The host presses **Open the room** → AI gives every guest three people to meet.
6. On a phone, **Report a guest**. On the big screen the host confirms → that guest is removed and can no longer apply or check in.
7. **End the party** → phones rate the host (releases the payout at 4.2+) and pick who they'd like to see again; mutual picks become matches.
8. `/pass` sells the Season Pass ($499, Stripe test) with a prize draw for pass holders. `/host` shows host checks and live numbers.

## What is real vs simulated
- **Real:** AI profile + screening, AI member votes, Stripe hold/capture/cancel, AI introductions, check-in, room pulse, guest reports, host-confirmed and automatic bans, host ratings, mutual matches, Season Pass payment.
- **Simulated:** Austin parties, hosts and the club members who vote and fill the room (marked in the UI). Government ID check is shown as pending, so in this demo a ban is tied to the guest's name instead of a verified ID.

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
- `src/lib/live.ts` — party room engine: introductions, reports, bans
- `src/app/api/*` — apply, checkout (hold), hold, decide (capture/cancel), live session endpoints
- `src/app/live/[sid]` — big screen · `src/app/play/[sid]` — phone

Secrets live only in environment variables; nothing sensitive is committed.
