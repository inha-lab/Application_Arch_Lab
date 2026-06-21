import { KeyRound, LockKeyhole, UserRound } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { useAuth } from '@/auth/AuthProvider'
import { Button, Card, PageHeader } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import type { Participant } from '@/types/management.types'

export function MyPage(){
  const{profile}=useAuth()
  const[participant,setParticipant]=useState<Participant|null>(null)
  const[newPassword,setNewPassword]=useState('')
  const[confirmPassword,setConfirmPassword]=useState('')
  const[message,setMessage]=useState('')
  const[busy,setBusy]=useState(false)

  useEffect(()=>{
    if(!profile||profile.role!=='student')return
    supabase.from('participants').select('id,semester_id,profile_id,name,department,student_no,phone,email,training_job,company_name,participation_year,course_type,is_registered').eq('profile_id',profile.id).order('created_at',{ascending:false}).limit(1).maybeSingle().then(({data})=>setParticipant(data as Participant|null))
  },[profile])

  async function changePassword(event:FormEvent){
    event.preventDefault();setMessage('')
    if(newPassword.length<8){setMessage('새 비밀번호는 8자 이상 입력해 주세요.');return}
    if(newPassword!==confirmPassword){setMessage('새 비밀번호 확인이 일치하지 않습니다.');return}
    setBusy(true)
    const{error}=await supabase.auth.updateUser({password:newPassword})
    setBusy(false)
    if(error){setMessage(error.message);return}
    setNewPassword('');setConfirmPassword('');setMessage('비밀번호를 변경했습니다.')
  }

  const isStudent=profile?.role==='student'
  return <>
    <PageHeader eyebrow="My profile" title="마이페이지">등록된 정보는 읽기 전용이며, 변경이 필요하면 담당 교수에게 요청해 주세요.</PageHeader>
    <div className="mt-9 grid gap-6 xl:grid-cols-[1.35fr_0.8fr]">
      <Card>
        <div className="flex items-center gap-2"><UserRound className="h-5 w-5 text-inha-700"/><h2 className="font-black">주요 정보</h2><span className="ml-auto rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">읽기 전용</span></div>
        <div className="mt-7 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          <Read label="학생명" value={participant?.name??profile?.name}/>
          <Read label="학과" value={participant?.department??profile?.department}/>
          <Read label="학번" value={participant?.student_no??profile?.student_no}/>
          <Read label="연락처" value={participant?.phone??profile?.phone}/>
          <Read label="메일주소" value={participant?.email??profile?.email}/>
          {isStudent&&<><Read label="훈련직무" value={participant?.training_job}/><Read label="기업명" value={participant?.company_name}/><Read label="참여연도" value={participant?.participation_year}/><Read label="과정구분" value={participant?.course_type}/></>}
          {!isStudent&&<Read label="역할" value={profile?.role==='professor'?'교수':'연구원'}/>} 
        </div>
      </Card>
      <Card>
        <div className="flex items-center gap-2"><LockKeyhole className="h-5 w-5 text-inha-700"/><h2 className="font-black">비밀번호 변경</h2></div>
        <form onSubmit={changePassword} autoComplete="off" className="mt-6 space-y-4">
          <PasswordField label="새 비밀번호" name="new-password" value={newPassword} onChange={setNewPassword}/>
          <PasswordField label="새 비밀번호 확인" name="confirm-password" value={confirmPassword} onChange={setConfirmPassword}/>
          <p className="flex items-center gap-1 text-xs text-slate-500"><KeyRound className="h-3.5 w-3.5"/>8자 이상 입력해 주세요.</p>
          <Button className="w-full" disabled={busy}>{busy?'변경 중…':'비밀번호 변경'}</Button>
        </form>
        {message&&<p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
      </Card>
    </div>
  </>
}

function Read({label,value}:{label:string;value?:string|number|null}){return <div><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-1.5 font-bold text-slate-900">{value||'—'}</p></div>}
function PasswordField({label,name,value,onChange}:{label:string;name:string;value:string;onChange:(value:string)=>void}){return <label className="block text-sm font-bold">{label}<input className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" type="password" name={name} autoComplete="new-password" minLength={8} value={value} onChange={event=>onChange(event.target.value)} required/></label>}
