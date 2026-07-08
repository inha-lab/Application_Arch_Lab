import { CheckCircle2, ChevronLeft, ClipboardCheck } from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, PageHeader } from "@/components/ui";
import { supabase } from "@/lib/supabase";

type Role = "judge" | "peer";
interface Session { id: string; title: string; allow_edit: boolean }
interface Team { id: string; team_no: number; team_name: string; project_title: string | null; topic_summary: string | null }
interface Participant { student_no: string; student_name: string | null; team_id: string | null }
interface Judge { judge_code: string; judge_name: string | null }
interface Score { team_id: string; evaluator_role: Role; evaluator_code: string; total_score: number }

const judgeItems = [
  ["j_problem", "문제정의 및 기획력", 20],
  ["j_tech", "기술적 완성도", 25],
  ["j_creativity", "창의성 및 혁신성", 20],
  ["j_practicality", "실용성 및 확장 가능성", 15],
  ["j_presentation", "발표 및 커뮤니케이션", 20],
] as const;
const peerItems = [
  ["p_topic", "주제 선정 및 기획력", 10],
  ["p_impact", "임팩트·몰입도", 10],
  ["p_teamwork", "배울 점·팀워크", 10],
] as const;

export function EvaluatePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | "">("");
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [ownTeamId, setOwnTeamId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [form, setForm] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const verified = Boolean(session && role && code && displayName);

  useEffect(() => {
    supabase.from("evaluation_sessions").select("id,title,allow_edit").eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle().then(({ data }) => {
      setSession(data as Session | null);
    });
  }, []);

  useEffect(() => {
    if (!session || !verified) return;
    void loadTeamsAndScores(session.id, role as Role, code, ownTeamId);
  }, [session, verified, role, code, ownTeamId]);

  async function loadTeamsAndScores(sessionId: string, evaluatorRole: Role, evaluatorCode: string, excludeTeamId: string | null) {
    const [{ data: teamRows }, { data: scoreRows }] = await Promise.all([
      supabase.from("evaluation_teams").select("id,team_no,team_name,project_title,topic_summary").eq("session_id", sessionId).eq("is_active", true).order("team_no"),
      supabase.from("evaluation_scores").select("team_id,evaluator_role,evaluator_code,total_score").eq("session_id", sessionId).eq("evaluator_role", evaluatorRole).eq("evaluator_code", evaluatorCode),
    ]);
    setTeams(((teamRows ?? []) as Team[]).filter((team) => team.id !== excludeTeamId));
    setScores((scoreRows ?? []) as Score[]);
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    if (!session || !role) return;
    const normalized = code.trim();
    if (role === "judge") {
      const { data } = await supabase.from("evaluation_judges").select("judge_code,judge_name").eq("session_id", session.id).eq("judge_code", normalized).eq("is_active", true).maybeSingle();
      if (!data) { setMessage("등록되지 않은 심사위원 코드입니다."); return; }
      const judge = data as Judge;
      setCode(judge.judge_code);
      setDisplayName(judge.judge_name || `심사위원 ${judge.judge_code}`);
      setOwnTeamId(null);
      setMessage("");
      return;
    }
    const { data } = await supabase.from("evaluation_participants").select("student_no,student_name,team_id").eq("session_id", session.id).eq("student_no", normalized).eq("is_active", true).maybeSingle();
    if (!data) { setMessage("등록되지 않은 학번입니다."); return; }
    const participant = data as Participant;
    if (!participant.team_id) { setMessage("소속 팀 정보가 없습니다. 관리자에게 문의해 주세요."); return; }
    setCode(participant.student_no);
    setDisplayName(participant.student_name || participant.student_no);
    setOwnTeamId(participant.team_id);
    setMessage("");
  }

  function openTeam(team: Team) {
    const existing = scores.find((score) => score.team_id === team.id);
    if (existing && session && !session.allow_edit) {
      setMessage("이미 제출한 평가는 수정할 수 없습니다.");
      return;
    }
    setSelectedTeam(team);
    setMessage("");
    if (!existing) {
      setForm({});
      return;
    }
    supabase.from("evaluation_scores").select("*").eq("session_id", session!.id).eq("team_id", team.id).eq("evaluator_role", role).eq("evaluator_code", code).maybeSingle().then(({ data }) => {
      setForm(Object.fromEntries((role === "judge" ? judgeItems : peerItems).map(([key]) => [key, Number((data as Record<string, unknown> | null)?.[key] ?? 0)])));
    });
  }

  async function submitScore(event: FormEvent) {
    event.preventDefault();
    if (!session || !selectedTeam || !role) return;
    const items = role === "judge" ? judgeItems : peerItems;
    const total = items.reduce((sum, [key]) => sum + Number(form[key] ?? 0), 0);
    const payload = {
      session_id: session.id,
      team_id: selectedTeam.id,
      evaluator_role: role,
      evaluator_code: code,
      j_problem: role === "judge" ? Number(form.j_problem ?? 0) : null,
      j_tech: role === "judge" ? Number(form.j_tech ?? 0) : null,
      j_creativity: role === "judge" ? Number(form.j_creativity ?? 0) : null,
      j_practicality: role === "judge" ? Number(form.j_practicality ?? 0) : null,
      j_presentation: role === "judge" ? Number(form.j_presentation ?? 0) : null,
      p_topic: role === "peer" ? Number(form.p_topic ?? 0) : null,
      p_impact: role === "peer" ? Number(form.p_impact ?? 0) : null,
      p_teamwork: role === "peer" ? Number(form.p_teamwork ?? 0) : null,
      total_score: total,
    };
    const { error } = await supabase.from("evaluation_scores").upsert(payload, { onConflict: "session_id,team_id,evaluator_role,evaluator_code" });
    if (error) { setMessage(error.message); return; }
    setMessage("평가가 저장되었습니다.");
    setSelectedTeam(null);
    await loadTeamsAndScores(session.id, role, code, ownTeamId);
  }

  const completed = scores.length;
  const totalTeams = teams.length;
  const allDone = verified && totalTeams > 0 && completed >= totalTeams;

  if (!session) return <Shell><Card className="text-center text-slate-500">활성화된 평가 세션이 없습니다.</Card></Shell>;

  return (
    <Shell>
      <PageHeader eyebrow="Realtime Evaluation" title={session.title}>역할과 개인 코드를 입력한 뒤 팀별 평가를 제출해 주세요.</PageHeader>
      {!verified ? (
        <Card className="mt-8">
          <form onSubmit={verify} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => setRole("judge")} className={`rounded-2xl border p-5 text-left font-black ${role === "judge" ? "border-inha-700 bg-blue-50 text-inha-950" : "bg-white"}`}>심사위원 평가</button>
              <button type="button" onClick={() => setRole("peer")} className={`rounded-2xl border p-5 text-left font-black ${role === "peer" ? "border-inha-700 bg-blue-50 text-inha-950" : "bg-white"}`}>학생 동료평가</button>
            </div>
            <input className="w-full rounded-xl border px-4 py-3" placeholder={role === "judge" ? "심사위원 코드 예: J1" : "학번 입력"} value={code} onChange={(event) => setCode(event.target.value)} required />
            <Button disabled={!role}>평가 시작</Button>
          </form>
          {message && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}
        </Card>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-inha-950 p-5 text-white">
            <div><p className="text-sm text-blue-200">평가자</p><strong>{displayName}</strong></div>
            <div className="text-right"><p className="text-sm text-blue-200">진행 현황</p><strong>{completed} / {totalTeams}팀 완료</strong></div>
          </div>
          {allDone && <Card className="mt-5 border-green-200 bg-green-50 text-green-800"><CheckCircle2 className="mb-2 h-5 w-5" />평가가 완료되었습니다. 필요하면 완료된 팀을 선택해 수정할 수 있습니다.</Card>}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {teams.map((team) => {
              const done = scores.some((score) => score.team_id === team.id);
              return <Card key={team.id} className="flex flex-col"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-slate-500">{team.team_no}팀</p><h2 className="mt-1 font-black">{team.team_name}</h2><p className="mt-1 text-sm text-slate-500">{team.project_title || "프로젝트 미정"}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${done ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>{done ? "완료" : "대기"}</span></div><p className="mt-3 flex-1 text-sm text-slate-600">{team.topic_summary || "주제 설명 없음"}</p><Button className="mt-5" onClick={() => openTeam(team)}>{done ? "평가 수정" : "평가 입력"}</Button></Card>;
            })}
          </div>
        </>
      )}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4">
          <Card className="max-h-[90vh] w-full max-w-xl overflow-y-auto">
            <button onClick={() => setSelectedTeam(null)} className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-slate-500"><ChevronLeft className="h-4 w-4" />목록으로</button>
            <h2 className="text-xl font-black">{selectedTeam.team_name}</h2>
            <p className="mt-1 text-sm text-slate-500">{selectedTeam.project_title || selectedTeam.topic_summary}</p>
            <form onSubmit={submitScore} className="mt-5 space-y-4">
              {(role === "judge" ? judgeItems : peerItems).map(([key, label, max]) => (
                <label key={key} className="block text-sm font-bold">{label} <span className="text-slate-400">/ {max}</span>
                  <input className="mt-2 w-full rounded-xl border px-4 py-3 text-lg font-black" type="number" min={0} max={max} value={form[key] ?? ""} onChange={(event) => setForm({ ...form, [key]: Number(event.target.value) })} required />
                </label>
              ))}
              <div className="rounded-xl bg-slate-50 p-4 text-right font-black">총점 {sumForm(form, role as Role)}점</div>
              <Button className="w-full"><ClipboardCheck className="h-4 w-4" />평가 저장</Button>
            </form>
          </Card>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return <main className="min-h-screen bg-slate-50 p-5"><div className="mx-auto max-w-4xl"><Link to="/" className="mb-6 inline-block text-sm font-bold text-slate-500">← 홈으로</Link>{children}</div></main>;
}
function sumForm(form: Record<string, number>, role: Role) {
  return (role === "judge" ? judgeItems : peerItems).reduce((sum, [key]) => sum + Number(form[key] ?? 0), 0);
}
