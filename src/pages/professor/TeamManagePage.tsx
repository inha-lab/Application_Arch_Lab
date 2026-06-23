import { Building2, Crown, KeyRound, Pencil, Plus, Trash2, Users } from "lucide-react";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button, Card, PageHeader } from "@/components/ui";
import { useSemesters } from "@/hooks/useSemesters";
import { supabase } from "@/lib/supabase";
import type { Participant, Team } from "@/types/management.types";

const emptyForm = { name: "", topic: "", project_name: "" };
const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500";
interface StudentProfile {
  id: string;
  name: string;
  email: string;
  student_no: string | null;
  department: string | null;
  phone: string | null;
}
type TeamCandidate = Participant & { fromProfileOnly?: boolean };

export function TeamManagePage() {
  const { semesters, selectedId, setSelectedId, loading } = useSemesters();
  const [teams, setTeams] = useState<Team[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [leaderId, setLeaderId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!selectedId) return;
    const [teamResult, participantResult, profileResult] = await Promise.all([
      supabase
        .from("teams")
        .select(
          "id,semester_id,name,topic,internship_company,project_name,status,leader_profile_id,team_members(id,profile_id,is_leader,profiles(name,email))",
        )
        .eq("semester_id", selectedId)
        .order("name"),
      supabase
        .from("participants")
        .select(
          "id,semester_id,profile_id,name,department,student_no,phone,email,training_job,company_name,participation_year,course_type,is_registered",
        )
        .eq("semester_id", selectedId)
        .order("name"),
      supabase
        .from("profiles")
        .select("id,name,email,student_no,department,phone")
        .eq("role", "student")
        .order("name"),
    ]);
    if (teamResult.error) setMessage(teamResult.error.message);
    else setTeams((teamResult.data ?? []) as unknown as Team[]);
    if (participantResult.error) setMessage(participantResult.error.message);
    else setParticipants((participantResult.data ?? []) as Participant[]);
    if (profileResult.error) setMessage(profileResult.error.message);
    else setStudentProfiles((profileResult.data ?? []) as StudentProfile[]);
  }, [selectedId]);
  useEffect(() => {
    void load();
  }, [load]);

  const profileOnlyCandidates = useMemo<TeamCandidate[]>(() => {
    const participantProfileIds = new Set(
      participants
        .filter((item) => item.profile_id)
        .map((item) => item.profile_id),
    );
    return studentProfiles
      .filter((profile) => !participantProfileIds.has(profile.id))
      .map((profile) => ({
        id: profile.id,
        semester_id: selectedId,
        profile_id: profile.id,
        name: profile.name,
        department: profile.department,
        student_no: profile.student_no,
        phone: profile.phone,
        email: profile.email,
        training_job: null,
        company_name: null,
        participation_year: null,
        course_type: "학생 계정",
        is_registered: true,
        fromProfileOnly: true,
      }));
  }, [participants, selectedId, studentProfiles]);
  const candidates = useMemo<TeamCandidate[]>(
    () => [...participants, ...profileOnlyCandidates],
    [participants, profileOnlyCandidates],
  );
  const participantByProfile = useMemo(
    () =>
      new Map(
        candidates
          .filter((item) => item.profile_id)
          .map((item) => [item.profile_id!, item]),
      ),
    [candidates],
  );
  const assigned = useMemo(() => {
    const map = new Map<string, string>();
    teams.forEach((team) =>
      team.team_members.forEach((member) => {
        if (team.id !== editingId) map.set(member.profile_id, team.name);
      }),
    );
    return map;
  }, [teams, editingId]);
  const eligible = candidates.filter((item) => item.profile_id && item.is_registered);
  const unlinked = participants.filter((item) => !item.profile_id || !item.is_registered);
  const unassigned = eligible.filter(
    (item) =>
      !teams.some((team) =>
        team.team_members.some(
          (member) => member.profile_id === item.profile_id,
        ),
      ),
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!selectedId) return;
    if (leaderId && !selectedMembers.includes(leaderId)) {
      setMessage("팀장은 팀원 중에서 선택해야 합니다.");
      return;
    }
    setBusy(true);
    setMessage("");
    const payload = {
      ...form,
      semester_id: selectedId,
      topic: form.topic || null,
      project_name: form.project_name || null,
      leader_profile_id: leaderId || null,
    };
    const result = editingId
      ? await supabase
          .from("teams")
          .update(payload)
          .eq("id", editingId)
          .select("id")
          .single()
      : await supabase.from("teams").insert(payload).select("id").single();
    if (result.error) {
      setMessage(result.error.message);
      setBusy(false);
      return;
    }
    const teamId = result.data.id;
    if (editingId) {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("team_id", teamId);
      if (error) {
        setMessage(error.message);
        setBusy(false);
        return;
      }
    }
    if (selectedMembers.length) {
      const { error } = await supabase
        .from("team_members")
        .insert(
          selectedMembers.map((profileId) => ({
            team_id: teamId,
            profile_id: profileId,
            is_leader: profileId === leaderId,
          })),
        );
      if (error) {
        setMessage(error.message);
        setBusy(false);
        return;
      }
    }
    setMessage(editingId ? "팀 정보를 수정했습니다." : "팀을 생성했습니다.");
    reset();
    setBusy(false);
    await load();
  }
  async function registerParticipantAccounts(participantIds: string[]) {
    if (!participantIds.length) return;
    setBusy(true);
    setMessage("수강생 계정을 연결하는 중…");
    const { data, error } = await supabase.functions.invoke(
      "register-participants",
      { body: { participantIds } },
    );
    setBusy(false);
    if (error || !data?.success || Number(data.failed ?? 0) > 0) {
      const detail = (data?.failures ?? [])
        .map((item: { email: string; reason: string }) => `${item.email}(${item.reason})`)
        .join(", ");
      setMessage(
        `계정 연결에 실패했습니다.${detail ? ` ${detail}` : ""} 연락처와 메일주소를 확인해 주세요.`,
      );
      await load();
      return;
    }
    setMessage(`수강생 계정 ${data.registered ?? participantIds.length}개를 연결했습니다. 팀원 선택 목록에 반영했습니다.`);
    await load();
  }
  function reset() {
    setEditingId(null);
    setForm(emptyForm);
    setSelectedMembers([]);
    setLeaderId("");
  }
  function edit(team: Team) {
    setEditingId(team.id);
    setForm({
      name: team.name,
      topic: team.topic ?? "",
      project_name: team.project_name ?? "",
    });
    setSelectedMembers(team.team_members.map((member) => member.profile_id));
    setLeaderId(team.leader_profile_id ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function remove(team: Team) {
    if (!confirm(`${team.name}과 팀원 배정 정보를 삭제할까요?`)) return;
    const { error } = await supabase.from("teams").delete().eq("id", team.id);
    setMessage(error?.message ?? "팀을 삭제했습니다.");
    if (!error) await load();
  }
  function toggle(profileId: string) {
    setSelectedMembers((current) =>
      current.includes(profileId)
        ? current.filter((id) => id !== profileId)
        : [...current, profileId],
    );
    if (selectedMembers.includes(profileId) && leaderId === profileId)
      setLeaderId("");
  }

  if (loading)
    return <p className="text-slate-500">학기 정보를 불러오는 중…</p>;
  if (!semesters.length)
    return (
      <PageHeader eyebrow="Manager" title="팀 관리">
        수강생 관리에서 운영 학기를 먼저 생성해 주세요.
      </PageHeader>
    );
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <PageHeader eyebrow="Manager" title="팀 관리">
          팀을 구성하고 프로젝트 주제와 팀장을 지정합니다.
        </PageHeader>
        <select
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold"
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
        >
          {semesters.map((item) => (
            <option value={item.id} key={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </div>
      <Card className="mt-8">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-inha-700" />
          <h2 className="font-black">
            {editingId ? "팀 수정" : "새 팀 만들기"}
          </h2>
        </div>
        <form onSubmit={submit} className="mt-5">
          <div className="grid gap-4 md:grid-cols-3">
            <Field
              label="팀명"
              value={form.name}
              onChange={(value) => setForm({ ...form, name: value })}
              required
            />
            <Field
              label="프로젝트명"
              value={form.project_name}
              onChange={(value) => setForm({ ...form, project_name: value })}
            />
            <Field
              label="주제"
              value={form.topic}
              onChange={(value) => setForm({ ...form, topic: value })}
            />
          </div>
          <div className="mt-7">
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-sm font-black">팀원 선택</h3>
                <p className="mt-1 text-xs text-slate-500">
                  이름·학과·훈련직무·기업명을 확인하고 팀장을 지정하세요.
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${selectedMembers.length >= 4 && selectedMembers.length <= 6 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
              >
                {selectedMembers.length}명 선택
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {eligible.map((item) => {
                const unavailable = assigned.get(item.profile_id!);
                const checked = selectedMembers.includes(item.profile_id!);
                return (
                  <label
                    key={item.id}
                    className={`flex items-center gap-3 rounded-xl border p-3 ${unavailable ? "cursor-not-allowed bg-slate-50 opacity-55" : checked ? "border-blue-500 bg-blue-50" : "cursor-pointer border-slate-200"}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={Boolean(unavailable)}
                      onChange={() => toggle(item.profile_id!)}
                    />
                    <StudentSummary
                      participant={item}
                      suffix={unavailable ? `${unavailable} 배정됨` : item.fromProfileOnly ? "수강생정보 미등록" : undefined}
                    />
                    {checked && (
                      <button
                        type="button"
                        title="팀장 지정"
                        onClick={(event) => {
                          event.preventDefault();
                          setLeaderId(item.profile_id!);
                        }}
                        className={`rounded-lg p-2 ${leaderId === item.profile_id ? "bg-amber-100 text-amber-700" : "text-slate-300 hover:bg-amber-50 hover:text-amber-600"}`}
                      >
                        <Crown className="h-4 w-4" />
                      </button>
                    )}
                  </label>
                );
              })}
            </div>
            {unlinked.length > 0 && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-black text-amber-900">
                      계정 미연결 수강생 · {unlinked.length}명
                    </h4>
                    <p className="mt-1 text-xs text-amber-800">
                      아래 학생은 수강생 목록에는 있지만 학생 계정 연결이 완료되지 않아 팀원 후보에 표시되지 않습니다.
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="bg-amber-700 hover:bg-amber-800"
                    disabled={busy}
                    onClick={() => registerParticipantAccounts(unlinked.map((item) => item.id))}
                  >
                    <KeyRound className="h-4 w-4" />
                    전체 계정 연결
                  </Button>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {unlinked.map((item) => (
                    <div className="flex items-center gap-3 rounded-xl bg-white p-3" key={item.id}>
                      <StudentSummary participant={item} suffix="계정 미연결" />
                      <button
                        type="button"
                        className="rounded-lg p-2 text-amber-700 hover:bg-amber-100"
                        title="계정 연결"
                        disabled={busy}
                        onClick={() => registerParticipantAccounts([item.id])}
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <label className="mt-5 block max-w-md text-sm font-black">
              팀장 선택
              <select className={inputClass} value={leaderId} onChange={event=>setLeaderId(event.target.value)} disabled={!selectedMembers.length}>
                <option value="">팀장을 선택하세요</option>
                {selectedMembers.map(profileId=>{const participant=participantByProfile.get(profileId);return <option value={profileId} key={profileId}>{participant?.name??profileId}</option>})}
              </select>
            </label>
          </div>
          <div className="mt-7 flex gap-2">
            <Button disabled={busy}>
              {editingId ? "팀 수정 저장" : "팀 생성"}
            </Button>
            {editingId && (
              <button
                type="button"
                className="rounded-xl border px-5 py-3 text-sm font-bold"
                onClick={reset}
              >
                취소
              </button>
            )}
          </div>
        </form>
        {message && (
          <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            {message}
          </p>
        )}
      </Card>
      <section className="mt-8">
        <h2 className="text-xl font-black">팀별 배정 현황</h2>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          {teams.map((team) => (
            <Card key={team.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-inha-700">
                    {statusName(team.status)}
                  </span>
                  <h3 className="mt-3 text-xl font-black">{team.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {team.project_name || team.topic || "프로젝트 미정"}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-amber-700"><Crown className="h-3.5 w-3.5"/>팀장: {team.team_members.find(member=>member.is_leader)?.profiles?.name||"미지정"}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                    onClick={() => edit(team)}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700"
                    onClick={() => remove(team)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-5 space-y-2 border-t pt-4">
                {team.team_members.map((member) => {
                  const participant = participantByProfile.get(
                    member.profile_id,
                  );
                  return (
                    <div
                      className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
                      key={member.id}
                    >
                      {member.is_leader ? (
                        <Crown className="h-4 w-4 text-amber-600" />
                      ) : (
                        <Users className="h-4 w-4 text-slate-400" />
                      )}
                      {participant ? (
                        <StudentSummary participant={participant} />
                      ) : (
                        <span>{member.profiles?.name ?? "사용자"}</span>
                      )}
                    </div>
                  );
                })}
                {!team.team_members.length && (
                  <p className="text-sm text-slate-400">
                    배정된 팀원이 없습니다.
                  </p>
                )}
              </div>
            </Card>
          ))}
          <Card className="border-dashed">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-slate-400" />
              <h3 className="font-black">
                미배정 수강생 · {unassigned.length}명
              </h3>
            </div>
            <div className="mt-4 space-y-2">
              {unassigned.map((item) => (
                <div className="rounded-xl bg-slate-50 p-3" key={item.id}>
                  <StudentSummary participant={item} />
                </div>
              ))}
              {!unassigned.length && (
                <p className="text-sm text-emerald-700">
                  모든 수강생이 팀에 배정되었습니다.
                </p>
              )}
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}

function StudentSummary({
  participant,
  suffix,
}: {
  participant: Participant;
  suffix?: string;
}) {
  return (
    <span className="min-w-0 flex-1">
      <strong className="block truncate text-sm">{participant.name}</strong>
      <span className="block truncate text-xs text-slate-500">
        {participant.department || "학과 미입력"} ·{" "}
        {participant.training_job || "훈련직무 미입력"} ·{" "}
        <Building2 className="mb-0.5 inline h-3 w-3" />{" "}
        {participant.company_name || "기업 미입력"}
        {suffix ? ` · ${suffix}` : ""}
      </span>
    </span>
  );
}
function Field({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-bold">
      {label}
      {required && <span className="text-red-500"> *</span>}
      <input
        className={inputClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
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
