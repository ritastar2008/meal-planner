import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/meal-planner/', // 確保路徑與你的 GitHub Repo 名稱一致
})
