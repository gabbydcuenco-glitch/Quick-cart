import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

export default defineConfig(({ command, mode }) => {
  const useHttps = command === 'serve' && mode === 'https'
  const containerDev = process.env.VITE_CONTAINER_DEV === '1'
  const cert = fileURLToPath(new URL('./.certs/localhost.pem', import.meta.url))
  const key = fileURLToPath(new URL('./.certs/localhost-key.pem', import.meta.url))
  if (useHttps && !containerDev && (!existsSync(cert) || !existsSync(key))) {
    throw new Error('Local HTTPS is not configured. Run npm run https:setup from the QuickCart project root, then npm run dev:https.')
  }
  return {
    plugins: [react()],
    server: {
      host: containerDev ? '0.0.0.0' : 'localhost',
      port: 8080,
      strictPort: true,
      https: useHttps && !containerDev
        ? { cert: readFileSync(cert), key: readFileSync(key) }
        : undefined,
      allowedHosts: ['frontend', 'localhost'],
      watch: { usePolling: true },
      proxy: {
        '/api': {
          target: containerDev ? 'http://proxy:8080' : 'http://127.0.0.1:8082',
          changeOrigin: true,
        },
      },
    },
  }
})

