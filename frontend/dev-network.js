import { writeFileSync, readFileSync, unlinkSync } from 'node:fs'
import process from 'node:process'
import { createConnection } from 'node:net'

const occupied = (host, port) => new Promise(resolve => {
  const socket = createConnection({ host, port })
  const finish = used => { socket.destroy(); resolve(used) }
  socket.once('connect', () => finish(true))
  socket.once('error', () => finish(false))
  // A timeout is inconclusive: skip that port rather than risk an overlap.
  socket.setTimeout(400, () => finish(true))
})

export async function availableDevPort(first = 8080) {
  // Avoid a port already used by another local IPv4 or IPv6 installation.
  for (let port = first; port <= 65535; port++) {
    if (!(await Promise.all(['127.0.0.1', '::1'].map(host => occupied(host, port)))).some(Boolean)) return port
  }
  throw new Error('No available Vite port. Close an unused development server and retry.')
}

// Record the actual selected port, including Vite's automatic port fallback.
export function recordDevAddress(server, runtimeFile = new URL('../.quickcart-runtime.json', import.meta.url)) {
  // Keep Vite's ready banner and shortcuts, showing only this laptop's URL.
  // Suppress the default "Network: use --host to expose" hint as well.
  server.printUrls = () => {
    for (const url of server.resolvedUrls?.local || []) {
      const local = new URL(url)
      local.hostname = 'localhost'
      const color = !process.env.NO_COLOR && (process.stdout.isTTY || process.env.FORCE_COLOR)
      server.config.logger.info(color
        ? `  \u001b[32m➜\u001b[0m  \u001b[1mLocal:\u001b[0m   \u001b[36m${local.href}\u001b[0m`
        : `  ➜  Local:   ${local.href}`)
    }
  }
  server.httpServer?.once('listening', () => {
    const port = server.httpServer.address().port
    const protocol = server.config.server.https ? 'https' : 'http'
    try {
      writeFileSync(runtimeFile, JSON.stringify({ pid: process.pid, port, local: `${protocol}://127.0.0.1:${port}/` }, null, 2))
    } catch (error) { server.config.logger.warn('Cannot save demo connection info: ' + error.message) }
  })
  server.httpServer?.once('close', () => {
    try {
      if (JSON.parse(readFileSync(runtimeFile, 'utf8')).pid === process.pid) unlinkSync(runtimeFile)
    } catch { /* Already removed or another server owns this file. */ }
  })
}
