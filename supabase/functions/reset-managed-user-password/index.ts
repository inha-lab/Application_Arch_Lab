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
    if(!['professor','researcher'].includes(caller?.role))return json({error:'교수 또는 연구원만 수강생 비밀번호를 초기화할 수 있습니다.'},403)

    const{participantId}=await request.json()
    if(typeof participantId!=='string')return json({error:'수강생 정보가 필요합니다.'},400)
    const{data:participant,error:participantError}=await admin.from('participants').select('id,name,email,phone,profile_id,is_registered').eq('id',participantId).single()
    if(participantError||!participant)return json({error:'수강생을 찾을 수 없습니다.'},404)
    if(!participant.profile_id||!participant.is_registered)return json({error:'계정 등록이 완료되지 않은 수강생입니다.'},400)
    const digits=String(participant.phone??'').replace(/\D/g,'')
    if(!digits)return json({error:'초기 비밀번호 생성을 위한 연락처가 없습니다.'},400)
    const password=makeInitialPassword(String(participant.phone))
    const{error:updateError}=await admin.auth.admin.updateUserById(participant.profile_id,{password})
    if(updateError)return json({error:updateError.message},400)
    return json({success:true,email:participant.email,name:participant.name,initialPassword:password})
  }catch(error){return json({error:error instanceof Error?error.message:'비밀번호 초기화 중 오류가 발생했습니다.'},500)}
})

function makeInitialPassword(phone:string){let digits=phone.replace(/\D/g,'');if(digits.startsWith('010'))digits=digits.slice(3);return digits.length<8?digits.padEnd(8,'0'):digits.slice(0,8)}
function json(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}})}
