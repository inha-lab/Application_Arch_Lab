import { Crown, ExternalLink, Users } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";
import { useMyTeam } from "@/hooks/useMyTeam";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const projectStages=[['planning','기획'],['design','설계'],['implementation','구현'],['presentation','발표'],['completed','완료']] as const;

export function StudentTeamPage() {
  const { team, loading, reload } = useMyTeam();
  const [message,setMessage]=useState('');
  const [changing,setChanging]=useState(false);
  async function changeStatus(status:string){if(!team)return;setChanging(true);setMessage('');const{error}=await supabase.rpc('set_own_team_status',{target_team_id:team.id,next_status:status});setChanging(false);setMessage(error?.message??`${statusName(status)} 단계로 변경했습니다.`);if(!error)await reload()}
  if (loading) return <p className="text-slate-500">팀 정보를 불러오는 중…</p>;
  if (!team)
    return (
      <>
        <PageHeader eyebrow="Student" title="내 팀">
          아직 배정된 팀이 없습니다.
        </PageHeader>
        <Card className="mt-8 text-center text-slate-500">
          담당 교수의 팀 배정을 기다려 주세요.
        </Card>
      </>
    );
  return (
    <>
      <PageHeader eyebrow="My team" title={team.name}>
        {team.project_name || team.topic || "프로젝트 주제를 준비 중입니다."}
      </PageHeader>
      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1.35fr]">
        <Card>
          <p className="text-xs font-black text-slate-400">PROJECT</p>
          <dl className="mt-5 space-y-4">
            <Info label="기업명" value={team.internship_company} />
            <Info label="프로젝트명" value={team.project_name} />
            <Info label="주제" value={team.topic} />
            <Info label="진행 단계" value={statusName(team.status)} />
          </dl>
          <div className="mt-6 border-t pt-5">
            <p className="text-xs font-black text-slate-500">진행 단계 직접 설정</p>
            <div className="mt-3 flex flex-wrap gap-2">{projectStages.map(([key,label])=><button type="button" disabled={changing} onClick={()=>changeStatus(key)} key={key} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${team.status===key?'bg-inha-950 text-white':'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-inha-700'}`}>{label}</button>)}</div>
            {message&&<p className="mt-3 text-xs text-slate-600">{message}</p>}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              ["GitHub", team.github_url],
              ["Notion", team.notion_url],
              ["Demo", team.demo_url],
            ].map(
              ([label, url]) =>
                url && (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold"
                  >
                    {label}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ),
            )}
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-inha-700" />
            <h2 className="font-black">팀원 · {team.team_members.length}명</h2>
          </div>
          <div className="mt-5 space-y-3">
            {team.team_members.map((member) => (
              <div
                className="flex items-start gap-3 rounded-xl bg-slate-50 p-4"
                key={member.id}
              >
                {member.is_leader ? (
                  <Crown className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                ) : (
                  <Users className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong>{member.profiles?.name ?? "팀원"}</strong>
                    {member.is_leader && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                        팀장
                      </span>
                    )}
                  </div>
                  <div className="mt-2 grid gap-x-5 gap-y-1 text-xs text-slate-500 sm:grid-cols-2">
                    <span>학과: {member.profiles?.department || "—"}</span>
                    <span>학번: {member.profiles?.student_no || "—"}</span>
                    <span>이메일: {member.profiles?.email || "—"}</span>
                    <span>연락처: {member.profiles?.phone || "—"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-bold text-slate-500">{label}</dt>
      <dd className="mt-1 font-bold">{value || "—"}</dd>
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
