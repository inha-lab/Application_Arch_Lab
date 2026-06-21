import { KeyRound, ShieldCheck, UserPlus } from 'lucide-react'
import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, PageHeader } from '@/components/ui'
import { SortableHeader, type SortDirection } from '@/components/SortableHeader'
import { supabase } from '@/lib/supabase'
import { sortBy } from '@/lib/sort'

type AdminRole = 'professor' | 'researcher'
interface AdminProfile { id:string; name:string; email:string; phone:string|null; role:AdminRole; created_at:string }
type AdminSortKey='name'|'email'|'phone'|'role'
const adminColumns:{label:string;key:AdminSortKey}[]=[{label:'이름',key:'name'},{label:'메일주소',key:'email'},{label:'연락처',key:'phone'},{label:'역할',key:'role'}]
const inputClass = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500'
const emptyForm = { name:'', email:'', phone:'', role:'researcher' as AdminRole, password:'' }

export function AdminUserManagePage(){
  const [admins,setAdmins]=useState<AdminProfile[]>([])
  const [form,setForm]=useState(emptyForm)
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')
  const [sortKey,setSortKey]=useState<AdminSortKey>('name')
  const [sortDirection,setSortDirection]=useState<SortDirection>('asc')
  const sortedAdmins=useMemo(()=>sortBy(admins,sortKey,sortDirection),[admins,sortKey,sortDirection])
  function changeSort(key:AdminSortKey){if(sortKey===key)setSortDirection(current=>current==='asc'?'desc':'asc');else{setSortKey(key);setSortDirection('asc')}}

  const load=useCallback(async()=>{
    const{data,error}=await supabase.from('profiles').select('id,name,email,phone,role,created_at').in('role',['professor','researcher']).order('role').order('name')
    if(error)setMessage(error.message);else setAdmins((data??[]) as AdminProfile[])
  },[])
  useEffect(()=>{void load()},[load])

  async function submit(event:FormEvent){
    event.preventDefault();setBusy(true);setMessage('')
    const{data,error}=await supabase.functions.invoke('register-managed-user',{body:{...form,email:form.email.trim().toLowerCase()}})
    setBusy(false)
    if(error){setMessage('관리자 등록에 실패했습니다. 입력 정보와 권한을 확인해 주세요.');return}
    if(!data?.success){setMessage(data?.error??'관리자 등록에 실패했습니다.');return}
    setMessage(`${form.name} ${form.role==='professor'?'교수':'연구원'} 계정을 등록했습니다.`)
    setForm(emptyForm);await load()
  }

  return <>
    <PageHeader eyebrow="Manager" title="관리자 관리">교수와 연구원이 관리자 계정을 안전하게 등록합니다.</PageHeader>
    <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1.15fr]">
      <Card>
        <div className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-inha-700"/><h2 className="font-black">관리자 등록</h2></div>
        <form onSubmit={submit} autoComplete="off" className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="이름" name="admin-name" autoComplete="name" value={form.name} onChange={value=>setForm({...form,name:value})} required/>
          <label className="text-sm font-bold">역할<select className={inputClass} name="admin-role" autoComplete="off" value={form.role} onChange={event=>setForm({...form,role:event.target.value as AdminRole})}><option value="researcher">연구원</option><option value="professor">교수</option></select></label>
          <Field label="메일주소" name="admin-email" autoComplete="email" type="email" value={form.email} onChange={value=>setForm({...form,email:value})} required/>
          <Field label="연락처" name="admin-phone" autoComplete="tel" type="tel" value={form.phone} onChange={value=>setForm({...form,phone:value})}/>
          <div className="sm:col-span-2"><Field label="초기 비밀번호" name="admin-new-password" autoComplete="new-password" type="password" value={form.password} onChange={value=>setForm({...form,password:value})} required minLength={8}/><p className="mt-2 flex items-center gap-1 text-xs text-slate-500"><KeyRound className="h-3.5 w-3.5"/>8자 이상 입력하고 사용자에게 안전하게 전달해 주세요.</p></div>
          <Button className="sm:col-span-2" disabled={busy}><ShieldCheck className="h-4 w-4"/>{busy?'등록 중…':'관리자 계정 등록'}</Button>
        </form>
        {message&&<p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
      </Card>
      <Card className="overflow-hidden p-0">
        <div className="border-b p-5"><h2 className="font-black">등록된 관리자 <span className="text-inha-700">{admins.length}명</span></h2></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="whitespace-nowrap px-3 py-2.5 font-bold">순번</th>{adminColumns.map(column=><SortableHeader key={column.key} label={column.label} active={sortKey===column.key} direction={sortDirection} onClick={()=>changeSort(column.key)}/>)}</tr></thead><tbody className="divide-y">{sortedAdmins.map((admin,index)=><tr key={admin.id}><td className="whitespace-nowrap px-3 py-4 text-center text-slate-400">{index+1}</td><td className="whitespace-nowrap px-3 py-4 font-bold">{admin.name}</td><td className="whitespace-nowrap px-3 py-4">{admin.email}</td><td className="whitespace-nowrap px-3 py-4">{admin.phone||'—'}</td><td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${admin.role==='professor'?'bg-blue-50 text-blue-700':'bg-violet-50 text-violet-700'}`}>{admin.role==='professor'?'교수':'연구원'}</span></td></tr>)}</tbody></table></div>
      </Card>
    </div>
  </>
}

function Field({label,name,autoComplete,value,onChange,type='text',required=false,minLength}:{label:string;name:string;autoComplete:string;value:string;onChange:(value:string)=>void;type?:string;required?:boolean;minLength?:number}){return <label className="text-sm font-bold">{label}{required&&<span className="text-red-500"> *</span>}<input className={inputClass} name={name} autoComplete={autoComplete} type={type} value={value} onChange={event=>onChange(event.target.value)} required={required} minLength={minLength}/></label>}
