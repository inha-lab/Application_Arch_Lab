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
  submitted_at: string | null;
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
  const [editingId, setEditingId] = useState<string | null>(null);
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
  async function save(submit = false) {
    if (!team || !profile) return;
    const editingReport = reports.find((report) => report.id === editingId);
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
      status: submit ? "submitted" : (editingReport?.status ?? "draft"),
      submitted_by: submit
        ? profile.id
        : editingReport
          ? undefined
          : profile.id,
      submitted_at: submit
        ? new Date().toISOString()
        : editingReport?.submitted_at,
    };
    const query = editingId
      ? supabase.from("weekly_reports").update(payload).eq("id", editingId)
      : supabase
          .from("weekly_reports")
          .insert(payload);
    const { error } = await query;
    setMessage(
      error?.message ??
        (editingId
          ? submit
            ? "보고서를 수정하여 다시 제출했습니다."
            : "보고서 수정 내용을 저장했습니다."
          : submit
            ? "보고서를 제출했습니다."
            : "임시 저장했습니다."),
    );
    if (!error) {
      const nextWeek = String(
        Math.max(
          Number(form.week_no),
          ...reports.map((report) => report.week_no),
        ) + 1,
      );
      await load();
      resetForm(nextWeek);
    }
  }
  function edit(report: Report) {
    setEditingId(report.id);
    setForm({
      week_no: String(report.week_no),
      report_date: report.report_date,
      title: report.title,
      progress_summary: report.progress_summary ?? "",
      completed_items: itemText(report.completed_items),
      next_items: itemText(report.next_items),
      issues: report.issues ?? "",
      support_needed: report.support_needed ?? "",
    });
    setMessage(`${report.week_no}주차 보고서를 수정하고 있습니다.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function resetForm(nextWeek = "1") {
    setEditingId(null);
    setForm({ ...empty, week_no: nextWeek });
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
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="font-black">
              {editingId ? "보고서 수정" : "새 보고서 작성"}
            </h2>
            {editingId && (
              <Button
                type="button"
                className="bg-slate-600"
                onClick={() => {
                  resetForm(
                    String(
                      Math.max(
                        0,
                        ...reports.map((report) => report.week_no),
                      ) + 1,
                    ),
                  );
                  setMessage("");
                }}
              >
                수정 취소
              </Button>
            )}
          </div>
          <form
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              void save(false);
            }}
            className="space-y-4"
          >
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
              <Button>{editingId ? "수정 저장" : "임시 저장"}</Button>
              <Button
                type="button"
                className="bg-emerald-700"
                onClick={() => void save(true)}
              >
                {editingId ? "수정 후 제출" : "제출"}
              </Button>
            </div>
          </form>
          {message && (
            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">{message}</p>
          )}
        </Card>
        <div className="space-y-4">
          {reports.map((report) => (
            <Card
              key={report.id}
              className={editingId === report.id ? "ring-2 ring-inha-500" : ""}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <strong>
                  {report.week_no}주차 ({report.report_date}) · {report.title}
                </strong>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                    {statusName(report.status)}
                  </span>
                  <Button
                    type="button"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => edit(report)}
                  >
                    수정
                  </Button>
                </div>
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
function itemText(value: unknown) {
  if (Array.isArray(value)) return value.map(String).join("\n");
  if (typeof value === "string") return value;
  return "";
}
function statusName(status: string) {
  if (status === "reviewed") return "검토완료";
  if (status === "submitted") return "제출";
  return "작성중";
}
