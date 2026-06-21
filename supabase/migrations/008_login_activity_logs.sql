create table public.login_activity_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  user_agent text,
  logged_in_at timestamptz not null default now()
);

create index login_activity_logs_profile_time_idx
  on public.login_activity_logs (profile_id, logged_in_at desc);
create index login_activity_logs_time_idx
  on public.login_activity_logs (logged_in_at desc);

alter table public.login_activity_logs enable row level security;

create policy "managers can read login activity"
on public.login_activity_logs for select to authenticated
using (public.is_professor());

create policy "users can read own login activity"
on public.login_activity_logs for select to authenticated
using (profile_id = auth.uid());

create or replace function public.record_login_activity(client_user_agent text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  log_id uuid;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  insert into public.login_activity_logs (profile_id, email, user_agent)
  select id, email, left(client_user_agent, 1000)
  from public.profiles
  where id = auth.uid()
  returning id into log_id;

  if log_id is null then
    raise exception '프로필을 찾을 수 없습니다.';
  end if;

  return log_id;
end;
$$;

revoke all on function public.record_login_activity(text) from public;
grant execute on function public.record_login_activity(text) to authenticated;
