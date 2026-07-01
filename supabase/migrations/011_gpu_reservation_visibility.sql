create policy teams_gpu_reservations_read
on public.teams
for select
to authenticated
using (
  exists (
    select 1
    from public.gpu_reservations
    where gpu_reservations.team_id = teams.id
  )
);

create policy profiles_gpu_reservation_requesters_read
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.gpu_reservations
    where gpu_reservations.requested_by = profiles.id
  )
);

notify pgrst, 'reload schema';
