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
    if(!['professor','researcher'].includes(caller?.role))return json({error:'교수 또는 연구원만 관리자를 등록할 수 있습니다.'},403)

    const body=await request.json()
    const name=String(body.name??'').trim()
    const email=String(body.email??'').trim().toLowerCase()
    const phone=String(body.phone??'').trim()||null
    const password=String(body.password??'')
    const role=body.role
    if(!name||!email||password.length<8||!['professor','researcher'].includes(role))return json({error:'이름, 메일주소, 역할, 8자 이상의 비밀번호를 확인해 주세요.'},400)

    const{data:created,error:createError}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{name}})
    if(createError)return json({error:createError.message},400)
    const createdUser=created.user
    const{error:profileError}=await admin.from('profiles').insert({id:createdUser.id,email,name,phone,role})
    if(profileError){await admin.auth.admin.deleteUser(createdUser.id);return json({error:profileError.message},400)}
    return json({success:true,user:{id:createdUser.id,email,name,role}},201)
  }catch(error){return json({error:error instanceof Error?error.message:'관리자 등록 중 오류가 발생했습니다.'},500)}
})

function json(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}})}
