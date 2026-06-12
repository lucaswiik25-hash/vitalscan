-- VitalScan / Scanly — Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query)

-- ── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Profiles ──────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text,
  age numeric,
  weight numeric,
  height numeric,
  sex text check (sex in ('male', 'female', 'other')),
  activity_level text default 'moderately_active',
  goal text default 'maintain',
  diet_mode text default 'none',
  preferences text,
  allergens text[] default '{}',
  calorie_target numeric,
  protein_target numeric,
  carbs_target numeric,
  fat_target numeric,
  fiber_target numeric default 30,
  sugar_target numeric default 50,
  sodium_target numeric default 2300,
  water_target_ml numeric,
  streak numeric default 0,
  last_active_date date,
  appearance_mode boolean default false,
  onboarding_complete boolean default false,
  last_sleep_hours numeric,
  last_sleep_date date,
  skin_type text,
  skin_concerns text[] default '{}',
  hair_type text,
  hair_concerns text[] default '{}',
  health_conditions text[] default '{}',
  skincare_onboarding_done boolean default false,
  supplement_onboarding_done boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- ── Food logs ─────────────────────────────────────────────────────────────────
create table if not exists public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  date date not null,
  time text,
  meal_type text default 'snack',
  image_url text,
  calories numeric,
  protein numeric,
  carbs numeric,
  fat numeric,
  fiber numeric,
  sugar numeric,
  sodium numeric,
  serving_size text,
  confidence text,
  source text default 'ai_visual',
  barcode text,
  ingredients jsonb default '[]',
  vitamins jsonb default '[]',
  allergens_detected text[] default '{}',
  diet_compatibility text,
  diet_reason text,
  bloat_risk text,
  bloat_reason text,
  glycemic_impact text,
  glycemic_reason text,
  skin_impact jsonb,
  appearance_tip text,
  health_score numeric,
  logged boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists food_logs_user_date_idx on public.food_logs (user_id, date desc);

-- ── Hydration logs ────────────────────────────────────────────────────────────
create table if not exists public.hydration_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  amount_ml numeric not null,
  type text default 'water',
  slot text,
  created_at timestamptz not null default now()
);

create index if not exists hydration_logs_user_date_idx on public.hydration_logs (user_id, date desc);

-- ── Sleep logs ────────────────────────────────────────────────────────────────
create table if not exists public.sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  sleep_time text,
  wake_time text,
  duration_minutes numeric,
  sleep_score numeric,
  duration_score numeric,
  consistency_score numeric,
  habits_score numeric,
  mood text,
  journal_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists sleep_logs_user_date_idx on public.sleep_logs (user_id, date desc);

-- ── Exercise logs ─────────────────────────────────────────────────────────────
create table if not exists public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  date date not null,
  duration_minutes numeric,
  calories_burned numeric,
  category text default 'other',
  intensity text default 'medium',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists exercise_logs_user_date_idx on public.exercise_logs (user_id, date desc);

-- ── Supplements ───────────────────────────────────────────────────────────────
create table if not exists public.supplements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  dose text,
  unit text,
  time_of_day text default 'morning',
  taken_today boolean default false,
  last_taken_date date,
  times_per_day numeric default 1,
  doses_taken_today numeric default 0,
  is_medication boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists supplements_user_idx on public.supplements (user_id);

-- ── Scan history ──────────────────────────────────────────────────────────────
create table if not exists public.scan_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('food', 'skincare', 'supplement')),
  date date not null,
  image_url text,
  product_name text,
  brand text,
  result_data jsonb,
  safety_score numeric,
  quality_score numeric,
  verdict text,
  created_at timestamptz not null default now()
);

create index if not exists scan_history_user_created_idx on public.scan_history (user_id, created_at desc);

-- ── Updated-at trigger ────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists food_logs_set_updated_at on public.food_logs;
create trigger food_logs_set_updated_at
  before update on public.food_logs
  for each row execute function public.set_updated_at();

drop trigger if exists sleep_logs_set_updated_at on public.sleep_logs;
create trigger sleep_logs_set_updated_at
  before update on public.sleep_logs
  for each row execute function public.set_updated_at();

drop trigger if exists exercise_logs_set_updated_at on public.exercise_logs;
create trigger exercise_logs_set_updated_at
  before update on public.exercise_logs
  for each row execute function public.set_updated_at();

drop trigger if exists supplements_set_updated_at on public.supplements;
create trigger supplements_set_updated_at
  before update on public.supplements
  for each row execute function public.set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.food_logs enable row level security;
alter table public.hydration_logs enable row level security;
alter table public.sleep_logs enable row level security;
alter table public.exercise_logs enable row level security;
alter table public.supplements enable row level security;
alter table public.scan_history enable row level security;

-- Profiles
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = user_id);

-- Food logs
create policy "food_logs_select_own" on public.food_logs for select using (auth.uid() = user_id);
create policy "food_logs_insert_own" on public.food_logs for insert with check (auth.uid() = user_id);
create policy "food_logs_update_own" on public.food_logs for update using (auth.uid() = user_id);
create policy "food_logs_delete_own" on public.food_logs for delete using (auth.uid() = user_id);

-- Hydration logs
create policy "hydration_logs_select_own" on public.hydration_logs for select using (auth.uid() = user_id);
create policy "hydration_logs_insert_own" on public.hydration_logs for insert with check (auth.uid() = user_id);
create policy "hydration_logs_update_own" on public.hydration_logs for update using (auth.uid() = user_id);
create policy "hydration_logs_delete_own" on public.hydration_logs for delete using (auth.uid() = user_id);

-- Sleep logs
create policy "sleep_logs_select_own" on public.sleep_logs for select using (auth.uid() = user_id);
create policy "sleep_logs_insert_own" on public.sleep_logs for insert with check (auth.uid() = user_id);
create policy "sleep_logs_update_own" on public.sleep_logs for update using (auth.uid() = user_id);
create policy "sleep_logs_delete_own" on public.sleep_logs for delete using (auth.uid() = user_id);

-- Exercise logs
create policy "exercise_logs_select_own" on public.exercise_logs for select using (auth.uid() = user_id);
create policy "exercise_logs_insert_own" on public.exercise_logs for insert with check (auth.uid() = user_id);
create policy "exercise_logs_update_own" on public.exercise_logs for update using (auth.uid() = user_id);
create policy "exercise_logs_delete_own" on public.exercise_logs for delete using (auth.uid() = user_id);

-- Supplements
create policy "supplements_select_own" on public.supplements for select using (auth.uid() = user_id);
create policy "supplements_insert_own" on public.supplements for insert with check (auth.uid() = user_id);
create policy "supplements_update_own" on public.supplements for update using (auth.uid() = user_id);
create policy "supplements_delete_own" on public.supplements for delete using (auth.uid() = user_id);

-- Scan history
create policy "scan_history_select_own" on public.scan_history for select using (auth.uid() = user_id);
create policy "scan_history_insert_own" on public.scan_history for insert with check (auth.uid() = user_id);
create policy "scan_history_update_own" on public.scan_history for update using (auth.uid() = user_id);
create policy "scan_history_delete_own" on public.scan_history for delete using (auth.uid() = user_id);

-- ── Storage bucket for scan uploads (optional) ───────────────────────────────
-- Create bucket "uploads" in Dashboard → Storage, then run:
--
-- create policy "uploads_select_own" on storage.objects for select
--   using (bucket_id = 'uploads' and auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "uploads_insert_own" on storage.objects for insert
--   with check (bucket_id = 'uploads' and auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "uploads_delete_own" on storage.objects for delete
--   using (bucket_id = 'uploads' and auth.uid()::text = (storage.foldername(name))[1]);
