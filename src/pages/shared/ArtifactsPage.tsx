import { type FormEvent,useCallback,useEffect,useState } from 'react'
import { Download,ExternalLink,FileUp,PackageCheck } from 'lucide-react'
import { useAuth } from '@/auth/AuthProvider'
import { Button,Card,PageHeader } from '@/components/ui'
import { useMyTeam } from '@/hooks/useMyTeam'
import { supabase } from '@/lib/supabase'

interface Artifact{id:string;title:string;artifact_type:string;url:string|null;file_path:string|null;description:string|null;submitted_at:string;teams?:{name:string}|null}
const initialForm={title:'',artifact_type:'GitHub',url:'',description:''}
const artifactTypes=['GitHub','Notion','ERD','UML','기타']

export function ArtifactsPage(){
  const{profile}=useAuth()
  const{team,loading}=useMyTeam()
  const[rows,setRows]=useState<Artifact[]>([])
  const[form,setForm]=useState(initialForm)
  const[file,setFile]=useState<File|null>(null)
  const[message,setMessage]=useState('')
  const[busy,setBusy]=useState(false)
  const isStudent=profile?.role==='student'

  const load=useCallback(async()=>{let query=supabase.from('project_artifacts').select('id,title,artifact_type,url,file_path,description,submitted_at,teams(name)').order('submitted_at',{ascending:false});if(isStudent&&team)query=query.eq('team_id',team.id);const{data,error}=await query;if(error)setMessage(error.message);else setRows((data??[]) as unknown as Artifact[])},[isStudent,team])
  useEffect(()=>{if(!isStudent||team)void load()},[team,isStudent,load])

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!team||!profile)return
    if(!form.url&&!file){setMessage('URL 또는 첨부파일 중 하나를 입력해 주세요.');return}
    if(file&&file.size>20*1024*1024){setMessage('첨부파일은 20MB 이하만 등록할 수 있습니다.');return}
    setBusy(true);setMessage('산출물을 등록하는 중…')
    let filePath:string|null=null
    if(file){filePath=`${team.id}/${crypto.randomUUID()}-${safeName(file.name)}`;const{error}=await supabase.storage.from('project-artifacts').upload(filePath,file,{contentType:file.type||undefined,upsert:false});if(error){setBusy(false);setMessage(error.message);return}}
    const{error}=await supabase.from('project_artifacts').insert({team_id:team.id,...form,url:form.url||null,file_path:filePath,description:form.description||null,submitted_by:profile.id})
    if(error){if(filePath)await supabase.storage.from('project-artifacts').remove([filePath]);setBusy(false);setMessage(error.message);return}
    setForm(initialForm);setFile(null);event.currentTarget.reset();setBusy(false);setMessage('산출물을 등록했습니다.');await load()
  }

  async function download(path:string){const{data,error}=await supabase.storage.from('project-artifacts').createSignedUrl(path,60);if(error){setMessage(error.message);return}window.open(data.signedUrl,'_blank','noopener,noreferrer')}

  if(loading&&isStudent)return <p>불러오는 중…</p>
  return <>
    <PageHeader eyebrow="Deliverables" title="산출물 관리">GitHub, Notion, ERD, UML 링크와 첨부파일을 관리합니다.</PageHeader>
    {isStudent&&team&&<Card className="mt-8"><form onSubmit={submit} className="grid gap-4 md:grid-cols-2"><Field label="제목" value={form.title} set={value=>setForm({...form,title:value})} required/><label className="text-sm font-bold">유형<select className="mt-2 w-full rounded-xl border px-4 py-3" value={form.artifact_type} onChange={event=>setForm({...form,artifact_type:event.target.value})}>{artifactTypes.map(item=><option key={item}>{item}</option>)}</select></label><Field label="URL" type="url" value={form.url} set={value=>setForm({...form,url:value})}/><Field label="설명" value={form.description} set={value=>setForm({...form,description:value})}/><label className="rounded-xl border border-dashed border-slate-300 p-4 text-sm font-bold md:col-span-2"><span className="flex items-center gap-2"><FileUp className="h-4 w-4 text-inha-700"/>첨부파일 <span className="font-normal text-slate-400">최대 20MB</span></span><input className="mt-3 block w-full text-sm font-normal" type="file" accept=".pdf,.png,.jpg,.jpeg,.svg,.zip,.drawio,.json,.md,.doc,.docx,.ppt,.pptx" onChange={event=>setFile(event.target.files?.[0]??null)}/></label><Button className="md:col-span-2" disabled={busy}>{busy?'등록 중…':'산출물 등록'}</Button></form>{message&&<p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">{message}</p>}</Card>}
    {!isStudent&&message&&<p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}
    <div className="mt-7 grid gap-4 md:grid-cols-2">{rows.map(row=><Card key={row.id}><div className="flex items-start justify-between"><PackageCheck className="h-5 w-5 text-inha-700"/><span className="text-xs text-slate-400">{row.teams?.name}</span></div><h2 className="mt-4 font-black">{row.title}</h2><p className="mt-1 text-xs font-bold text-slate-500">{row.artifact_type}</p><p className="mt-3 text-sm text-slate-600">{row.description}</p><div className="mt-4 flex flex-wrap gap-2">{row.url&&<a className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-inha-700" href={row.url} target="_blank" rel="noreferrer">URL 열기<ExternalLink className="h-4 w-4"/></a>}{row.file_path&&<button className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700" onClick={()=>download(row.file_path!)}>첨부파일<Download className="h-4 w-4"/></button>}</div></Card>)}{!rows.length&&<Card className="border-dashed text-center text-slate-500 md:col-span-2">등록된 산출물이 없습니다.</Card>}</div>
  </>
}

function Field({label,value,set,type='text',required=false}:{label:string;value:string;set:(value:string)=>void;type?:string;required?:boolean}){return <label className="text-sm font-bold">{label}<input required={required} className="mt-2 w-full rounded-xl border px-4 py-3" type={type} value={value} onChange={event=>set(event.target.value)}/></label>}
function safeName(name:string){return name.normalize('NFKC').replace(/[^a-zA-Z0-9._-]+/g,'_').slice(-120)||'attachment'}
