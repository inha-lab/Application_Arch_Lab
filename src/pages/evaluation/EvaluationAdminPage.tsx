import { BarChart3, Pencil, QrCode, RefreshCw, RotateCcw, Trash2, Wand2 } from "lucide-react";
import QRCode from "qrcode";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Card, PageHeader } from "@/components/ui";
import { supabase } from "@/lib/supabase";

interface Session { id: string; title: string; description: string | null; is_active: boolean; allow_edit: boolean }
interface ResultRow {
  team_id: string;
  team_no: number;
  team_name: string;
  project_title: string | null;
  judge_count: number;
  judge_avg_raw: number;
  judge_weighted: number;
  peer_count: number;
  peer_avg: number;
  final_score: number;
}
interface SourceTeam {
  id: string;
  name: string;
  project_name: string | null;
  topic: string | null;
  team_members: { profiles: { student_no: string | null; name: string | null } | null }[];
}

const evaluateUrl = "https://inha-lab.github.io/Application_Arch_Lab/evaluate";

export function EvaluationAdminPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", allow_edit: true });

  const load = useCallback(async () => {
    const { data: sessionData, error: sessionError } = await supabase
      .from("evaluation_sessions")
      .select("id,title,description,is_active,allow_edit")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (sessionError) {
      setMessage(sessionError.message);
      return;
    }
    const active = sessionData as Session | null;
    setSession(active);
    if (active) setEditForm({ title: active.title, description: active.description || "", allow_edit: active.allow_edit });
    if (!active) {
      setRows([]);
      setMessage("활성화된 평가 세션이 없습니다.");
      return;
    }
    const { data, error } = await supabase
      .from("v_evaluation_final_results")
      .select("*")
      .eq("session_id", active.id)
      .order("final_score", { ascending: false })
      .order("judge_weighted", { ascending: false });
    if (error) setMessage(error.message);
    else {
      setRows((data ?? []) as ResultRow[]);
      setMessage("");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (canvasRef.current) void QRCode.toCanvas(canvasRef.current, evaluateUrl, { width: 180, margin: 1, color: { dark: "#172554", light: "#ffffff" } });
  }, []);

  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel(`evaluation-dashboard-${session.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "evaluation_scores", filter: `session_id=eq.${session.id}` }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [session, load]);

  const totalJudge = rows.reduce((sum, row) => sum + row.judge_count, 0);
  const totalPeer = rows.reduce((sum, row) => sum + row.peer_count, 0);

  async function createDefaultSession() {
    setBusy(true);
    setMessage("기존 팀 정보로 평가 세션을 생성하는 중…");
    const { data: sourceTeams, error: teamError } = await supabase
      .from("teams")
      .select("id,name,project_name,topic,team_members(profiles(student_no,name))")
      .order("name");
    if (teamError) {
      setBusy(false);
      setMessage(teamError.message);
      return;
    }
    const teams = (sourceTeams ?? []) as unknown as SourceTeam[];
    if (!teams.length) {
      setBusy(false);
      setMessage("기존 팀이 없습니다. 팀을 먼저 생성해 주세요.");
      return;
    }
    await supabase.from("evaluation_sessions").update({ is_active: false }).eq("is_active", true);
    const { data: sessionData, error: sessionError } = await supabase
      .from("evaluation_sessions")
      .insert({ title: "INHA AAL 데모데이 실시간 평가", description: "기존 팀 기준 자동 생성", is_active: true })
      .select("id,title,description,is_active,allow_edit")
      .single();
    if (sessionError || !sessionData) {
      setBusy(false);
      setMessage(sessionError?.message || "평가 세션 생성에 실패했습니다.");
      return;
    }
    const sessionId = (sessionData as Session).id;
    const { data: insertedTeams, error: insertTeamError } = await supabase
      .from("evaluation_teams")
      .insert(teams.map((team, index) => ({
        session_id: sessionId,
        team_no: index + 1,
        team_name: team.name,
        project_title: team.project_name,
        topic_summary: team.topic,
      })))
      .select("id,team_no");
    if (insertTeamError) {
      setBusy(false);
      setMessage(insertTeamError.message);
      return;
    }
    const evalTeams = (insertedTeams ?? []) as { id: string; team_no: number }[];
    const participants = teams.flatMap((team, index) => {
      const evalTeamId = evalTeams.find((item) => item.team_no === index + 1)?.id;
      return team.team_members
        .map((member) => member.profiles)
        .filter((profile): profile is { student_no: string; name: string | null } => Boolean(profile?.student_no && evalTeamId))
        .map((profile) => ({
          session_id: sessionId,
          student_no: profile.student_no,
          student_name: profile.name,
          team_id: evalTeamId,
        }));
    });
    const judges = ["J1", "J2", "J3", "J4", "J5"].map((judge_code) => ({ session_id: sessionId, judge_code, judge_name: `심사위원 ${judge_code}` }));
    if (participants.length) await supabase.from("evaluation_participants").insert(participants);
    await supabase.from("evaluation_judges").insert(judges);
    setBusy(false);
    setMessage(`평가 세션을 생성했습니다. 심사위원 코드는 ${judges.map((judge) => judge.judge_code).join(", ")} 입니다.`);
    await load();
  }

  async function saveSession(event: FormEvent) {
    event.preventDefault();
    if (!session) return;
    setBusy(true);
    const { error } = await supabase
      .from("evaluation_sessions")
      .update({ title: editForm.title, description: editForm.description || null, allow_edit: editForm.allow_edit })
      .eq("id", session.id);
    setBusy(false);
    setMessage(error?.message || "평가 세션 정보를 수정했습니다.");
    if (!error) await load();
  }

  async function clearScores() {
    if (!session) return;
    if (!confirm("현재 평가 세션의 모든 제출 점수를 초기화할까요? 팀/평가자 정보는 유지됩니다.")) return;
    setBusy(true);
    const { error, count } = await supabase.from("evaluation_scores").delete({ count: "exact" }).eq("session_id", session.id);
    setBusy(false);
    setMessage(error?.message || `평가 제출 점수를 초기화했습니다. 삭제 ${count ?? 0}건`);
    if (!error) await load();
  }

  async function resetEvaluation() {
    if (!confirm("기존 활성 평가 세션을 종료하고, 현재 팀 기준으로 새 평가 세션을 다시 생성할까요? 기존 평가 점수는 새 세션에 포함되지 않습니다.")) return;
    await createDefaultSession();
  }

  return (
    <>
      <PageHeader eyebrow="Realtime Evaluation" title="실시간 평가 대시보드">
        공용 QR로 접속한 심사위원·학생 평가 결과를 실시간으로 확인합니다.
      </PageHeader>
      {message && <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{message}</p>}
      {!session && (
        <Card className="mt-6">
          <h2 className="font-black">빠른 시작</h2>
          <p className="mt-2 text-sm text-slate-500">기존 팀과 팀원 정보를 기준으로 평가 세션, 평가 팀, 학생 평가자, 기본 심사위원 코드 J1~J5를 생성합니다.</p>
          <button onClick={() => void createDefaultSession()} disabled={busy} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-inha-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
            <Wand2 className="h-4 w-4" />{busy ? "생성 중…" : "기본 평가 세션 생성"}
          </button>
        </Card>
      )}
      <div className="mt-8 grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="space-y-5">
          <Card>
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-inha-700" />
              <h2 className="font-black">평가 QR</h2>
            </div>
            <canvas ref={canvasRef} className="mx-auto mt-5 rounded-lg" />
            <p className="mt-4 break-all rounded-xl bg-slate-50 p-3 text-xs text-slate-500">{evaluateUrl}</p>
            <button onClick={() => void load()} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200">
              <RefreshCw className="h-4 w-4" />새로고침
            </button>
          </Card>
          {session && (
            <Card>
              <div className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-inha-700" />
                <h2 className="font-black">평가정보 수정</h2>
              </div>
              <form onSubmit={saveSession} className="mt-4 space-y-3">
                <input className="w-full rounded-xl border px-4 py-3 text-sm" value={editForm.title} onChange={(event) => setEditForm({ ...editForm, title: event.target.value })} required />
                <textarea className="min-h-20 w-full rounded-xl border px-4 py-3 text-sm" value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} placeholder="평가 설명" />
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input type="checkbox" checked={editForm.allow_edit} onChange={(event) => setEditForm({ ...editForm, allow_edit: event.target.checked })} />
                  평가 제출 후 수정 허용
                </label>
                <button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-inha-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
                  <Pencil className="h-4 w-4" />수정 저장
                </button>
              </form>
            </Card>
          )}
          <Card>
            <h2 className="font-black">초기화</h2>
            <p className="mt-2 text-xs leading-5 text-slate-500">점수 초기화는 현재 세션의 제출 점수만 삭제합니다. 평가정보 재생성은 기존 활성 세션을 종료하고 현재 팀 기준으로 새 세션을 생성합니다.</p>
            <div className="mt-4 space-y-2">
              <button onClick={() => void clearScores()} disabled={!session || busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 disabled:opacity-50">
                <Trash2 className="h-4 w-4" />평가 점수 초기화
              </button>
              <button onClick={() => void resetEvaluation()} disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 disabled:opacity-50">
                <RotateCcw className="h-4 w-4" />평가정보 재생성
              </button>
            </div>
          </Card>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Metric label="활성 세션" value={session?.title || "없음"} />
          <Metric label="심사위원 제출" value={`${totalJudge}건`} />
          <Metric label="학생 제출" value={`${totalPeer}건`} />
          <Card className="sm:col-span-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-inha-700" />
              <h2 className="font-black">팀별 현재 순위</h2>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="border-y bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5">순위</th>
                    <th className="px-3 py-2.5">팀</th>
                    <th className="px-3 py-2.5">프로젝트</th>
                    <th className="px-3 py-2.5 text-right">심사 평균</th>
                    <th className="px-3 py-2.5 text-right">심사 반영</th>
                    <th className="px-3 py-2.5 text-right">동료 평균</th>
                    <th className="px-3 py-2.5 text-right">최종</th>
                    <th className="px-3 py-2.5 text-right">제출</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((row, index) => (
                    <tr key={row.team_id} className={index === 0 ? "bg-blue-50/50" : ""}>
                      <td className="px-3 py-3 font-black">{index + 1}</td>
                      <td className="px-3 py-3 font-bold">{row.team_name}</td>
                      <td className="px-3 py-3 text-slate-500">{row.project_title || "—"}</td>
                      <td className="px-3 py-3 text-right">{score(row.judge_avg_raw)}</td>
                      <td className="px-3 py-3 text-right">{score(row.judge_weighted)}</td>
                      <td className="px-3 py-3 text-right">{score(row.peer_avg)}</td>
                      <td className="px-3 py-3 text-right text-lg font-black text-inha-700">{score(row.final_score)}</td>
                      <td className="px-3 py-3 text-right">J {row.judge_count} / P {row.peer_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!rows.length && <p className="py-10 text-center text-sm text-slate-400">평가 대상 팀이 없습니다.</p>}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card><p className="text-xs font-bold text-slate-500">{label}</p><strong className="mt-2 block text-2xl">{value}</strong></Card>;
}
function score(value: number) {
  return Number(value || 0).toFixed(2);
}
