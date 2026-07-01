import { Bell, BookOpen, ClipboardList, FolderKanban, History, LayoutDashboard, LogOut, Menu, PackageCheck, ShieldCheck, Users, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'

const roleNames={professor:'교수',student:'학생',researcher:'연구원'}
const menus={
  professor:[['','대시보드',LayoutDashboard],['participants','수강생 관리',Users],['activity-logs','로그인 활동',History],['admin-users','관리자 관리',ShieldCheck],['teams','팀 관리',FolderKanban],['projects','프로젝트 현황',BookOpen],['reports','주간(일)보고',ClipboardList],['artifacts','산출물 관리',PackageCheck],['/announcements','공지사항',Bell]],
  student:[['','대시보드',LayoutDashboard],['team','내 팀',Users],['project-plan','프로젝트 기획서',BookOpen],['weekly-reports','주간(일)보고',ClipboardList],['artifacts','산출물 제출',PackageCheck],['/announcements','공지사항',Bell]],
  researcher:[['','대시보드',LayoutDashboard],['participants','수강생 관리',Users],['activity-logs','로그인 활동',History],['admin-users','관리자 관리',ShieldCheck],['teams','팀 관리',FolderKanban],['projects','프로젝트 현황',BookOpen],['reports','주간(일)보고',ClipboardList],['artifacts','산출물 관리',PackageCheck],['/announcements','공지사항',Bell]],
} as const

export function DashboardLayout(){
  const{profile,signOut}=useAuth()
  const[open,setOpen]=useState(false)
  const role=profile?.role??'student'
  return <div className="min-h-screen bg-slate-50">
    <header className="fixed inset-x-0 top-0 z-20 flex h-16 items-center border-b border-slate-200 bg-white px-4 shadow-sm print:hidden lg:hidden">
      <button className="rounded-lg p-2 text-inha-950 hover:bg-slate-100" onClick={()=>setOpen(!open)} aria-label="메뉴 열기">{open?<X/>:<Menu/>}</button>
      <div className="pointer-events-none absolute inset-x-14 flex items-center justify-center gap-2 text-left"><img src={`${import.meta.env.BASE_URL}icons/inha_aal_icon_512.svg`} alt="" className="h-9 w-9 rounded-lg"/><div className="min-w-0"><p className="truncate text-[10px] font-black tracking-[.12em] text-inha-700">INHA UNIVERSITY</p><strong className="block truncate text-sm text-inha-950">Application Architecture Lab</strong></div></div>
    </header>
    {open&&<button className="fixed inset-0 z-20 bg-slate-950/40 lg:hidden" onClick={()=>setOpen(false)} aria-label="메뉴 닫기"/>}
    <aside className={`fixed inset-y-0 left-0 z-30 w-72 bg-inha-950 p-6 text-white transition-transform print:hidden lg:translate-x-0 ${open?'translate-x-0':'-translate-x-full'}`}>
      <NavLink to="/" className="flex items-center gap-3"><img src={`${import.meta.env.BASE_URL}icons/inha_aal_icon_512.svg`} alt="" className="h-12 w-12 rounded-xl"/><span><span className="block text-[10px] font-black tracking-[.16em] text-blue-300">INHA UNIVERSITY</span><strong className="mt-1 block text-lg leading-tight">Application<br/>Architecture Lab</strong></span></NavLink>
      <nav className="mt-8 space-y-1">{menus[role].map(([path,label,Icon])=><NavLink key={label} to={path.startsWith('/')?path:`/${role}${path?`/${path}`:''}`} end={!path} onClick={()=>setOpen(false)} className={({isActive})=>`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold ${isActive?'bg-white text-inha-950':'text-slate-300 hover:bg-white/10 hover:text-white'}`}><Icon className="h-5 w-5"/>{label}</NavLink>)}</nav>
      <div className="absolute bottom-6 left-6 right-6 border-t border-white/15 pt-5"><NavLink to="/mypage" className="block text-sm font-bold">{profile?.name??'사용자'} <span className="font-normal text-slate-400">· {roleNames[role]}</span></NavLink><button onClick={signOut} className="mt-3 flex items-center gap-2 text-xs text-slate-400 hover:text-white"><LogOut className="h-4 w-4"/>로그아웃</button></div>
    </aside>
    <main className="min-h-screen p-5 pt-24 print:p-0 lg:ml-72 lg:p-10 lg:print:ml-0"><div className="mx-auto max-w-[1600px] print:max-w-none"><Outlet/></div></main>
  </div>
}
