import {
  AlertCircle,
  ClipboardList,
  CheckCircle2,
  FileText,
  FolderKanban,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { Card, PageHeader } from "@/components/ui";
import { supabase } from "@/lib/supabase";

interface MonitorTeam {
  id: string;
  name: string;
  project_name: string | null;
  topic: string | null;
  status: string;
  team_members: { id: string;profiles:{name:string}|null }[];
  project_plans: { submitted_at: string | null;one_line_summary:string|null;problem_statement:string|null }[];
  weekly_reports: {
    id: string;
    week_no: number;
    report_date:string;
    title:string;
    progress_summary:string|null;
    status: string;
    issues: string | null;
    support_needed: string | null;
  }[];
  project_artifacts: { id: string }[];
}

export function MonitoringPage({
  mode = "monitoring",
}: {
  mode?: "monitoring" | "projects" | "reports";
}) {
  const [teams, setTeams] = useState<MonitorTeam[]>([]);
  const {profile}=useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    supabase
      .from("teams")
      .select(
        "id,name,project_name,topic,status,team_members(id,profiles(name)),project_plans(submitted_at,one_line_summary,problem_statement),weekly_reports(id,week_no,report_date,title,progress_summary,status,issues,support_needed),project_artifacts(id)",
      )
      .order("name")
      .then(({ data, error: queryError }) => {
        if (queryError) setError(queryError.message);
        setTeams(
          (data ?? []).map((team) => ({
            ...team,
            team_members: array(team.team_members),
            project_plans: array(team.project_plans),
            weekly_reports: array(team.weekly_reports),
            project_artifacts: array(team.project_artifacts),
          })) as unknown as MonitorTeam[],
        );
        setLoading(false);
      });
  }, []);
  if (loading)
    return <p className="text-slate-500">진행 현황을 불러오는 중…</p>;
  const submittedPlans = teams.filter((team) =>
    team.project_plans.some((plan) => plan.submitted_at),
  ).length;
  const submittedReports = teams.reduce(
    (sum, team) =>
      sum +
      team.weekly_reports.filter((report) => report.status !== "draft").length,
    0,
  );
  return (
    <>
      <PageHeader
        eyebrow="Professor · Researcher"
        title={
          mode === "projects"
            ? "프로젝트 현황"
            : mode === "reports"
              ? "주간(일)보고"
              : "팀별 모니터링"
        }
      >
        전체 팀의 프로젝트 단계와 제출 현황을 확인합니다.
      </PageHeader>
      {error && (
        <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          icon={FolderKanban}
          label="전체 팀"
          value={`${teams.length}팀`}
        />
        <Metric
          icon={Users}
          label="전체 팀원"
          value={`${teams.reduce((sum, team) => sum + team.team_members.length, 0)}명`}
        />
        <Metric
          icon={CheckCircle2}
          label="기획서 제출"
          value={`${submittedPlans}/${teams.length}`}
        />
        <Metric
          icon={FileText}
          label="보고서 제출"
          value={`${submittedReports}건`}
        />
      </div>
      {mode === "reports" ? <ReportGroups teams={teams} basePath={`/${profile?.role==='researcher'?'researcher':'professor'}/reports`}/> : <div className="mt-7 grid gap-5 lg:grid-cols-2">
        {teams.map((team) => (
          <Card key={team.id}>
            <div className="flex items-start justify-between">
              <div>
                <Link className="text-lg font-black text-inha-950 hover:text-inha-700 hover:underline" to={`/${profile?.role==='researcher'?'researcher':'professor'}/${mode==='monitoring'?'monitoring':'projects'}/${team.id}`}>{team.name}</Link>
                <p className="mt-1 text-sm text-slate-500">
                  {team.project_name || team.topic || "프로젝트 미정"}
                </p>
                <p className="mt-2 text-xs text-slate-500">참여자: {team.team_members.map(member=>member.profiles?.name).filter(Boolean).join(', ')||'미배정'}</p>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                {statusName(team.status)}
              </span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <Stat label="팀원" value={`${team.team_members.length}명`} />
              <Stat
                label="기획서"
                value={
                  team.project_plans.some((plan) => plan.submitted_at)
                    ? "제출"
                    : "미제출"
                }
              />
              <Stat
                label="보고서"
                value={`${team.weekly_reports.filter((report) => report.status !== "draft").length}건`}
              />
            </div>
            {team.weekly_reports.some(
              (report) => report.issues || report.support_needed,
            ) && (
              <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                <AlertCircle className="mr-1 inline h-4 w-4" />
                이슈 또는 지원 요청이 있습니다.
              </div>
            )}
            <Link
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-inha-950 px-4 py-3 text-sm font-black text-white transition hover:bg-inha-800"
              to={`/${profile?.role==='researcher'?'researcher':'professor'}/${mode==='monitoring'?'monitoring':'projects'}/${team.id}`}
            >
              <ClipboardList className="h-4 w-4" />
              전체리포트
            </Link>
          </Card>
        ))}
        {!teams.length && !error && (
          <Card className="border-dashed text-center text-slate-500 lg:col-span-2">
            등록된 팀이 없습니다.
          </Card>
        )}
      </div>}
    </>
  );
}

function ReportGroups({teams,basePath}:{teams:MonitorTeam[];basePath:string}){
  return <div className="mt-7 space-y-6">{teams.map(team=><Card className="overflow-hidden p-0" key={team.id}><div className="flex flex-wrap items-start justify-between gap-4 border-b bg-slate-50 p-5"><div><Link to={`${basePath}/${team.id}`} className="text-lg font-black text-inha-950 hover:text-inha-700 hover:underline">{team.name}</Link><p className="mt-1 text-sm text-slate-500">{team.project_name||team.topic||'프로젝트 미정'}</p><p className="mt-2 text-xs text-slate-500">참여자: {team.team_members.map(member=>member.profiles?.name).filter(Boolean).join(', ')||'미배정'}</p></div><div className="text-right"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">기획서 {team.project_plans.some(plan=>plan.submitted_at)?'제출':'미제출'}</span><p className="mt-2 text-xs text-slate-500">보고서 {team.weekly_reports.length}건</p></div></div><div className="p-5"><div className="mb-4 rounded-xl bg-blue-50 p-4"><p className="text-xs font-black text-blue-700">프로젝트 기획서</p><p className="mt-1 font-bold">{team.project_plans[0]?.one_line_summary||'기획서 미작성'}</p>{team.project_plans[0]?.problem_statement&&<p className="mt-2 line-clamp-2 text-xs text-slate-600">{team.project_plans[0].problem_statement}</p>}</div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-y bg-slate-50 text-xs text-slate-500"><tr><th className="px-3 py-2.5">주차</th><th className="px-3 py-2.5">작성일</th><th className="px-3 py-2.5">제목</th><th className="px-3 py-2.5">진행 요약</th><th className="px-3 py-2.5">상태</th></tr></thead><tbody className="divide-y">{team.weekly_reports.map(report=><tr key={report.id} className="hover:bg-blue-50/50"><td className="px-3 py-3 font-bold">{report.week_no}주차</td><td className="whitespace-nowrap px-3 py-3 text-slate-500">{report.report_date}</td><td className="px-3 py-3"><Link className="font-bold text-inha-700 hover:underline" to={`${basePath}/${team.id}/${report.id}`}>{report.title}</Link></td><td className="max-w-md px-3 py-3"><p className="line-clamp-2 text-slate-600">{report.progress_summary||'진행 요약 없음'}</p></td><td className="px-3 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{report.status==='reviewed'?'검토완료':report.status==='submitted'?'제출':'작성중'}</span></td></tr>)}</tbody></table>{!team.weekly_reports.length&&<p className="py-8 text-center text-sm text-slate-400">등록된 주간(일)보고가 없습니다.</p>}</div></div></Card>)}{!teams.length&&<Card className="border-dashed text-center text-slate-500">등록된 팀이 없습니다.</Card>}</div>
}

function array<T>(value: T | T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : value ? [value] : [];
}
function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <Icon className="h-5 w-5 text-inha-700" />
      <p className="mt-4 text-xs font-bold text-slate-500">{label}</p>
      <strong className="mt-1 block text-2xl">{value}</strong>
    </Card>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-[11px] text-slate-500">{label}</p>
      <strong className="mt-1 block text-sm">{value}</strong>
    </div>
  );
}
function statusName(status: string) {
  return (
    (
      {
        planning: "기획",
        design: "설계",
        implementation: "구현",
        presentation: "발표",
        completed: "완료",
      } as Record<string, string>
    )[status] ?? status
  );
}
