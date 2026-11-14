# Nestly — secret house parties, approved by members

Business Cup 2.0 · Track 02 Entertainment · B2C · Web only · US adults 25–45

Invite-only house parties in Miami for adults 30–40. Like a dating app, Nestly only brings people together:
there are no games. A guest creates one profile, which is screened by AI and approved by a moderator. Verified
guests then book any party in one tap. Prices rise as a party fills, men and women are always kept within
60/40, and Season Pass holders pay no ticket and go to the front of every waitlist. Every booking carries a
refundable damage deposit. At the door AI gives each guest three people to meet. Guests rate the host and can
report another guest or the host; a reported guest is removed from the party, can appeal, and a moderator
decides on a permanent ban.

Hosts provide the house and keep 50% of ticket revenue; everything else is software.

## Try it (no sign-up)
1. `/profile` → "A guest who gets approved" → **Create my profile**. AI screens it.
2. Open `/moderate` (the moderator desk) and press **Approve**. The profile page updates by itself.
3. `/parties` → **Coral Gables Pool Party** → **Book a place** → hold ticket + $150 deposit with Stripe test card `4242 4242 4242 4242`. The address unlocks.
4. Try **Glass House Listening Party** as a man: places for men are full under the 60/40 rule, so you join the waitlist.
5. Book a party that is more than 24 hours away and press **Cancel my booking**: the hold is released. Tonight's party cannot be cancelled.
6. `/pass` → buy the Season Pass ($499). Book again: the ticket is $0, only the deposit is held, and on a waitlist you are placed first.
7. Big screen: `/live/tonight`. Phone: scan the QR and check in. The host presses **Open the room** → AI gives every guest three people to meet.
8. On a phone, **Report someone**. On the big screen the host presses **Confirm and remove**. The removed guest's phone shows an appeal form; `/moderate` → Conduct cases → **Ban permanently** or **Clear**. A banned Season Pass holder is refunded for unused parties minus the conduct fee.
9. On the big screen, file a **Damage claim** against a guest who checked in with a ticket: it is taken from their deposit.
10. **End the party** → tickets are charged, deposits released, phones rate the host and pick who they'd like to see again.
11. `/policy` has the house rules.

## What is real vs simulated
- **Real:** AI screening, moderator approval, booking with the 60/40 balance check, waitlist with pass priority, Stripe card holds (ticket + deposit), capture after the party, free cancellation over 24 hours out, damage claims against the deposit, Stripe refund on a ban, AI introductions, check-in, room pulse, reports about guests and hosts, removal, appeals, moderator decisions, host ratings, mutual matches.
- **Simulated:** Miami parties, hosts, the bookings already on each party and the club members who fill the room (marked in the UI). The moderator desk is open instead of behind staff login. Insurance and host protection are described, not purchased.
- **Not in the MVP:** government ID verification. A ban is tied to the profile and the guest's name, so a banned person could return under another name until ID checks are added.

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
