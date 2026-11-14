# Nestly — secret house parties, approved by members

Business Cup 2.0 · Track 02 Entertainment · B2C · Web only · US adults 25–45

Invite-only house parties for adults 30–40 in the US. Like a dating app, Nestly only brings people together:
there are no games. A guest creates one profile, which is screened by AI and approved by a moderator. Verified
guests then book any party in one tap. Prices rise as a party fills, men and women are always kept within
60/40, and Season Pass holders pay nothing and go to the front of every waitlist. At the door AI gives each
guest three people to meet. Guests rate the host and can report another guest; three reports, or one the host
confirms, is a permanent ban, and a banned pass holder is refunded for unused parties minus a conduct fee.

Hosts provide the house; everything else is software.

## Try it (no sign-up)
1. `/profile` → "A guest who gets approved" → **Create my profile**. AI screens it.
2. Open `/moderate` (the moderator queue) and press **Approve**. The profile page updates by itself.
3. `/parties` → **Hill Country Pool Party** → **Book a place** → pay with Stripe test card `4242 4242 4242 4242`. The address unlocks.
4. Try **Glass House Listening Party** as a man: places for men are full under the 60/40 rule, so you join the waitlist.
5. `/pass` → buy the Season Pass ($499). Book again: nothing to pay, and on a waitlist you are placed first.
6. Big screen: `/live/tonight`. Phone: scan the QR and check in. The host presses **Open the room** → AI gives every guest three people to meet.
7. On a phone, **Report a guest**. On the big screen the host confirms → the guest is removed and banned. If they held a Season Pass, Stripe refunds the unused parties minus the conduct fee.
8. **End the party** → phones rate the host (releases the payout at 4.2+) and pick who they'd like to see again.
9. `/policy` has the house rules.

## What is real vs simulated
- **Real:** AI screening, moderator approval, booking with the 60/40 balance check, waitlist with pass priority, Stripe ticket and pass payments, Stripe refund on a ban, AI introductions, check-in, room pulse, guest reports, bans, host ratings, mutual matches.
- **Simulated:** Austin parties, hosts, the bookings already on each party and the club members who fill the room (marked in the UI). The moderator queue is open instead of behind staff login. Government ID check is shown as pending, so a ban is tied to the profile and the guest's name instead of a verified ID.

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
- `src/app/api/*` — profile (AI screening), moderate, apply (booking), checkout, pass, live party endpoints
- `src/app/live/[sid]` — big screen · `src/app/play/[sid]` — phone

Secrets live only in environment variables; nothing sensitive is committed.
