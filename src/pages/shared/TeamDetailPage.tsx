import {
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, PageHeader } from "@/components/ui";
import { supabase } from "@/lib/supabase";

interface TeamDetail {
  id: string;
  name: string;
  project_name: string | null;
  topic: string | null;
  internship_company: string | null;
  status: string;
  github_url: string | null;
  notion_url: string | null;
  demo_url: string | null;
  team_members: {
    id: string;
    is_leader: boolean;
    profiles: {
      name: string;
      department: string | null;
      student_no: string | null;
      email: string;
    } | null;
  }[];
  project_plans: Record<string, unknown>[];
  weekly_reports: {
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
  }[];
  project_artifacts: {
    id: string;
    title: string;
    artifact_type: string;
    url: string | null;
    file_path: string | null;
  }[];
}
const stages = [
  ["planning", "기획"],
  ["design", "설계"],
  ["implementation", "구현"],
  ["presentation", "발표"],
  ["completed", "완료"],
];

export function TeamDetailPage({teamId:providedTeamId,embedded=false}:{teamId?:string;embedded?:boolean}={}) {
  const { teamId:routeTeamId } = useParams();
  const teamId=providedTeamId??routeTeamId;
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!teamId) return;
    supabase
      .from("teams")
      .select(
        "id,name,project_name,topic,internship_company,status,github_url,notion_url,demo_url,team_members(id,is_leader,profiles(name,department,student_no,email)),project_plans(*),weekly_reports(id,week_no,report_date,title,progress_summary,completed_items,next_items,issues,support_needed,status),project_artifacts(id,title,artifact_type,url,file_path)",
      )
      .eq("id", teamId)
      .single()
      .then(({ data, error: queryError }) => {
        if (queryError) setError(queryError.message);
        if (data)
          setTeam({
            ...data,
            team_members: array(data.team_members),
            project_plans: array(data.project_plans),
            weekly_reports: array(data.weekly_reports).sort(
              (a, b) =>
                Number((a as { week_no: number }).week_no) -
                Number((b as { week_no: number }).week_no),
            ),
            project_artifacts: array(data.project_artifacts),
          } as unknown as TeamDetail);
        setLoading(false);
      });
  }, [teamId]);
  async function download(path: string) {
    const { data, error } = await supabase.storage
      .from("project-artifacts")
      .createSignedUrl(path, 60);
    if (error) {
      setError(error.message);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }
  if (loading)
    return <p className="text-slate-500">팀 종합 현황을 불러오는 중…</p>;
  if (error && !team)
    return <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>;
  if (!team) return null;
  const plan = team.project_plans[0] ?? {};
  const current = Math.max(
    0,
    stages.findIndex(([key]) => key === team.status),
  );
  return (
    <>
      {!embedded&&<Link
        to=".."
        relative="path"
        className="mb-5 inline-flex items-center gap-1 text-sm font-bold text-slate-500"
      >
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </Link>}
      <PageHeader eyebrow={embedded?"My team integrated view":"Integrated monitoring"} title={team.name}>
        {team.project_name || team.topic || "프로젝트 미정"}
      </PageHeader>
      {error && (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <Card className="mt-8">
        <h2 className="font-black">프로젝트 진행 단계</h2>
        <div className="mt-6 grid grid-cols-5 gap-2">
          {stages.map(([key, label], index) => (
            <div
              key={key}
              className={`rounded-xl p-3 text-center text-xs font-bold ${index <= current ? "bg-inha-950 text-white" : "bg-slate-100 text-slate-400"}`}
            >
              {index < current ? (
                <CheckCircle2 className="mx-auto mb-1 h-4 w-4" />
              ) : (
                <span className="mb-1 block">{index + 1}</span>
              )}
              {label}
            </div>
          ))}
        </div>
      </Card>
      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-inha-700" />
            <h2 className="font-black">
              참여자 · {team.team_members.length}명
            </h2>
          </div>
          <div className="mt-4 space-y-3">
            {team.team_members.map((member) => (
              <div className="rounded-xl bg-slate-50 p-3" key={member.id}>
                <strong>
                  {member.profiles?.name}
                  {member.is_leader ? " · 팀장" : ""}
                </strong>
                <p className="mt-1 text-xs text-slate-500">
                  {member.profiles?.department || "—"} ·{" "}
                  {member.profiles?.student_no || "—"} ·{" "}
                  {member.profiles?.email}
                </p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-inha-700" />
            <h2 className="font-black">프로젝트 기획서</h2>
          </div>
          {Object.keys(plan).length ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Info label="한 줄 정의" value={plan.one_line_summary} />
              <Info label="타겟 사용자" value={plan.target_users} />
              <Info label="해결하는 문제" value={plan.problem_statement} wide />
              <Info label="Must Have" value={listText(plan.must_have)} />
              <Info label="Should Have" value={listText(plan.should_have)} />
              <Info label="기술 스택" value={listText(plan.tech_stack)} />
              <Info label="4주 계획" value={listText(plan.four_week_plan)} />
              <Info label="인턴십 연결" value={plan.internship_link} wide />
              <Info label="기대 성과" value={plan.expected_outcome} wide />
            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-500">
              작성된 기획서가 없습니다.
            </p>
          )}
        </Card>
      </div>
      <section className="mt-8">
        <h2 className="text-xl font-black">주간(일)보고</h2>
        <div className="mt-4 space-y-4">
          {team.weekly_reports.map((report) => (
            <Card key={report.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-black">
                  {report.week_no}주차 ({report.report_date}) · {report.title}
                </h3>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                  {report.status === "reviewed"
                    ? "검토완료"
                    : report.status === "submitted"
                      ? "제출"
                      : "작성중"}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                {report.progress_summary || "진행 요약 없음"}
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <ReportBox
                  label="완료 항목"
                  value={listText(report.completed_items)}
                />
                <ReportBox
                  label="다음 계획"
                  value={listText(report.next_items)}
                />
                {report.issues && (
                  <ReportBox label="이슈" value={report.issues} alert />
                )}
                {report.support_needed && (
                  <ReportBox
                    label="지원 요청"
                    value={report.support_needed}
                    alert
                  />
                )}
              </div>
            </Card>
          ))}
          {!team.weekly_reports.length && (
            <Card className="border-dashed text-center text-slate-500">
              등록된 보고서가 없습니다.
            </Card>
          )}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-black">산출물</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {team.project_artifacts.map((item) => (
            <Card key={item.id}>
              <p className="text-xs font-bold text-slate-500">
                {item.artifact_type}
              </p>
              <h3 className="mt-2 font-black">{item.title}</h3>
              <div className="mt-4 flex gap-2">
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
                  >
                    URL
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {item.file_path && (
                  <button
                    onClick={() => download(item.file_path!)}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold"
                  >
                    첨부
                    <Download className="h-3 w-3" />
                  </button>
                )}
              </div>
            </Card>
          ))}
          {!team.project_artifacts.length && (
            <Card className="border-dashed text-center text-slate-500 md:col-span-2">
              등록된 산출물이 없습니다.
            </Card>
          )}
        </div>
      </section>
    </>
  );
}

function array<T>(value: T | T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : value ? [value] : [];
}
function listText(value: unknown) {
  return Array.isArray(value) ? value.join("\n") : String(value ?? "");
}
function Info({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: unknown;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
        {String(value ?? "—")}
      </p>
    </div>
  );
}
function ReportBox({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 text-sm ${alert ? "bg-amber-50 text-amber-800" : "bg-slate-50 text-slate-600"}`}
    >
      <strong className="block text-xs">{label}</strong>
      <p className="mt-1 whitespace-pre-wrap">{value || "—"}</p>
    </div>
  );
}
