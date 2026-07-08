create policy evaluation_scores_staff_delete
on public.evaluation_scores
for delete
to authenticated
using (public.is_researcher_or_professor());

notify pgrst, 'reload schema';
