import type { ButtonHTMLAttributes,HTMLAttributes,ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'
export function Button({className,...props}:ButtonHTMLAttributes<HTMLButtonElement>){return <button className={twMerge('inline-flex items-center justify-center gap-2 rounded-xl bg-inha-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-inha-700 disabled:opacity-50',className)} {...props}/>}
export function Card({className,...props}:HTMLAttributes<HTMLDivElement>){return <div className={twMerge('rounded-2xl border border-slate-200 bg-white p-6 shadow-soft',className)} {...props}/>}
export function PageHeader({eyebrow,title,children}:{eyebrow?:string;title:string;children?:ReactNode}){return <div><p className="text-xs font-black uppercase tracking-[.18em] text-inha-700">{eyebrow}</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{title}</h1>{children&&<p className="mt-3 max-w-2xl text-slate-600">{children}</p>}</div>}
