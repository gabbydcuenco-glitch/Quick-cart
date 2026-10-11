import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import process from 'node:process'
import { requireDockerBackend, watchDocker, backendUrl } from './docker-ready.js'
import { recordDevAddress, availableDevPort } from './dev-network.js'

export default defineConfig(async ({ command, mode }) => {
  const useHttps = command === 'serve' && mode === 'https'
  const containerDev = process.env.VITE_CONTAINER_DEV === '1'
  if (command === 'serve' && !containerDev) await requireDockerBackend()
  const cert = fileURLToPath(new URL('./.certs/localhost.pem', import.meta.url))
  const key = fileURLToPath(new URL('./.certs/localhost-key.pem', import.meta.url))
  if (useHttps && !containerDev && (!existsSync(cert) || !existsSync(key))) {
    throw new Error('Local HTTPS is not configured. Run npm run https:setup from the QuickCart project root, then npm run dev:https.')
  }
  return {
    plugins: [
      react(),
      {
        name: 'quickcart-require-docker',
        configureServer(server) {
          if (containerDev) return
          recordDevAddress(server)
          const stop = watchDocker(() => {
            console.error('\nDocker stopped or the QuickCart backend is gone. Stopping the dev server; start Docker, then run npm run dev again.')
            server.close().finally(() => process.exit(1))
          })
          server.httpServer?.once('close', stop)
        },
      },
    ],
    server: {
      // Each laptop runs its own local Vite server and Docker installation.
      host: containerDev ? '0.0.0.0' : '127.0.0.1',
      port: command === 'serve' && !containerDev ? await availableDevPort(mode === 'jenkins' ? 8083 : 8080) : 8080,
      strictPort: false,
      https: useHttps && !containerDev
        ? { cert: readFileSync(cert), key: readFileSync(key) }
        : undefined,
      allowedHosts: ['frontend', 'localhost'],
      watch: { usePolling: true },
      proxy: {
        '/api': {
          target: containerDev ? 'http://proxy:8080' : backendUrl(),
          changeOrigin: true,
        },
      },
    },
  }
})

