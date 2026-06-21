import type { SortDirection } from '@/components/SortableHeader'

export function sortBy<T>(rows:T[],key:keyof T,direction:SortDirection){
  const factor=direction==='asc'?1:-1
  return [...rows].sort((left,right)=>{
    const a=left[key]
    const b=right[key]
    if(a==null||a==='')return b==null||b===''?0:1
    if(b==null||b==='')return -1
    if(typeof a==='number'&&typeof b==='number')return(a-b)*factor
    return String(a).localeCompare(String(b),'ko',{numeric:true,sensitivity:'base'})*factor
  })
}
