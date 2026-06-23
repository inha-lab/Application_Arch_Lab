import { FileSpreadsheet, KeyRound, Pencil, Plus, Search, Trash2, Upload, Users } from 'lucide-react'
import { type ChangeEvent, type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, PageHeader } from '@/components/ui'
import { SortableHeader, type SortDirection } from '@/components/SortableHeader'
import { useSemesters } from '@/hooks/useSemesters'
import { supabase } from '@/lib/supabase'
import { sortBy } from '@/lib/sort'
import type { Participant } from '@/types/management.types'

const currentYear = new Date().getFullYear()
const emptyForm = {
  name: '',
  department: '',
  student_no: '',
  phone: '',
  email: '',
  training_job: '',
  company_name: '',
  participation_year: String(currentYear),
  course_type: '',
}
const inputClass = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500'
const excelColumns = ['학생명', '학과', '학번', '연락처', '메일주소', '훈련직무', '기업명', '참여연도', '과정구분']
const listColumns: {label:string;key:ParticipantSortKey}[] = [
  {label:'학생명',key:'name'},{label:'학과',key:'department'},{label:'학번',key:'student_no'},
  {label:'연락처',key:'phone'},{label:'메일주소',key:'email'},{label:'훈련직무',key:'training_job'},
  {label:'기업명',key:'company_name'},{label:'참여연도',key:'participation_year'},{label:'과정구분',key:'course_type'},
]
type ParticipantSortKey='name'|'department'|'student_no'|'phone'|'email'|'training_job'|'company_name'|'participation_year'|'course_type'

export function ParticipantManagePage() {
  const { semesters, selectedId, setSelectedId, loading: semesterLoading, createDefault } = useSemesters()
  const [rows, setRows] = useState<Participant[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [queryInput, setQueryInput] = useState('')
  const [query, setQuery] = useState('')
  const [sortKey,setSortKey]=useState<ParticipantSortKey>('name')
  const [sortDirection,setSortDirection]=useState<SortDirection>('asc')
  const [busy, setBusy] = useState(false)
  const [formOpen,setFormOpen]=useState(false)
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    if (!selectedId) {
      setRows([])
      return
    }
    const { data, error } = await supabase
      .from('participants')
      .select('id,semester_id,profile_id,name,department,student_no,phone,email,training_job,company_name,participation_year,course_type,is_registered')
      .eq('semester_id', selectedId)
      .order('name')
    if (error) setMessage(error.message)
    else setRows((data ?? []) as Participant[])
  }, [selectedId])

  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => rows.filter((row) => [
    row.name, row.department, row.student_no, row.phone, row.email,
    row.training_job, row.company_name, row.participation_year?.toString(), row.course_type,
  ].some((value) => value?.toLowerCase().includes(query.toLowerCase()))), [rows, query])
  const displayed=useMemo(()=>sortBy(filtered,sortKey,sortDirection),[filtered,sortKey,sortDirection])
  function changeSort(key:ParticipantSortKey){if(sortKey===key)setSortDirection(current=>current==='asc'?'desc':'asc');else{setSortKey(key);setSortDirection('asc')}}

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!selectedId) return
    setBusy(true)
    setMessage('')
    const payload = {
      semester_id: selectedId,
      name: form.name.trim(),
      department: nullable(form.department),
      student_no: nullable(form.student_no),
      phone: nullable(form.phone),
      email: form.email.trim().toLowerCase(),
      training_job: nullable(form.training_job),
      company_name: nullable(form.company_name),
      participation_year: form.participation_year ? Number(form.participation_year) : null,
      course_type: nullable(form.course_type),
    }
    const result = editingId
      ? await supabase.from('participants').update(payload).eq('id', editingId).select('id,profile_id,is_registered').single()
      : await supabase.from('participants').insert(payload).select('id,profile_id,is_registered').single()
    setBusy(false)
    if (result.error) {
      setMessage(result.error.message)
      return
    }
    const shouldRegisterAccount = !result.data.profile_id || !result.data.is_registered
    if (shouldRegisterAccount) {
      setBusy(true)
      const { data: accountResult, error: accountError } = await supabase.functions.invoke('register-participants', { body: { participantIds: [result.data.id] } })
      setBusy(false)
      if (accountError || !accountResult?.success || Number(accountResult.failed ?? 0) > 0) {
        const detail = (accountResult?.failures ?? []).map((item: { email: string; reason: string }) => `${item.email}(${item.reason})`).join(', ')
        setMessage(`수강생 정보는 저장했지만 계정 생성에 실패했습니다.${detail ? ` ${detail}` : ''} 계정이 생성되어야 팀원 등록 화면에 표시됩니다.`)
        await load()
        return
      }
    }
    setForm(emptyForm)
    setEditingId(null)
    setFormOpen(false)
    setMessage(editingId ? '수강생 정보를 수정하고 계정 연결 상태를 확인했습니다.' : '수강생을 등록하고 팀원 배정 후보에 반영했습니다.')
    await load()
  }

  function edit(row: Participant) {
    setEditingId(row.id)
    setFormOpen(true)
    setForm({
      name: row.name,
      department: row.department ?? '',
      student_no: row.student_no ?? '',
      phone: row.phone ?? '',
      email: row.email,
      training_job: row.training_job ?? '',
      company_name: row.company_name ?? '',
      participation_year: row.participation_year?.toString() ?? '',
      course_type: row.course_type ?? '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function remove(row: Participant) {
    if (!confirm(`${row.name} 수강생을 삭제할까요?`)) return
    const { error } = await supabase.from('participants').delete().eq('id', row.id)
    setMessage(error?.message ?? '삭제했습니다.')
    if (!error) await load()
  }

  async function resetPassword(row: Participant) {
    if (!confirm(`${row.name} 수강생의 비밀번호를 연락처 기준 초기 비밀번호로 재설정할까요?`)) return
    setBusy(true)
    setMessage('비밀번호를 초기화하는 중…')
    const { data, error } = await supabase.functions.invoke('reset-managed-user-password', { body: { participantId: row.id } })
    setBusy(false)
    if (error || !data?.success) {
      setMessage(data?.error ?? '비밀번호 초기화에 실패했습니다. 계정 등록 상태와 연락처를 확인해 주세요.')
      return
    }
    setMessage(`${row.name} (${row.email}) 초기 비밀번호: ${data.initialPassword}`)
  }

  async function uploadExcel(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !selectedId) return
    setBusy(true)
    setMessage('Excel 파일을 읽는 중…')
    try {
      const XLSX = await import('xlsx')
      const workbook = XLSX.read(await file.arrayBuffer())
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const source = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
      const values = source.map((item) => ({
        semester_id: selectedId,
        name: text(item['학생명'] || item['이름'] || item['성명']),
        department: text(item['학과']) || null,
        student_no: text(item['학번']) || null,
        phone: text(item['연락처'] || item['휴대폰'] || item['전화번호']) || null,
        email: text(item['메일주소'] || item['이메일'] || item['이매일']).toLowerCase(),
        training_job: text(item['훈련직무'] || item['직무']) || null,
        company_name: text(item['기업명'] || item['회사명']) || null,
        participation_year: numberOrNull(item['참여연도'] || item['연도']),
        course_type: text(item['과정구분'] || item['과정']) || null,
      })).filter((item) => item.name && item.email)
      if (!values.length) throw new Error('학생명과 메일주소가 있는 행을 찾지 못했습니다. 헤더를 확인해 주세요.')
      const { data: upserted, error } = await supabase.from('participants').upsert(values, { onConflict: 'semester_id,email' }).select('id')
      if (error) throw error
      const { data: accountResult, error: accountError } = await supabase.functions.invoke('register-participants', { body: { participantIds: (upserted ?? []).map((item) => item.id) } })
      if (accountError) throw new Error('수강생 정보는 저장했지만 계정 생성에 실패했습니다.')
      const failed = Number(accountResult?.failed ?? 0)
      const failureDetail = failed ? ` 실패 ${failed}명: ${(accountResult.failures ?? []).map((item: { email: string; reason: string }) => `${item.email}(${item.reason})`).join(', ')}` : ''
      setMessage(`${values.length}명의 정보를 반영하고 계정 ${accountResult?.registered ?? 0}개를 등록했습니다.${failureDetail}`)
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Excel 처리에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  if (semesterLoading) return <p className="text-slate-500">학기 정보를 불러오는 중…</p>
  if (!semesters.length) return (
    <>
      <PageHeader eyebrow="Manager" title="수강생 관리">먼저 운영할 학기를 생성해 주세요.</PageHeader>
      <Card className="mt-8 text-center">
        <Users className="mx-auto h-10 w-10 text-inha-700" />
        <h2 className="mt-4 text-lg font-black">등록된 학기가 없습니다</h2>
        <Button className="mt-5" onClick={async () => setMessage((await createDefault()) ?? '2026 하계학기를 생성했습니다.')}>
          <Plus className="h-4 w-4" />2026 하계학기 생성
        </Button>
        {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
      </Card>
    </>
  )

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <PageHeader eyebrow="Manager" title="수강생 관리">수강생의 학적, 연락처, 훈련 및 참여 정보를 관리합니다.</PageHeader>
        <div className="flex gap-2">
          <select className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
            {semesters.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
          <Button type="button" onClick={()=>{setEditingId(null);setForm(emptyForm);setFormOpen(current=>!current)}}><Plus className="h-4 w-4"/>{formOpen?'등록창 닫기':'수강생 등록'}</Button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800">
            <Upload className="h-4 w-4" />Excel 업로드
            <input className="hidden" type="file" accept=".xlsx,.xls,.csv" onChange={uploadExcel} />
          </label>
        </div>
      </div>

      {formOpen&&<Card className="mt-8">
        <div className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-inha-700" /><h2 className="font-black">{editingId ? '수강생 수정' : '수강생 등록'}</h2></div>
        <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-3">
          <Field label="학생명" required value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <Field label="학과" value={form.department} onChange={(value) => setForm({ ...form, department: value })} />
          <Field label="학번" value={form.student_no} onChange={(value) => setForm({ ...form, student_no: value })} />
          <Field label="연락처" required value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
          <Field label="메일주소" type="email" required value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
          <Field label="훈련직무" value={form.training_job} onChange={(value) => setForm({ ...form, training_job: value })} />
          <Field label="기업명" value={form.company_name} onChange={(value) => setForm({ ...form, company_name: value })} />
          <Field label="참여연도" type="number" value={form.participation_year} onChange={(value) => setForm({ ...form, participation_year: value })} />
          <Field label="과정구분" value={form.course_type} onChange={(value) => setForm({ ...form, course_type: value })} />
          <div className="flex gap-2 md:col-span-3">
            <Button disabled={busy}>{editingId ? '수정 저장' : '수강생 등록'}</Button>
            {editingId && <button type="button" className="rounded-xl border px-5 py-3 text-sm font-bold" onClick={() => { setEditingId(null); setForm(emptyForm);setFormOpen(false) }}>취소</button>}
          </div>
        </form>
        {message && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
      </Card>}

      <Card className="mt-6 overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
          <div><h2 className="font-black">수강생 목록 <span className="text-inha-700">{rows.length}명</span></h2><p className="mt-1 text-xs text-slate-500">Excel 헤더: {excelColumns.join(', ')}</p></div>
          <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); setQuery(queryInput.trim()) }}>
            <label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="w-64 rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm" placeholder="검색어 입력" value={queryInput} onChange={(event) => setQueryInput(event.target.value)} /></label>
            <Button className="px-4 py-2.5">검색</Button>
            {query && <button type="button" className="rounded-xl border px-4 py-2.5 text-sm font-bold" onClick={() => { setQueryInput(''); setQuery('') }}>초기화</button>}
          </form>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1380px] text-left text-[13px]">
            <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="whitespace-nowrap px-3 py-2.5 font-bold">순번</th>{listColumns.map(column=><SortableHeader key={column.key} label={column.label} active={sortKey===column.key} direction={sortDirection} onClick={()=>changeSort(column.key)}/>) }<th className="whitespace-nowrap px-3 py-2.5 font-bold">관리</th></tr></thead>
            <tbody className="divide-y">{displayed.map((row,index) => (
              <tr key={row.id} className="whitespace-nowrap hover:bg-slate-50">
                <td className="px-3 py-3 text-center text-slate-400">{index+1}</td><td className="px-3 py-3 font-bold">{row.name}</td><Cell value={row.department} /><Cell value={row.student_no} /><Cell value={row.phone} />
                <td className="px-3 py-3">{row.email}</td><Cell value={row.training_job} /><Cell value={row.company_name} /><Cell value={row.participation_year} /><Cell value={row.course_type} />
                <td className="px-3 py-3"><div className="flex gap-1"><button className="rounded-lg p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-700" onClick={() => resetPassword(row)} aria-label="비밀번호 초기화" title="비밀번호 초기화"><KeyRound className="h-4 w-4" /></button><button className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-700" onClick={() => edit(row)} aria-label="수정" title="수정"><Pencil className="h-4 w-4" /></button><button className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700" onClick={() => remove(row)} aria-label="삭제" title="삭제"><Trash2 className="h-4 w-4" /></button></div></td>
              </tr>
            ))}</tbody>
          </table>
          {!filtered.length && <p className="p-10 text-center text-sm text-slate-500">표시할 수강생이 없습니다.</p>}
        </div>
      </Card>
    </>
  )
}

function Field({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="text-sm font-bold">{label}{required && <span className="text-red-500"> *</span>}<input className={inputClass} type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} /></label>
}
function Cell({ value }: { value: string | number | null }) { return <td className="px-3 py-3">{value || '—'}</td> }
function nullable(value: string) { return value.trim() || null }
function text(value: unknown) { return String(value ?? '').trim() }
function numberOrNull(value: unknown) { const parsed = Number(text(value)); return Number.isFinite(parsed) && parsed > 0 ? parsed : null }
