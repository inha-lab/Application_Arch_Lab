import { createContext,useContext,useEffect,useMemo,useState,type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured,supabase } from '@/lib/supabase'
import type { Profile } from '@/types/app.types'

type AuthValue={session:Session|null;profile:Profile|null;loading:boolean;signIn:(email:string,password:string)=>Promise<string|null>;signOut:()=>Promise<void>}
const AuthContext=createContext<AuthValue|null>(null)

export function AuthProvider({children}:{children:ReactNode}){
  const[session,setSession]=useState<Session|null>(null)
  const[profile,setProfile]=useState<Profile|null>(null)
  const[authReady,setAuthReady]=useState(false)
  const[profileLoading,setProfileLoading]=useState(false)
  const userId=session?.user.id

  useEffect(()=>{
    if(!isSupabaseConfigured){setAuthReady(true);return}
    let active=true
    supabase.auth.getSession().then(({data})=>{if(active){setSession(data.session);setAuthReady(true)}})
    const{data}=supabase.auth.onAuthStateChange((_event,nextSession)=>{if(active){setSession(nextSession);setAuthReady(true)}})
    return()=>{active=false;data.subscription.unsubscribe()}
  },[])

  useEffect(()=>{
    if(!authReady)return
    if(!userId){setProfile(null);setProfileLoading(false);return}
    if(profile?.id===userId){setProfileLoading(false);return}
    let active=true
    setProfileLoading(true)
    supabase.from('profiles').select('*').eq('id',userId).single().then(({data})=>{if(active){setProfile(data as Profile|null);setProfileLoading(false)}})
    return()=>{active=false}
  },[userId,authReady,profile?.id])

  const value=useMemo<AuthValue>(()=>({session,profile,loading:!authReady||profileLoading||(Boolean(session)&&!profile),signIn:async(email,password)=>{if(!isSupabaseConfigured)return'Supabase 환경변수를 먼저 설정해 주세요.';const{error}=await supabase.auth.signInWithPassword({email,password});if(error)return error.message;await supabase.rpc('record_login_activity',{client_user_agent:navigator.userAgent});return null},signOut:async()=>{await supabase.auth.signOut()}}),[session,profile,authReady,profileLoading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error('AuthProvider가 필요합니다.');return value}
