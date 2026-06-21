create or replace function public.set_own_team_status(
  target_team_id uuid,
  next_status public.project_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_team_member(target_team_id) then
    raise exception '본인 팀의 진행 단계만 변경할 수 있습니다.';
  end if;

  update public.teams
  set status = next_status,
      updated_at = now()
  where id = target_team_id;
end;
$$;

revoke all on function public.set_own_team_status(uuid, public.project_status) from public;
grant execute on function public.set_own_team_status(uuid, public.project_status) to authenticated;
