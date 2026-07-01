create extension if not exists btree_gist;

create table if not exists public.gpu_reservations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  gpu_id text not null check (gpu_id in ('GPU_#0', 'GPU_#1')),
  start_at timestamptz not null,
  end_at timestamptz not null,
  purpose text,
  requested_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at),
  check (date_trunc('hour', start_at) = start_at),
  check (date_trunc('hour', end_at) = end_at),
  exclude using gist (
    gpu_id with =,
    tstzrange(start_at, end_at, '[)') with &&
  )
);

alter table public.gpu_reservations enable row level security;

create policy gpu_reservations_read
on public.gpu_reservations
for select
to authenticated
using (true);

create policy gpu_reservations_insert
on public.gpu_reservations
for insert
to authenticated
with check (
  public.is_researcher_or_professor()
  or (
    public.is_team_member(team_id)
    and requested_by = auth.uid()
  )
);

create policy gpu_reservations_delete
on public.gpu_reservations
for delete
to authenticated
using (
  public.is_researcher_or_professor()
  or public.is_team_member(team_id)
);

create trigger gpu_reservations_updated
before update on public.gpu_reservations
for each row execute function public.set_updated_at();
