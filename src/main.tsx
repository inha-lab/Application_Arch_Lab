import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { AuthProvider } from './auth/AuthProvider'
import './index.css'
const redirect=sessionStorage.getItem('redirect')
if(redirect){
  sessionStorage.removeItem('redirect')
  const url=new URL(redirect)
  const base=import.meta.env.BASE_URL.replace(/\/$/,'')
  const pathname=url.pathname.startsWith(base) ? url.pathname : `${base}${url.pathname.startsWith('/') ? url.pathname : `/${url.pathname}`}`
  history.replaceState(null,'',`${pathname}${url.search}${url.hash}`)
}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter basename={import.meta.env.BASE_URL}><AuthProvider><App/></AuthProvider></BrowserRouter></React.StrictMode>)
