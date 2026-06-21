insert into storage.buckets (id, name, public, file_size_limit)
values ('project-artifacts', 'project-artifacts', false, 20971520)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

create policy "artifact files readable by team and staff"
on storage.objects for select to authenticated
using (
  bucket_id = 'project-artifacts'
  and (
    public.is_researcher_or_professor()
    or public.is_team_member(
      case
        when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        then ((storage.foldername(name))[1])::uuid
        else null
      end
    )
  )
);

create policy "artifact files uploadable by team and professor"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'project-artifacts'
  and (
    public.is_professor()
    or public.is_team_member(
      case
        when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        then ((storage.foldername(name))[1])::uuid
        else null
      end
    )
  )
);

create policy "artifact files deletable by team and professor"
on storage.objects for delete to authenticated
using (
  bucket_id = 'project-artifacts'
  and (
    public.is_professor()
    or public.is_team_member(
      case
        when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        then ((storage.foldername(name))[1])::uuid
        else null
      end
    )
  )
);
