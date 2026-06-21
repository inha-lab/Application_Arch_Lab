import { useCallback,useEffect,useState } from 'react'
import { useAuth } from '@/auth/AuthProvider'
import { supabase } from '@/lib/supabase'

export interface MyTeam { id:string;name:string;topic:string|null;project_name:string|null;internship_company:string|null;status:string;notion_url:string|null;github_url:string|null;demo_url:string|null;team_members:{id:string;profile_id:string;is_leader:boolean;profiles:{name:string;department:string|null;student_no:string|null;email:string;phone:string|null}|null}[] }

export function useMyTeam(){const{profile}=useAuth();const[team,setTeam]=useState<MyTeam|null>(null);const[loading,setLoading]=useState(true);const load=useCallback(async()=>{if(!profile){setLoading(false);return}setLoading(true);const{data}=await supabase.from('team_members').select('teams(id,name,topic,project_name,internship_company,status,notion_url,github_url,demo_url,team_members(id,profile_id,is_leader,profiles(name,department,student_no,email,phone)))').eq('profile_id',profile.id).limit(1).maybeSingle();setTeam((data?.teams??null) as unknown as MyTeam|null);setLoading(false)},[profile]);useEffect(()=>{void load()},[load]);return{team,loading,reload:load}}
