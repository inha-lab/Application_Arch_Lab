import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { Card, PageHeader } from "@/components/ui";
import { useMyTeam } from "@/hooks/useMyTeam";
import { TeamDetailPage } from "@/pages/shared/TeamDetailPage";
import { supabase } from "@/lib/supabase";
const roleCopy = {
  professor: [
    "수업 운영 대시보드",
    "수강자와 팀 프로젝트의 전체 흐름을 확인하세요.",
  ],
  student: [
    "나의 프로젝트 대시보드",
    "우리 팀의 이번 주 목표와 제출 현황을 확인하세요.",
  ],
  researcher: [
    "수업 운영 대시보드",
    "수강생과 팀 프로젝트의 전체 흐름을 확인하세요.",
  ],
} as const;
export function DashboardPage() {
  const { profile } = useAuth();
  const { team, loading: teamLoading } = useMyTeam();
  const role = profile?.role ?? "student";
  const [stats,setStats]=useState({participants:0,teams:0,reportRate:0,loading:true});
  useEffect(()=>{
    if(role==='student')return
    let active=true
    async function loadStats(){
      const{data:semester}=await supabase.from('semesters').select('id').eq('is_active',true).limit(1).maybeSingle()
      if(!semester){if(active)setStats({participants:0,teams:0,reportRate:0,loading:false});return}
      const[participantResult,teamResult]=await Promise.all([
        supabase.from('participants').select('id',{count:'exact',head:true}).eq('semester_id',semester.id),
        supabase.from('teams').select('id').eq('semester_id',semester.id),
      ])
      const teamIds=(teamResult.data??[]).map(item=>item.id)
      let submitted=0
      if(teamIds.length){const{count}=await supabase.from('weekly_reports').select('id',{count:'exact',head:true}).in('team_id',teamIds).in('status',['submitted','reviewed']);submitted=count??0}
      const teamCount=teamIds.length
      const reportRate=teamCount?Math.min(100,Math.round((submitted/(teamCount*15))*100)):0
      if(active)setStats({participants:participantResult.count??0,teams:teamCount,reportRate,loading:false})
    }
    void loadStats();return()=>{active=false}
  },[role]);
  const cards =
    role === "student"
      ? [
          ["내 팀", teamLoading ? "확인 중" : (team?.name ?? "배정 대기"), team ? `${team.team_members.length}명 참여 중` : "팀 편성 후 표시됩니다.", Users],
          ["프로젝트", team?.project_name ?? "미정", team?.topic ?? "핵심 문제부터 정의해 보세요.", FolderKanban],
          ["진행 단계", team ? statusName(team.status) : "기획", "주간(일)보고로 진행을 기록하세요.", Clock3],
        ]
      : [
          ["수강생", stats.loading ? "—" : `${stats.participants}명`, "활성 학기 등록 기준", Users],
          ["운영 팀", stats.loading ? "—" : `${stats.teams}팀`, "활성 학기 팀 편성 기준", FolderKanban],
          ["보고서 제출률", stats.loading ? "—" : `${stats.reportRate}%`, "팀별 15회 제출 기준", CheckCircle2],
        ];
  return (
    <>
      <PageHeader
        eyebrow={`Welcome, ${profile?.name ?? "User"}`}
        title={roleCopy[role][0]}
      >
        {roleCopy[role][1]}
      </PageHeader>
      <div className="mt-9 grid gap-5 md:grid-cols-3">
        {cards.map(([label, value, description, Icon]) => (
          <Card key={label as string}>
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-inha-700">
                <Icon className="h-5 w-5" />
              </span>
              <ArrowUpRight className="h-5 w-5 text-slate-300" />
            </div>
            <p className="mt-7 text-sm font-bold text-slate-500">
              {label as string}
            </p>
            <strong className="mt-1 block text-3xl font-black">
              {value as string}
            </strong>
            <p className="mt-2 text-xs text-slate-500">
              {description as string}
            </p>
          </Card>
        ))}
      </div>
      <div className="mt-7 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <h2 className="text-lg font-black">프로젝트 여정</h2>
          <div className="mt-7 flex items-center">
            {["기획", "설계", "구현", "발표", "완료"].map((item, i) => (
              <div className="flex flex-1 items-center" key={item}>
                <div>
                  <span
                    className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black ${i <= statusIndex(team?.status) ? "bg-inha-950 text-white" : "bg-slate-100 text-slate-400"}`}
                  >
                    {i + 1}
                  </span>
                  <p className="mt-2 text-xs font-bold">{item}</p>
                </div>
                {i < 4 && <div className="mx-2 h-px flex-1 bg-slate-200" />}
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <h2 className="font-black">시작 안내</h2>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            {role === "student"
              ? team
                ? "하단에서 우리 팀의 기획서, 주간(일)보고, 산출물을 통합 확인할 수 있습니다."
                : "담당 교수의 팀 배정을 기다려 주세요."
              : "전체 팀의 진행 현황을 프로젝트 현황 메뉴에서 확인할 수 있습니다."}
          </p>
          <Link
            to="/mypage"
            className="mt-5 inline-block text-sm font-black text-inha-700"
          >
            내 정보 확인 →
          </Link>
        </Card>
      </div>
      {role === "student" && team && (
        <section className="mt-12 border-t border-slate-200 pt-10">
          <TeamDetailPage teamId={team.id} embedded />
        </section>
      )}
    </>
  );
}

function statusIndex(status?: string) {
  return Math.max(0, ["planning", "design", "implementation", "presentation", "completed"].indexOf(status ?? "planning"));
}
function statusName(status: string) {
  return ({ planning: "기획", design: "설계", implementation: "구현", presentation: "발표", completed: "완료" } as Record<string, string>)[status] ?? status;
}
