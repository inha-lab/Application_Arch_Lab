import {Clock3,History,Search,Users} from 'lucide-react'
import {type FormEvent,useEffect,useMemo,useState} from 'react'
import {Card,PageHeader,Button} from '@/components/ui'
import {supabase} from '@/lib/supabase'

interface ActivityLog{id:string;profile_id:string;email:string;user_agent:string|null;logged_in_at:string;profiles:{name:string;student_no:string|null;department:string|null;role:string}|null}
type Period='today'|'7days'|'30days'|'all'

export function LoginActivityPage(){
  const[logs,setLogs]=useState<ActivityLog[]>([])
  const[loading,setLoading]=useState(true)
  const[error,setError]=useState('')
  const[queryInput,setQueryInput]=useState('')
  const[query,setQuery]=useState('')
  const[period,setPeriod]=useState<Period>('7days')

  useEffect(()=>{supabase.from('login_activity_logs').select('id,profile_id,email,user_agent,logged_in_at,profiles!inner(name,student_no,department,role)').eq('profiles.role','student').order('logged_in_at',{ascending:false}).limit(500).then(({data,error:queryError})=>{if(queryError)setError(queryError.message);else setLogs((data??[]) as unknown as ActivityLog[]);setLoading(false)})},[])

  const filtered=useMemo(()=>{const now=Date.now();const cutoff=period==='today'?startOfToday():period==='7days'?now-7*86400000:period==='30days'?now-30*86400000:0;const keyword=query.toLowerCase();return logs.filter(log=>new Date(log.logged_in_at).getTime()>=cutoff&&[log.profiles?.name,log.profiles?.student_no,log.profiles?.department,log.email].some(value=>value?.toLowerCase().includes(keyword)))},[logs,period,query])
  const uniqueUsers=new Set(filtered.map(log=>log.profile_id)).size
  const todayCount=logs.filter(log=>new Date(log.logged_in_at).getTime()>=startOfToday()).length
  const latestByUser=new Map<string,ActivityLog>();logs.forEach(log=>{if(!latestByUser.has(log.profile_id))latestByUser.set(log.profile_id,log)})

  function search(event:FormEvent){event.preventDefault();setQuery(queryInput.trim())}
  if(loading)return <p className="text-slate-500">로그인 활동을 불러오는 중…</p>
  return <>
    <PageHeader eyebrow="Manager" title="로그인 활동">수강생의 앱 로그인 시각과 접속 환경을 확인합니다.</PageHeader>
    {error&&<p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    <div className="mt-8 grid gap-4 sm:grid-cols-3"><Metric icon={History} label="선택 기간 로그인" value={`${filtered.length}회`}/><Metric icon={Users} label="접속 수강생" value={`${uniqueUsers}명`}/><Metric icon={Clock3} label="오늘 로그인" value={`${todayCount}회`}/></div>
    <Card className="mt-6 overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5"><div><h2 className="font-black">활동 기록</h2><p className="mt-1 text-xs text-slate-500">최근 이벤트 최대 500건을 표시합니다.</p></div><div className="flex flex-wrap gap-2"><select className="rounded-xl border px-3 py-2.5 text-sm font-bold" value={period} onChange={event=>setPeriod(event.target.value as Period)}><option value="today">오늘</option><option value="7days">최근 7일</option><option value="30days">최근 30일</option><option value="all">전체</option></select><form className="flex gap-2" onSubmit={search}><label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input className="w-56 rounded-xl border py-2.5 pl-9 pr-3 text-sm" placeholder="이름·학번·이메일" value={queryInput} onChange={event=>setQueryInput(event.target.value)}/></label><Button className="px-4 py-2.5">검색</Button></form></div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['순번','이름','학번','학과','메일주소','로그인 시각','접속 환경'].map(item=><th className="whitespace-nowrap px-4 py-3 font-bold" key={item}>{item}</th>)}</tr></thead><tbody className="divide-y">{filtered.map((log,index)=><tr key={log.id} className="hover:bg-slate-50"><td className="px-4 py-3 text-center text-slate-400">{index+1}</td><td className="px-4 py-3 font-bold">{log.profiles?.name||'—'}</td><td className="px-4 py-3">{log.profiles?.student_no||'—'}</td><td className="px-4 py-3">{log.profiles?.department||'—'}</td><td className="px-4 py-3">{log.email}</td><td className="whitespace-nowrap px-4 py-3">{formatDateTime(log.logged_in_at)}</td><td className="px-4 py-3 text-xs text-slate-500" title={log.user_agent??''}>{deviceLabel(log.user_agent)}</td></tr>)}</tbody></table>{!filtered.length&&<p className="p-10 text-center text-sm text-slate-500">조건에 맞는 로그인 기록이 없습니다.</p>}</div>
    </Card>
    <Card className="mt-6"><h2 className="font-black">수강생별 최근 로그인</h2><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{[...latestByUser.values()].map(log=><div className="rounded-xl bg-slate-50 p-4" key={log.profile_id}><div className="flex justify-between gap-3"><strong>{log.profiles?.name}</strong><span className="text-xs text-slate-400">{log.profiles?.student_no}</span></div><p className="mt-2 text-xs text-slate-600">{formatDateTime(log.logged_in_at)}</p><p className="mt-1 text-xs text-slate-400">{deviceLabel(log.user_agent)}</p></div>)}</div></Card>
  </>
}

function Metric({icon:Icon,label,value}:{icon:typeof History;label:string;value:string}){return <Card><Icon className="h-5 w-5 text-inha-700"/><p className="mt-4 text-xs font-bold text-slate-500">{label}</p><strong className="mt-1 block text-2xl">{value}</strong></Card>}
function startOfToday(){const date=new Date();date.setHours(0,0,0,0);return date.getTime()}
function formatDateTime(value:string){return new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date(value))}
function deviceLabel(userAgent:string|null){if(!userAgent)return'알 수 없음';const mobile=/Mobile|Android|iPhone|iPad/i.test(userAgent);const browser=/Edg\//.test(userAgent)?'Edge':/Chrome\//.test(userAgent)?'Chrome':/Safari\//.test(userAgent)?'Safari':/Firefox\//.test(userAgent)?'Firefox':'기타 브라우저';return`${mobile?'모바일':'PC'} · ${browser}`}
