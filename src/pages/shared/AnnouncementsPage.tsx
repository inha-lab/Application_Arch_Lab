import { type FormEvent, useEffect, useState } from "react";
import { Bell, Pin } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { Button, Card, PageHeader } from "@/components/ui";
import { supabase } from "@/lib/supabase";

interface Notice {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  created_at: string;
}
export function AnnouncementsPage() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<Notice[]>([]);
  const [form, setForm] = useState({ title: "", content: "", pinned: false });
  const [message, setMessage] = useState("");
  async function load() {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });
    setRows((data ?? []) as Notice[]);
  }
  useEffect(() => {
    void load();
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const { error } = await supabase
      .from("announcements")
      .insert({ ...form, created_by: profile?.id });
    setMessage(error?.message ?? "공지를 등록했습니다.");
    if (!error) {
      setForm({ title: "", content: "", pinned: false });
      await load();
    }
  }
  return (
    <>
      <PageHeader eyebrow="Notice" title="공지사항">
        수업 운영 공지와 중요 일정을 확인합니다.
      </PageHeader>
      {profile?.role !== "student" && (
        <Card className="mt-8">
          <form onSubmit={submit} className="space-y-4">
            <input
              className="w-full rounded-xl border px-4 py-3"
              placeholder="공지 제목"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <textarea
              className="min-h-28 w-full rounded-xl border px-4 py-3"
              placeholder="공지 내용"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
            />
            <label className="flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
              />
              중요 공지로 고정
            </label>
            <Button>공지 등록</Button>
          </form>
          {message && <p className="mt-3 text-sm">{message}</p>}
        </Card>
      )}
      <div className="mt-7 space-y-4">
        {rows.map((row) => (
          <Card key={row.id}>
            <div className="flex items-center gap-2">
              {row.pinned ? (
                <Pin className="h-4 w-4 text-amber-600" />
              ) : (
                <Bell className="h-4 w-4 text-slate-400" />
              )}
              <h2 className="font-black">{row.title}</h2>
              <time className="ml-auto text-xs text-slate-400">
                {new Date(row.created_at).toLocaleDateString("ko-KR")}
              </time>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {row.content}
            </p>
          </Card>
        ))}
      </div>
    </>
  );
}
