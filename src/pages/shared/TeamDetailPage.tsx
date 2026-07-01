import {
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Printer,
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
    submitted_at: string;
    description: string | null;
  }[];
}
const stages = [
  ["planning", "기획"],
  ["design", "설계"],
  ["implementation", "구현"],
  ["presentation", "발표"],
  ["completed", "완료"],
];
const reportTitle = "인하대학교 어플리케이션 설계 PBL- 2026여름학기";

export function TeamDetailPage({teamId:providedTeamId,embedded=false}:{teamId?:string;embedded?:boolean}={}) {
  const { teamId:routeTeamId } = useParams();
  const teamId=providedTeamId??routeTeamId;
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatedAt, setGeneratedAt] = useState(() => new Date());
  useEffect(() => {
    if (!teamId) return;
    supabase
      .from("teams")
      .select(
        "id,name,project_name,topic,internship_company,status,github_url,notion_url,demo_url,team_members(id,is_leader,profiles(name,department,student_no,email)),project_plans(*),weekly_reports(id,week_no,report_date,title,progress_summary,completed_items,next_items,issues,support_needed,status),project_artifacts(id,title,artifact_type,url,file_path,description,submitted_at)",
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
            project_artifacts: array(data.project_artifacts).sort(
              (a, b) =>
                new Date((b as { submitted_at: string }).submitted_at).getTime() -
                new Date((a as { submitted_at: string }).submitted_at).getTime(),
            ),
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
  function printReport() {
    setGeneratedAt(new Date());
    setTimeout(() => window.print(), 0);
  }
  function downloadReport() {
    if (!team) return;
    const generated = new Date();
    setGeneratedAt(generated);
    const blob = new Blob([buildReportHtml(team, generated)], {
      type: "text/html;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeFileName(team.name)}_전체리포트.html`;
    link.click();
    URL.revokeObjectURL(url);
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
      <div className="print:hidden">
        <PageHeader
          eyebrow={embedded ? "My team integrated view" : "Integrated monitoring"}
          title={embedded ? team.name : `${team.name} 전체 리포트`}
        >
          {team.project_name || team.topic || "프로젝트 미정"}
        </PageHeader>
      </div>
      <div className="hidden print:block">
        <p className="text-sm font-bold text-slate-500">제목</p>
        <h1 className="text-2xl font-black">{reportTitle}</h1>
        <p className="mt-2 text-sm text-slate-600">생성일자: {formatDateTime(generatedAt)}</p>
        <p className="mt-4 text-lg font-black">{team.name} 전체 리포트</p>
        <p className="mt-1 text-sm text-slate-600">{team.project_name || team.topic || "프로젝트 미정"}</p>
      </div>
      {!embedded && (
        <div className="mt-5 flex flex-wrap gap-2 print:hidden">
          <button
            onClick={printReport}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-200"
          >
            <Printer className="h-4 w-4" />
            출력
          </button>
          <button
            onClick={downloadReport}
            className="inline-flex items-center gap-2 rounded-xl bg-inha-950 px-4 py-3 text-sm font-black text-white hover:bg-inha-800"
          >
            <Download className="h-4 w-4" />
            전체리포트 다운로드
          </button>
        </div>
      )}
      {error && (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {!embedded && (
        <Card className="mt-8 print:hidden">
          <p className="text-xs font-black text-inha-700">제목</p>
          <h2 className="mt-1 text-xl font-black text-inha-950">{reportTitle}</h2>
          <p className="mt-2 text-sm text-slate-500">생성일자: {formatDateTime(generatedAt)}</p>
        </Card>
      )}
      <Card className={embedded ? "mt-8" : "mt-6"}>
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
          <h2 className="font-black">팀 기본 정보</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Info label="팀명" value={team.name} />
            <Info label="프로젝트 주제" value={team.project_name || team.topic} />
            <Info label="기업명" value={team.internship_company} />
            <Info label="GitHub" value={team.github_url} />
            <Info label="Notion" value={team.notion_url} />
            <Info label="Demo" value={team.demo_url} />
          </div>
        </Card>
      </div>
      <Card className="mt-6">
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
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-xs font-bold text-slate-500">
                  {item.artifact_type}
                </p>
                <span className="text-xs text-slate-400">
                  {formatDate(item.submitted_at)}
                </span>
              </div>
              <h3 className="mt-2 font-black">{item.title}</h3>
              {item.description && (
                <p className="mt-2 text-sm text-slate-600">
                  {item.description}
                </p>
              )}
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
function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ko-KR");
}
function formatDateTime(value: Date) {
  return value.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
function safeFileName(value: string) {
  return value.normalize("NFKC").replace(/[\\/:*?"<>|]+/g, "_").trim() || "team";
}
function escapeHtml(value: unknown) {
  return String(value ?? "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
function htmlLines(value: unknown) {
  return escapeHtml(listText(value)).replace(/\n/g, "<br />");
}
function buildReportHtml(team: TeamDetail, generatedAt: Date) {
  const plan = team.project_plans[0] ?? {};
  const members = team.team_members
    .map(
      (member) =>
        `<li><strong>${escapeHtml(member.profiles?.name)}${member.is_leader ? " · 팀장" : ""}</strong><br /><span>${escapeHtml(member.profiles?.department)} · ${escapeHtml(member.profiles?.student_no)} · ${escapeHtml(member.profiles?.email)}</span></li>`,
    )
    .join("");
  const reports = team.weekly_reports
    .map(
      (report) => `<section>
        <h3>${escapeHtml(report.week_no)}주차 (${escapeHtml(report.report_date)}) · ${escapeHtml(report.title)}</h3>
        <p><strong>상태</strong> ${escapeHtml(report.status === "reviewed" ? "검토완료" : report.status === "submitted" ? "제출" : "작성중")}</p>
        <p><strong>진행 요약</strong><br />${htmlLines(report.progress_summary)}</p>
        <p><strong>완료 항목</strong><br />${htmlLines(report.completed_items)}</p>
        <p><strong>다음 계획</strong><br />${htmlLines(report.next_items)}</p>
        <p><strong>이슈</strong><br />${htmlLines(report.issues || "없음")}</p>
        <p><strong>지원 요청</strong><br />${htmlLines(report.support_needed || "없음")}</p>
      </section>`,
    )
    .join("");
  const artifacts = team.project_artifacts
    .map(
      (item) => `<li>
        <strong>${escapeHtml(item.title)}</strong> (${escapeHtml(item.artifact_type)}, ${escapeHtml(formatDate(item.submitted_at))})<br />
        ${escapeHtml(item.description || "설명 없음")}<br />
        URL: ${escapeHtml(item.url || "—")} / 첨부: ${escapeHtml(item.file_path ? "있음" : "없음")}
      </li>`,
    )
    .join("");
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(reportTitle)}</title>
  <style>
    body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.65;color:#0f172a;max-width:960px;margin:40px auto;padding:0 24px}
    h1{font-size:28px;margin-bottom:4px} h2{border-top:2px solid #0f172a;padding-top:20px;margin-top:32px}
    h3{margin-bottom:4px} section,li{break-inside:avoid} .meta{color:#64748b} ul{padding-left:22px}
    .grid{display:grid;grid-template-columns:160px 1fr;gap:8px 16px}.label{font-weight:700;color:#475569}
    @media print{body{margin:0;max-width:none}.no-print{display:none}}
  </style>
</head>
<body>
  <button class="no-print" onclick="window.print()">출력</button>
  <p class="meta"><strong>제목</strong></p>
  <h1>${escapeHtml(reportTitle)}</h1>
  <p class="meta">생성일자: ${escapeHtml(formatDateTime(generatedAt))}</p>
  <h2>${escapeHtml(team.name)} 전체 리포트</h2>
  <p class="meta">${escapeHtml(team.project_name || team.topic || "프로젝트 미정")}</p>
  <h2>팀 기본 정보</h2>
  <div class="grid">
    <div class="label">팀명</div><div>${escapeHtml(team.name)}</div>
    <div class="label">프로젝트 주제</div><div>${escapeHtml(team.project_name || team.topic)}</div>
    <div class="label">기업명</div><div>${escapeHtml(team.internship_company)}</div>
    <div class="label">진행 단계</div><div>${escapeHtml(stages.find(([key]) => key === team.status)?.[1] ?? team.status)}</div>
    <div class="label">GitHub</div><div>${escapeHtml(team.github_url)}</div>
    <div class="label">Notion</div><div>${escapeHtml(team.notion_url)}</div>
    <div class="label">Demo</div><div>${escapeHtml(team.demo_url)}</div>
  </div>
  <h2>팀원 정보</h2>
  <ul>${members || "<li>미배정</li>"}</ul>
  <h2>프로젝트 기획서</h2>
  <div class="grid">
    <div class="label">한 줄 정의</div><div>${htmlLines(plan.one_line_summary)}</div>
    <div class="label">타겟 사용자</div><div>${htmlLines(plan.target_users)}</div>
    <div class="label">해결하는 문제</div><div>${htmlLines(plan.problem_statement)}</div>
    <div class="label">Must Have</div><div>${htmlLines(plan.must_have)}</div>
    <div class="label">Should Have</div><div>${htmlLines(plan.should_have)}</div>
    <div class="label">기술 스택</div><div>${htmlLines(plan.tech_stack)}</div>
    <div class="label">4주 계획</div><div>${htmlLines(plan.four_week_plan)}</div>
    <div class="label">인턴십 연결</div><div>${htmlLines(plan.internship_link)}</div>
    <div class="label">기대 성과</div><div>${htmlLines(plan.expected_outcome)}</div>
  </div>
  <h2>주간(일)보고</h2>
  ${reports || "<p>등록된 보고서가 없습니다.</p>"}
  <h2>산출물</h2>
  <ul>${artifacts || "<li>등록된 산출물이 없습니다.</li>"}</ul>
</body>
</html>`;
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
