-- 연구원은 교수와 동일한 관리 권한을 가진다.
create or replace function public.is_professor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('professor', 'researcher')
  )
$$;

comment on function public.is_professor() is '교수 또는 연구원 관리 권한 확인';
