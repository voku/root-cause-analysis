import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'
import { defineConfig } from 'vite'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/root-cause-analysis/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src'),
    },
  },
})
