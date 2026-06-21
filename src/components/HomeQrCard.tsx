import { QrCode } from 'lucide-react'
import QRCode from 'qrcode'
import { useEffect, useRef } from 'react'

const appUrl='https://inha-lab.github.io/Application_Arch_Lab/'

export function HomeQrCard(){
  const canvasRef=useRef<HTMLCanvasElement>(null)
  useEffect(()=>{if(canvasRef.current)void QRCode.toCanvas(canvasRef.current,appUrl,{width:156,margin:1,color:{dark:'#172554',light:'#ffffff'}})},[])
  return <aside className="absolute right-8 top-48 z-10 hidden w-60 rounded-2xl border border-white/20 bg-white p-5 text-center shadow-2xl xl:block xl:right-20">
    <div className="flex items-center justify-center gap-2 text-sm font-black text-inha-950"><QrCode className="h-4 w-4"/>모바일 접속</div>
    <canvas ref={canvasRef} className="mx-auto mt-3 rounded-lg" aria-label="Application Architecture Lab 접속 QR 코드"/>
    <p className="mt-2 text-xs leading-5 text-slate-500">카메라로 스캔하여<br/>바로 접속하세요.</p>
  </aside>
}
