create table if not exists public.evaluation_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  is_active boolean not null default false,
  allow_edit boolean not null default true,
  peer_trim_min_count integer not null default 5,
  judge_weight numeric(4,2) not null default 0.70,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.evaluation_teams (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.evaluation_sessions(id) on delete cascade,
  team_no integer not null,
  team_name text not null,
  project_title text,
  topic_summary text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(session_id, team_no)
);

create table if not exists public.evaluation_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.evaluation_sessions(id) on delete cascade,
  student_no text not null,
  student_name text,
  team_id uuid references public.evaluation_teams(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(session_id, student_no)
);

create table if not exists public.evaluation_judges (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.evaluation_sessions(id) on delete cascade,
  judge_code text not null,
  judge_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(session_id, judge_code)
);

create table if not exists public.evaluation_scores (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.evaluation_sessions(id) on delete cascade,
  team_id uuid not null references public.evaluation_teams(id) on delete cascade,
  evaluator_role text not null check (evaluator_role in ('judge', 'peer')),
  evaluator_code text not null,
  j_problem integer,
  j_tech integer,
  j_creativity integer,
  j_practicality integer,
  j_presentation integer,
  p_topic integer,
  p_impact integer,
  p_teamwork integer,
  total_score numeric(6,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(session_id, team_id, evaluator_role, evaluator_code),
  constraint judge_score_range check (
    evaluator_role <> 'judge'
    or (
      j_problem between 0 and 20
      and j_tech between 0 and 25
      and j_creativity between 0 and 20
      and j_practicality between 0 and 15
      and j_presentation between 0 and 20
    )
  ),
  constraint peer_score_range check (
    evaluator_role <> 'peer'
    or (
      p_topic between 0 and 10
      and p_impact between 0 and 10
      and p_teamwork between 0 and 10
    )
  )
);

create or replace view public.v_evaluation_judge_summary as
select session_id, team_id, count(*) as judge_count, avg(total_score) as judge_avg_raw, avg(total_score) * 0.7 as judge_weighted
from public.evaluation_scores
where evaluator_role = 'judge'
group by session_id, team_id;

create or replace view public.v_evaluation_peer_summary as
with ranked as (
  select session_id, team_id, total_score, created_at,
    row_number() over (partition by session_id, team_id order by total_score asc, created_at asc) as rn_low,
    row_number() over (partition by session_id, team_id order by total_score desc, created_at asc) as rn_high,
    count(*) over (partition by session_id, team_id) as score_count
  from public.evaluation_scores
  where evaluator_role = 'peer'
), trimmed as (
  select * from ranked where not (score_count >= 5 and (rn_low = 1 or rn_high = 1))
)
select session_id, team_id, count(*) as peer_count, avg(total_score) as peer_avg
from trimmed
group by session_id, team_id;

create or replace view public.v_evaluation_final_results as
select
  t.session_id,
  t.id as team_id,
  t.team_no,
  t.team_name,
  t.project_title,
  t.topic_summary,
  coalesce(j.judge_count, 0) as judge_count,
  coalesce(j.judge_avg_raw, 0) as judge_avg_raw,
  coalesce(j.judge_weighted, 0) as judge_weighted,
  coalesce(p.peer_count, 0) as peer_count,
  coalesce(p.peer_avg, 0) as peer_avg,
  coalesce(j.judge_weighted, 0) + coalesce(p.peer_avg, 0) as final_score
from public.evaluation_teams t
left join public.v_evaluation_judge_summary j on j.session_id = t.session_id and j.team_id = t.id
left join public.v_evaluation_peer_summary p on p.session_id = t.session_id and p.team_id = t.id
where t.is_active = true;

alter table public.evaluation_sessions enable row level security;
alter table public.evaluation_teams enable row level security;
alter table public.evaluation_participants enable row level security;
alter table public.evaluation_judges enable row level security;
alter table public.evaluation_scores enable row level security;

create policy evaluation_sessions_public_read on public.evaluation_sessions for select to anon, authenticated using(is_active = true or public.is_researcher_or_professor());
create policy evaluation_sessions_staff_all on public.evaluation_sessions for all to authenticated using(public.is_researcher_or_professor()) with check(public.is_researcher_or_professor());

create policy evaluation_teams_public_read on public.evaluation_teams for select to anon, authenticated using(is_active = true);
create policy evaluation_teams_staff_all on public.evaluation_teams for all to authenticated using(public.is_researcher_or_professor()) with check(public.is_researcher_or_professor());

create policy evaluation_participants_public_read on public.evaluation_participants for select to anon, authenticated using(is_active = true);
create policy evaluation_participants_staff_all on public.evaluation_participants for all to authenticated using(public.is_researcher_or_professor()) with check(public.is_researcher_or_professor());

create policy evaluation_judges_public_read on public.evaluation_judges for select to anon, authenticated using(is_active = true);
create policy evaluation_judges_staff_all on public.evaluation_judges for all to authenticated using(public.is_researcher_or_professor()) with check(public.is_researcher_or_professor());

create policy evaluation_scores_public_read on public.evaluation_scores for select to anon, authenticated using(true);
create policy evaluation_scores_public_insert on public.evaluation_scores for insert to anon, authenticated with check(true);
create policy evaluation_scores_public_update on public.evaluation_scores for update to anon, authenticated using(true) with check(true);

create trigger evaluation_sessions_updated before update on public.evaluation_sessions for each row execute function public.set_updated_at();
create trigger evaluation_teams_updated before update on public.evaluation_teams for each row execute function public.set_updated_at();
create trigger evaluation_participants_updated before update on public.evaluation_participants for each row execute function public.set_updated_at();
create trigger evaluation_judges_updated before update on public.evaluation_judges for each row execute function public.set_updated_at();
create trigger evaluation_scores_updated before update on public.evaluation_scores for each row execute function public.set_updated_at();

notify pgrst, 'reload schema';
