import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 設定為您的 GitHub Repository 名稱，前後都要有斜線
  // 如果您的網址是 chiuchuijen.github.io/BDO，這裡就是 '/BDO/'
  base: '/BDO/', 
})