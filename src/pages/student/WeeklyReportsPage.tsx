import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Button, Card, PageHeader } from "@/components/ui";
import { useAuth } from "@/auth/AuthProvider";
import { useMyTeam } from "@/hooks/useMyTeam";
import { supabase } from "@/lib/supabase";

interface Report {
  id: string;
  week_no: number;
  report_date: string;
  title: string;
  progress_summary: string | null;
  completed_items: unknown;
  next_items: unknown;
  issues: string | null;
  support_needed: string | null;
  status: string;
}
const empty = {
  week_no: "1",
  report_date: new Date().toISOString().slice(0, 10),
  title: "",
  progress_summary: "",
  completed_items: "",
  next_items: "",
  issues: "",
  support_needed: "",
};
export function WeeklyReportsPage() {
  const { profile } = useAuth();
  const { team, loading } = useMyTeam();
  const [reports, setReports] = useState<Report[]>([]);
  const [form, setForm] = useState(empty);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    if (!team) return;
    const { data } = await supabase
      .from("weekly_reports")
      .select("*")
      .eq("team_id", team.id)
      .order("week_no");
    setReports((data ?? []) as Report[]);
  }, [team]);
  useEffect(() => {
    void load();
  }, [load]);
  async function save(event: FormEvent, submit = false) {
    event.preventDefault();
    if (!team || !profile) return;
    const payload = {
      team_id: team.id,
      week_no: Number(form.week_no),
      report_date: form.report_date,
      title: form.title,
      progress_summary: form.progress_summary,
      completed_items: list(form.completed_items),
      next_items: list(form.next_items),
      issues: form.issues,
      support_needed: form.support_needed,
      status: submit ? "submitted" : "draft",
      submitted_by: profile.id,
      submitted_at: submit ? new Date().toISOString() : null,
    };
    const { error } = await supabase
      .from("weekly_reports")
      .upsert(payload, { onConflict: "team_id,week_no" });
    setMessage(
      error?.message ??
        (submit ? "보고서를 제출했습니다." : "임시 저장했습니다."),
    );
    if (!error) {
      setForm({ ...empty, week_no: String(Number(form.week_no) + 1) });
      await load();
    }
  }
  if (loading) return <p>불러오는 중…</p>;
  if (!team)
    return (
      <PageHeader eyebrow="Student" title="주간(일)보고">
        팀 배정 후 작성할 수 있습니다.
      </PageHeader>
    );
  return (
    <>
      <PageHeader eyebrow={team.name} title="주간(일)보고">
        주차와 작성일을 기준으로 진행, 다음 계획, 이슈와 지원 요청을 기록합니다.
      </PageHeader>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <form onSubmit={(event) => save(event, false)} className="space-y-4">
            <Field
              label="주차"
              type="number"
              value={form.week_no}
              set={(value) => setForm({ ...form, week_no: value })}
            />
            <Field
              label="작성일"
              type="date"
              value={form.report_date}
              set={(value) => setForm({ ...form, report_date: value })}
            />
            <Field
              label="제목"
              value={form.title}
              set={(value) => setForm({ ...form, title: value })}
            />
            <Area
              label="진행 요약"
              value={form.progress_summary}
              set={(value) => setForm({ ...form, progress_summary: value })}
            />
            <Area
              label="완료 항목 "
              value={form.completed_items}
              set={(value) => setForm({ ...form, completed_items: value })}
            />
            <Area
              label="다음 계획 "
              value={form.next_items}
              set={(value) => setForm({ ...form, next_items: value })}
            />
            <Area
              label="이슈"
              value={form.issues}
              set={(value) => setForm({ ...form, issues: value })}
            />
            <Area
              label="지원 요청"
              value={form.support_needed}
              set={(value) => setForm({ ...form, support_needed: value })}
            />
            <div className="flex gap-2">
              <Button>임시 저장</Button>
              <Button
                type="button"
                className="bg-emerald-700"
                onClick={(event) => save(event as unknown as FormEvent, true)}
              >
                제출
              </Button>
            </div>
          </form>
          {message && (
            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">{message}</p>
          )}
        </Card>
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <div className="flex justify-between">
                <strong>
                  {report.week_no}주차 ({report.report_date}) · {report.title}
                </strong>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                  {report.status === "submitted" ? "제출" : "작성중"}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                {report.progress_summary || "진행 요약 없음"}
              </p>
              {report.issues && (
                <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                  이슈: {report.issues}
                </p>
              )}
            </Card>
          ))}
          {!reports.length && (
            <Card className="border-dashed text-center text-slate-500">
              작성된 보고서가 없습니다.
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
const cls = "mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm";
function Field({
  label,
  value,
  set,
  type = "text",
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <input
        required
        className={cls}
        type={type}
        min={type === "number" ? 1 : undefined}
        value={value}
        onChange={(e) => set(e.target.value)}
      />
    </label>
  );
}
function Area({
  label,
  value,
  set,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
}) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <textarea
        className={`${cls} min-h-20`}
        value={value}
        onChange={(e) => set(e.target.value)}
      />
    </label>
  );
}
function list(value: string) {
  return value
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);
}
