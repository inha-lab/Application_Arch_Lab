import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async(request)=>{
  if(request.method==='OPTIONS')return new Response('ok',{headers:corsHeaders})
  if(request.method!=='POST')return json({error:'Method not allowed'},405)
  try{
    const url=Deno.env.get('SUPABASE_URL')!
    const anonKey=Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authorization=request.headers.get('Authorization')
    if(!authorization)return json({error:'로그인이 필요합니다.'},401)

    const callerClient=createClient(url,anonKey,{global:{headers:{Authorization:authorization}}})
    const{data:{user},error:userError}=await callerClient.auth.getUser()
    if(userError||!user)return json({error:'유효하지 않은 사용자입니다.'},401)

    const admin=createClient(url,serviceKey,{auth:{autoRefreshToken:false,persistSession:false}})
    const{data:caller}=await admin.from('profiles').select('role').eq('id',user.id).single()
    if(!['professor','researcher'].includes(caller?.role))return json({error:'교수 또는 연구원만 수강생 계정을 생성할 수 있습니다.'},403)

    const body=await request.json()
    const participantIds=Array.isArray(body.participantIds)?body.participantIds.filter((id:unknown)=>typeof id==='string').slice(0,500):[]
    if(!participantIds.length)return json({error:'등록할 수강생이 없습니다.'},400)

    const{data:participants,error:participantError}=await admin.from('participants').select('id,email,name,student_no,department,phone,job_group,is_registered,profile_id').in('id',participantIds)
    if(participantError)return json({error:participantError.message},400)

    const existingUsers=new Map<string,{id:string,email?:string}>()
    for(let page=1;page<=10;page++){
      const{data,error}=await admin.auth.admin.listUsers({page,perPage:1000})
      if(error)return json({error:error.message},400)
      data.users.forEach(item=>{if(item.email)existingUsers.set(item.email.toLowerCase(),item)})
      if(data.users.length<1000)break
    }

    let registered=0
    const failures:{email:string;reason:string}[]=[]
    for(const participant of participants??[]){
      const email=String(participant.email??'').trim().toLowerCase()
      const phone=String(participant.phone??'')
      if(!email){failures.push({email:'메일주소 없음',reason:'메일주소가 필요합니다.'});continue}
      if(!phone.replace(/\D/g,'')){failures.push({email,reason:'초기 비밀번호 생성을 위한 연락처가 필요합니다.'});continue}
      let authUser=existingUsers.get(email)
      let created=false
      if(!authUser){
        const{data,error}=await admin.auth.admin.createUser({email,password:makeInitialPassword(phone),email_confirm:true,user_metadata:{name:participant.name}})
        if(error){failures.push({email,reason:error.message});continue}
        authUser=data.user;created=true;existingUsers.set(email,authUser)
      }
      const{data:existingProfile}=await admin.from('profiles').select('role').eq('id',authUser.id).maybeSingle()
      if(existingProfile&&existingProfile.role!=='student'){
        if(created)await admin.auth.admin.deleteUser(authUser.id)
        failures.push({email,reason:'이미 관리자 역할로 등록된 메일주소입니다.'});continue
      }
      const{error:profileError}=await admin.from('profiles').upsert({id:authUser.id,email,name:participant.name,student_no:participant.student_no,department:participant.department,phone:participant.phone,role:'student',job_group:participant.job_group},{onConflict:'id'})
      if(profileError){if(created)await admin.auth.admin.deleteUser(authUser.id);failures.push({email,reason:profileError.message});continue}
      const{error:linkError}=await admin.from('participants').update({profile_id:authUser.id,is_registered:true}).eq('id',participant.id)
      if(linkError){failures.push({email,reason:linkError.message});continue}
      registered++
    }
    return json({success:true,registered,failed:failures.length,failures,passwordRule:'연락처에서 010을 제외한 숫자 8자리'},200)
  }catch(error){return json({error:error instanceof Error?error.message:'수강생 계정 생성 중 오류가 발생했습니다.'},500)}
})

function makeInitialPassword(phone:string){let digits=phone.replace(/\D/g,'');if(digits.startsWith('010'))digits=digits.slice(3);return digits.length<8?digits.padEnd(8,'0'):digits.slice(0,8)}
function json(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}})}
