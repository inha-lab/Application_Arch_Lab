alter table public.participants
  add column if not exists company_name text;

comment on column public.participants.company_name is '수강자의 인턴십 또는 연계 기업명';
