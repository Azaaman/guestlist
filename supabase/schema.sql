-- Guestlist schema. Paste into Supabase → SQL Editor → Run.
-- RLS is on with no policies: only the server (secret key) can read/write.

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  party_id text not null,
  form jsonb not null,
  profile jsonb,
  votes jsonb,
  trust jsonb,
  status text not null default 'reviewed', -- reviewed | held | approved | rejected
  payment_intent_id text,
  created_at timestamptz not null default now()
);

create table if not exists live_sessions (
  id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists live_players (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  name text not null,
  gender text not null,
  skill text,
  created_at timestamptz not null default now()
);

create table if not exists live_actions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  player_id uuid not null,
  contest_index int not null,
  question_index int not null default 0,
  kind text not null,          -- answer | vote
  target_pair text,
  value int not null,
  created_at timestamptz not null default now(),
  unique (session_id, player_id, contest_index, question_index, kind, target_pair)
);

create index if not exists live_players_session on live_players(session_id);
create index if not exists live_actions_session on live_actions(session_id, contest_index);

alter table applications enable row level security;
alter table live_sessions enable row level security;
alter table live_players enable row level security;
alter table live_actions enable row level security;
