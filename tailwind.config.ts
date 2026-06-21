import type { Config } from 'tailwindcss'
export default { content: ['./index.html','./src/**/*.{ts,tsx}'], theme: { extend: { colors: { inha: { 50:'#eff6ff',500:'#2563eb',700:'#1d4ed8',950:'#172554' } }, boxShadow: { soft:'0 18px 55px rgba(15,23,42,.08)' } } }, plugins: [] } satisfies Config
