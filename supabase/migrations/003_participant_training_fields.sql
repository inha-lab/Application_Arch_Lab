alter table public.participants
  add column if not exists training_job text,
  add column if not exists participation_year integer,
  add column if not exists course_type text;

comment on column public.participants.training_job is '훈련직무';
comment on column public.participants.participation_year is '참여연도';
comment on column public.participants.course_type is '과정구분';
