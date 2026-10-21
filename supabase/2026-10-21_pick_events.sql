-- Help me pick tracking: one row per event, tied together by pick_id.
-- Run once in the Supabase SQL editor.
create table if not exists public.pick_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  pick_id uuid not null,
  anon_id uuid not null,
  user_id uuid references auth.users (id) on delete set null,
  event text not null check (event in ('pick_started', 'pick_completed', 'result_action', 'visit_answer')),
  restaurant_id text,
  props jsonb not null default '{}'::jsonb
);

create index if not exists pick_events_event_created_idx on public.pick_events (event, created_at desc);
create index if not exists pick_events_pick_idx on public.pick_events (pick_id);

-- Locked down: no policies, so only the server (service role) can read or write.
alter table public.pick_events enable row level security;
