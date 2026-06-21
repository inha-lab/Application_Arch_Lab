import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

export type SortDirection='asc'|'desc'

export function SortableHeader({label,active,direction,onClick}:{label:string;active:boolean;direction:SortDirection;onClick:()=>void}){
  const Icon=active?(direction==='asc'?ArrowUp:ArrowDown):ArrowUpDown
  return <th className="whitespace-nowrap px-3 py-2.5 font-bold"><button type="button" className={`inline-flex items-center gap-1.5 hover:text-inha-700 ${active?'text-inha-700':'text-slate-500'}`} onClick={onClick}>{label}<Icon className="h-3.5 w-3.5"/></button></th>
}
