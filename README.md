# Nestly

House parties in Miami for adults 25–45 who want new friends and a better way to spend free time.

Business Cup 2.0 · Track 02 Entertainment · B2C · Web only · US adults 25–45

- **Live:** https://nestly-nu-app.vercel.app
- **Stack:** Next.js 15 (App Router, TypeScript, Tailwind 4) · Supabase (Postgres + Storage) · Stripe (test mode) · Gemini or Anthropic API · Vercel

## What it does

Nestly brings verified people together at private houses. It is about friendship and a good night out, not dating, and there are no games.

1. **Get verified once.** A guest creates one profile. AI screens it and verifies or rejects it in seconds.
2. **Book a night.** A verified guest books any party in one tap. The fewer places left, the higher the price. The address unlocks with the ticket.
3. **Meet the right people.** At the door AI gives each guest three people to meet and a line to open with.
4. **Everyone stays accountable.** Guests rate the host and can report a guest or the host. A reported guest is removed, can appeal, and a moderator decides on a permanent ban.

Hosts provide the house and keep 50% of ticket revenue; everything else is software.

## Try it (no sign-up)

| #   | Where                            | What to do                                                                                                                                                                             |
| --- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `/profile`                       | "A guest who gets approved" → **Create my profile**. AI verifies it. Try "A guest who gets rejected" to see AI say no.                                                                 |
| 2   | `/parties`                       | Open **Coral Gables Pool Party** → **Book a place** → Stripe test card `4242 4242 4242 4242`. The ticket shows the address.                                                            |
| 3   | `/parties`                       | Open **Glass House Listening Party**: it is full, so you join the waitlist.                                                                                                            |
| 4   | `/pass`                          | Buy the Season Pass ($499). Reload the waitlist booking: pass holders move ahead of everyone without a pass.                                                                           |
| 5   | A party a few days away          | Book it, then **Cancel my booking**: free until 24 hours before the party.                                                                                                             |
| 6   | `/live/tonight` + phone          | The big screen. Scan the QR on a phone and check in. Host presses **Open the room** → three introductions appear on the phone.                                                         |
| 7   | Phone → big screen → `/moderate` | **Report someone** → host presses **Confirm and remove** → the guest can appeal → a moderator bans or clears. A banned pass holder is refunded for unused parties minus a conduct fee. |
| 8   | Big screen                       | File a **Damage claim** against a guest with a ticket: it comes out of their deposit. **End the party** charges tickets and releases deposits.                                         |
| 9   | `/host/apply`                    | Apply as a host: ID, proof of ownership or lease, 3–6 house photos, a theme and name from the list. Review it on `/moderate`.                                                          |
| 10  | `/policy`                        | The house rules.                                                                                                                                                                       |

## Product rules

All the numbers live in `src/lib/room.ts` and `src/lib/data.ts`; the house-rules page reads them from there.

| Rule               | Value                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------- |
| Ticket price       | Rises as a party fills (`dynamicPrice`)                                                  |
| Damage deposit     | $150 hold with every booking, released after the party                                   |
| Cancellation       | Free until 24 hours before; a no-show still pays the ticket                              |
| Season Pass        | $499 for 12 parties; covers the ticket; front of every waitlist; entry in the prize draw |
| Prize draw         | 3 winners, each a trip to Hawaii for two, drawn at the season finale                     |
| Removal            | 3 reports from different guests, or 1 confirmed by the host                              |
| Permanent ban      | Decided by a moderator after the guest can appeal                                        |
| Banned pass holder | Unused parties refunded minus a $100 conduct fee                                         |
| Host share         | 50% of ticket revenue, paid when guests rate the host 4.2+                               |

## What is real and what is simulated

- **Real:** AI screening and verification; booking; waitlist with pass priority; Stripe card holds (ticket + deposit), capture after the party, free cancellation, refund on a ban; damage claims; AI introductions; check-in; room pulse; reports, removal, appeals and moderator decisions; host ratings; host applications with private file upload and review; Season Pass payment.
- **Simulated:** the Miami parties, hosts, the bookings already on each party and the club members who fill the room (marked in the UI). The moderator desk is open instead of behind staff login. Insurance and host protection are described, not purchased. An approved host is not yet published to the line-up automatically.
- **Not in the MVP:** government ID checks for guests. A ban is tied to the profile and the guest's name.

## Code map

```
src/
  app/
    page.tsx                  Home
    parties/                  Line-up and party pages
    profile/                  Guest profile + AI verification result
    apply/[partyId]/          Book a place
    application/[id]/         One booking: card hold, ticket, waitlist, cancel
    pass/  season/  policy/   Season Pass, prize draw, house rules
    host/  host/apply/        For hosts; the host application form
    moderate/                 Moderator desk
    live/[sid]/               Big screen at a party
    play/[sid]/               A guest's phone at a party
    api/                      Server routes (see below)
  components/                 Hero, nav, footer, countdown, shared UI, live-state hook
  lib/
    data.ts                   Seed data: parties, hosts, club members, season; pricing
    room.ts                   Product rules as constants (deposit, fees, thresholds)
    types.ts                  Profile and booking types
    ai.ts                     JSON generation with Gemini/Anthropic and model fallback
    live.ts                   Party engine: introductions, reports, cases, bans, card holds
    waitlist.ts               Waitlist order (pass holders first)
    hosting.ts                Host themes, names and upload limits
    profile.ts                Remembers the guest's profile id on the device
    db.ts  stripe.ts          Service clients
supabase/schema.sql           Tables
```

### API routes

| Route                                                   | Purpose                                               |
| ------------------------------------------------------- | ----------------------------------------------------- |
| `POST /api/profile` · `GET`                             | Create/edit a profile (AI screening) · read it        |
| `POST /api/apply`                                       | Book a place or join the waitlist                     |
| `GET /api/application/[id]`                             | Read a booking                                        |
| `POST /api/checkout` → `POST /api/hold`                 | Start the card hold · confirm it and issue the ticket |
| `POST /api/cancel`                                      | Cancel a booking                                      |
| `POST /api/pass` → `POST /api/pass/confirm`             | Pay for a Season Pass · attach it to the profile      |
| `POST /api/host-apply` · `GET`                          | Send a host application with files · read its status  |
| `GET/POST /api/moderate`                                | Moderator desk: host applications and conduct cases   |
| `GET /api/live/[sid]`                                   | Live party state (polled)                             |
| `POST /api/live/[sid]/join` · `act` · `appeal` · `host` | Check in · guest actions · appeal · host controls     |

### How data is stored

The MVP uses four small tables (`supabase/schema.sql`) and reuses them rather than adding one per concept:

- **`applications`** holds three kinds of row, told apart by `party_id`:
  - `"profile"`: a guest profile. `form` is the profile, `profile` the AI card, `trust` the AI verdict, `status` is `verified`, `rejected` or `banned`.
  - `"host"`: a host application. `votes.files` lists the uploaded files; `status` is `pending`, `approved` or `rejected`.
  - a party id: a booking. `votes` carries booking details (price, deposit, settlement); `status` is `reviewed` (card step), `approved` (ticket), `waitlist` or `cancelled`.
- **`live_sessions`**: one JSON document per live party, plus two shared documents (`cases`, `bans`).
- **`live_players`**: who checked in to a party.
- **`live_actions`**: everything guests send from their phones (reports, ratings, "we met").
- **Storage bucket `host-documents`** (private): host IDs, ownership papers and house photos, shown to moderators through short-lived signed links.

Some column and route names are older than the features they now serve (`votes`, `skill`, `apply`, `application`). They were kept so existing data and links keep working; comments in the code say what each one holds.

## Run locally

```bash
cp .env.example .env.local   # fill in the keys
npm install
npm run dev
```

Create the tables by pasting `supabase/schema.sql` into Supabase → SQL Editor → Run. The storage bucket is created on first use.

`npm run lint` and `npm run format` (Prettier) keep the code consistent. Secrets live only in environment variables; nothing sensitive is committed.
