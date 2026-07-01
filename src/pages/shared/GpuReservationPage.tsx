import { CalendarDays, Cpu, Trash2 } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { Button, Card, PageHeader } from "@/components/ui";
import { useMyTeam } from "@/hooks/useMyTeam";
import { supabase } from "@/lib/supabase";

const gpus = ["GPU_#0", "GPU_#1"] as const;
type GpuId = (typeof gpus)[number];

interface TeamOption {
  id: string;
  name: string;
  project_name: string | null;
  topic: string | null;
}

interface Reservation {
  id: string;
  team_id: string;
  gpu_id: GpuId;
  start_at: string;
  end_at: string;
  purpose: string | null;
  requested_by: string | null;
  teams: TeamOption | null;
  profiles: { name: string; email: string } | null;
}

export function GpuReservationPage() {
  const { profile } = useAuth();
  const { team, loading: teamLoading } = useMyTeam();
  const isStudent = profile?.role === "student";
  const today = useMemo(() => toDateInput(new Date()), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [teamId, setTeamId] = useState("");
  const [startHour, setStartHour] = useState("09");
  const [endHour, setEndHour] = useState("10");
  const [selectedGpus, setSelectedGpus] = useState<GpuId[]>(["GPU_#0"]);
  const [purpose, setPurpose] = useState("");
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isStudent && team?.id) setTeamId(team.id);
  }, [isStudent, team?.id]);

  useEffect(() => {
    if (isStudent) return;
    supabase
      .from("teams")
      .select("id,name,project_name,topic")
      .order("name")
      .then(({ data, error }) => {
        if (error) setMessage(error.message);
        const list = (data ?? []) as TeamOption[];
        setTeams(list);
        setTeamId((current) => current || list[0]?.id || "");
      });
  }, [isStudent]);

  const load = useCallback(async () => {
    const dayStart = new Date(`${selectedDate}T00:00:00`);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    setLoading(true);
    const { data, error } = await supabase
      .from("gpu_reservations")
      .select(
        "id,team_id,gpu_id,start_at,end_at,purpose,requested_by,teams(id,name,project_name,topic),profiles!gpu_reservations_requested_by_fkey(name,email)",
      )
      .lt("start_at", dayEnd.toISOString())
      .gt("end_at", dayStart.toISOString())
      .order("start_at", { ascending: true });
    if (error) setMessage(error.message);
    else setReservations((data ?? []) as unknown as Reservation[]);
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    if (!teamId) {
      setMessage("예약할 팀을 선택해 주세요.");
      return;
    }
    if (!selectedGpus.length) {
      setMessage("GPU를 1개 이상 선택해 주세요.");
      return;
    }
    const start = new Date(`${selectedDate}T${startHour}:00:00`);
    const end = new Date(`${selectedDate}T${endHour}:00:00`);
    if (end <= start) end.setDate(end.getDate() + 1);
    setBusy(true);
    setMessage("GPU 예약을 등록하는 중…");
    const rows = selectedGpus.map((gpu_id) => ({
      team_id: teamId,
      gpu_id,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      purpose: purpose.trim() || null,
      requested_by: profile.id,
    }));
    const { error } = await supabase.from("gpu_reservations").insert(rows);
    setBusy(false);
    if (error) {
      setMessage(
        error.message.includes("gpu_reservations_gpu_id_tstzrange_excl")
          ? "이미 예약된 시간과 겹칩니다. GPU 또는 시간을 다시 선택해 주세요."
          : error.message,
      );
      return;
    }
    setPurpose("");
    setMessage("GPU 예약이 완료되었습니다.");
    await load();
  }

  async function remove(id: string) {
    if (!confirm("이 GPU 예약을 취소할까요?")) return;
    const { error } = await supabase.from("gpu_reservations").delete().eq("id", id);
    if (error) setMessage(error.message);
    else {
      setMessage("예약을 취소했습니다.");
      await load();
    }
  }

  const visibleTeams = isStudent && team ? [{ id: team.id, name: team.name, project_name: team.project_name, topic: team.topic }] : teams;
  const summary = gpus.map((gpu) => ({
    gpu,
    count: reservations.filter((item) => item.gpu_id === gpu).length,
    hours: reservations
      .filter((item) => item.gpu_id === gpu)
      .reduce((sum, item) => sum + durationHours(item.start_at, item.end_at), 0),
  }));

  if (teamLoading && isStudent) return <p className="text-slate-500">팀 정보를 불러오는 중…</p>;

  return (
    <>
      <PageHeader eyebrow="GPU Server" title="GPU 서버 사용 신청">
        GPU_#0, GPU_#1을 시간 단위로 예약하고 팀별 사용 현황을 한눈에 확인합니다.
      </PageHeader>

      <div className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-inha-700" />
            <h2 className="font-black">예약 신청</h2>
          </div>
          {isStudent && !team ? (
            <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              팀 배정 후 GPU 서버 예약을 신청할 수 있습니다.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-5 grid gap-4">
              <label className="text-sm font-bold">
                팀
                <select
                  className="mt-2 w-full rounded-xl border px-4 py-3"
                  value={teamId}
                  onChange={(event) => setTeamId(event.target.value)}
                  disabled={isStudent}
                  required
                >
                  {visibleTeams.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · {item.project_name || item.topic || "프로젝트 미정"}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="text-sm font-bold">
                  예약일
                  <input
                    className="mt-2 w-full rounded-xl border px-4 py-3"
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    required
                  />
                </label>
                <label className="text-sm font-bold">
                  시작 시간
                  <select
                    className="mt-2 w-full rounded-xl border px-4 py-3"
                    value={startHour}
                    onChange={(event) => setStartHour(event.target.value)}
                  >
                    {Array.from({ length: 24 }, (_, hour) => (
                      <option key={hour} value={String(hour).padStart(2, "0")}>
                        {String(hour).padStart(2, "0")}:00
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-bold">
                  종료시간
                  <select
                    className="mt-2 w-full rounded-xl border px-4 py-3"
                    value={endHour}
                    onChange={(event) => setEndHour(event.target.value)}
                  >
                    {Array.from({ length: 24 }, (_, hour) => (
                      <option key={hour} value={String(hour).padStart(2, "0")}>
                        {String(hour).padStart(2, "0")}:00
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="-mt-2 text-xs text-slate-500">
                종료시간이 시작 시간과 같거나 빠르면 다음날 종료로 예약됩니다.
              </p>
              <fieldset className="rounded-xl border p-4">
                <legend className="px-1 text-sm font-black">GPU 선택</legend>
                <div className="mt-2 flex flex-wrap gap-3">
                  {gpus.map((gpu) => (
                    <label key={gpu} className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold">
                      <input
                        type="checkbox"
                        checked={selectedGpus.includes(gpu)}
                        onChange={(event) =>
                          setSelectedGpus((current) =>
                            event.target.checked ? [...current, gpu] : current.filter((item) => item !== gpu),
                          )
                        }
                      />
                      {gpu}
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">두 GPU를 모두 선택하면 같은 시간에 GPU 2개가 동시에 예약됩니다.</p>
              </fieldset>
              <label className="text-sm font-bold">
                사용 목적
                <input
                  className="mt-2 w-full rounded-xl border px-4 py-3"
                  value={purpose}
                  onChange={(event) => setPurpose(event.target.value)}
                  placeholder="예: 모델 학습, 데모 테스트, 실험 재현"
                />
              </label>
              <Button disabled={busy}>{busy ? "예약 중…" : "GPU 예약 신청"}</Button>
            </form>
          )}
          {message && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          {summary.map((item) => (
            <Card key={item.gpu}>
              <Cpu className="h-5 w-5 text-inha-700" />
              <p className="mt-4 text-xs font-bold text-slate-500">{item.gpu}</p>
              <strong className="mt-1 block text-2xl">{item.count}건</strong>
              <p className="mt-1 text-sm text-slate-500">총 {item.hours}시간 예약</p>
            </Card>
          ))}
          <Card className="sm:col-span-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-inha-700" />
              <h2 className="font-black">{selectedDate} 예약 현황</h2>
            </div>
            <p className="mt-2 text-sm text-slate-500">선택한 날짜의 시간대별 예약표입니다.</p>
          </Card>
        </div>
      </div>

      <Card className="mt-7 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="w-24 border-b px-4 py-3">시간</th>
                {gpus.map((gpu) => (
                  <th key={gpu} className="border-b px-4 py-3">{gpu}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 24 }, (_, hour) => (
                <tr key={hour} className="border-b last:border-b-0">
                  <td className="bg-slate-50 px-4 py-3 font-bold text-slate-500">{String(hour).padStart(2, "0")}:00</td>
                  {gpus.map((gpu) => (
                    <td key={gpu} className="min-h-16 px-4 py-3 align-top">
                      <HourReservations
                        reservations={reservations.filter((item) => item.gpu_id === gpu && overlapsHour(item, selectedDate, hour))}
                        onRemove={remove}
                        canRemove={(item) => !isStudent || item.team_id === team?.id}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && <p className="p-5 text-center text-sm text-slate-500">예약 현황을 불러오는 중…</p>}
      </Card>
    </>
  );
}

function HourReservations({
  reservations,
  onRemove,
  canRemove,
}: {
  reservations: Reservation[];
  onRemove: (id: string) => void;
  canRemove: (item: Reservation) => boolean;
}) {
  if (!reservations.length) return <span className="text-xs text-slate-300">예약 가능</span>;
  return (
    <div className="space-y-2">
      {reservations.map((item) => (
        <div key={item.id} className="rounded-xl bg-blue-50 p-3 text-xs text-inha-950">
          <div className="flex items-start justify-between gap-2">
            <div>
              <strong>{item.teams?.name || "팀 미지정"}</strong>
              <p className="mt-1 text-slate-600">{timeRange(item.start_at, item.end_at)}</p>
              {item.purpose && <p className="mt-1 text-slate-600">{item.purpose}</p>}
              <p className="mt-1 text-slate-400">신청: {item.profiles?.name || "—"}</p>
            </div>
            {canRemove(item) && (
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-red-600"
                aria-label="예약 취소"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function durationHours(start: string, end: string) {
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 36e5));
}
function overlapsHour(item: Reservation, date: string, hour: number) {
  const start = new Date(`${date}T${String(hour).padStart(2, "0")}:00:00`);
  const end = new Date(start);
  end.setHours(end.getHours() + 1);
  return new Date(item.start_at) < end && new Date(item.end_at) > start;
}
function timeRange(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  return `${formatter.format(new Date(start))} ~ ${formatter.format(new Date(end))}`;
}
