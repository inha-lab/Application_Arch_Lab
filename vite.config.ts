import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return { plugins: [react()], base: env.VITE_APP_BASE_PATH || '/Application_Arch_Lab/', resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } } }
})
