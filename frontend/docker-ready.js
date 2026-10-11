import { existsSync, readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
const envFile = new URL('../.env', import.meta.url)
const installation = { settings: () => existsSync(envFile) ? parseEnv(readFileSync(envFile, 'utf8').replace(/^\uFEFF/, '')) : {} }
export const backendUrl = () => 'http://127.0.0.1:' + (installation.settings().QUICKCART_PORT || 8082)
const projectFilter = () => 'label=com.docker.compose.project=' + (installation.settings().COMPOSE_PROJECT_NAME || 'quickcart-unconfigured')
import { execFile, spawnSync } from 'node:child_process'

export async function requireDockerBackend() {
  const docker = spawnSync('docker', ['info', '--format', '{{.ServerVersion}}'], {
    encoding: 'utf8', timeout: 10000, windowsHide: true,
  })
  if (docker.status !== 0) {
    throw new Error('Docker is unavailable. Open Docker Desktop, wait for the engine, then run npm run dev again.')
  }
  // Something else answering on 8082 must not count: the gateway has to be a running Docker container.
  const gateway = spawnSync('docker', ['ps', '--filter', projectFilter(), '--filter', 'label=com.docker.compose.service=proxy', '--filter', 'status=running', '--format', '{{.Names}}'], {
    encoding: 'utf8', timeout: 10000, windowsHide: true,
  })
  if (gateway.status !== 0 || !gateway.stdout.trim()) {
    throw new Error('QuickCart backend is not running in Docker. Run npm run setup:dev from the project root, then npm run dev.')
  }
  try {
    await Promise.all(['catalog', 'orders', 'payment'].map(async service => {
      const response = await fetch(`${backendUrl()}/api/${service}/health`, {
        signal: AbortSignal.timeout(3000),
      })
      if (!response.ok || (await response.json()).status !== 'ok') throw new Error('Backend unavailable')
    }))
  } catch {
    throw new Error('QuickCart backend is unavailable. Run npm run setup:dev from the project root, then npm run dev.')
  }
}

// Only loss of Docker/the gateway stops Vite. A slow/restarting API is handled
// by the store's reconnect screen, so an API timeout cannot kill the website.
const probe = (args) => new Promise(resolve => {
  execFile('docker', args, { timeout: 10000, windowsHide: true }, (error, stdout) => resolve(!error && String(stdout).trim() !== ''))
})
export async function dockerRuntimeAvailable() {
  if (!await probe(['info', '--format', '{{.ServerVersion}}'])) return false
  return probe(['ps', '--filter', 'label=com.docker.compose.service=proxy', '--filter', projectFilter(), '--filter', 'status=running', '--format', '{{.Names}}'])
}
export async function dockerBackendAvailable() {
  if (!await dockerRuntimeAvailable()) return false
  try {
    await Promise.all(['catalog', 'orders', 'payment'].map(async service => {
      const res = await fetch(`${backendUrl()}/api/${service}/health`, { cache: 'no-store', signal: AbortSignal.timeout(5000) })
      if (!res.ok || (await res.json()).status !== 'ok') throw new Error('Unavailable')
    }))
    return true
  } catch { return false }
}
export function watchDocker(onLost, { intervalMs = 3000, check = dockerRuntimeAvailable, maxFailures = 3 } = {}) {
  let active = true
  let timer
  let failures = 0
  const tick = async () => {
    let up = false
    try { up = await check() } catch { /* fail closed */ }
    if (!active) return
    failures = up ? 0 : failures + 1
    if (failures >= maxFailures) { active = false; onLost(); return }
    timer = setTimeout(tick, intervalMs)
    timer.unref()
  }
  timer = setTimeout(tick, intervalMs)
  timer.unref()
  return () => { active = false; clearTimeout(timer) }
}
