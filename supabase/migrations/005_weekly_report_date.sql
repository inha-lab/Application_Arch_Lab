alter table public.weekly_reports
  add column if not exists report_date date not null default current_date;

comment on column public.weekly_reports.report_date is '주차(일)별 보고 기준일';
