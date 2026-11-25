import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIST = fileURLToPath(new URL('../../dist/', import.meta.url))
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2',
}

// Serve files with the CSP Cloudflare receives, not a permissive test-only policy. A miss gets 404.html
// (wrangler.jsonc's not_found_handling) with the headers of the requested path, as _headers applies them.
export async function serveDist() {
  let headers = await readFile(join(DIST, '_headers'), 'utf8')
  let policies = [...headers.matchAll(/^(\S+)\n  Content-Security-Policy: (.+)$/gm)]
  let server = createServer(async (req, res) => {
    let path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname)
    let file = join(DIST, path)
    let status = 200
    try {
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html')
      await stat(file)
    } catch {
      file = join(DIST, '404.html')
      status = 404
    }
    let policy = policies.find(([, pattern]) => pattern.endsWith('*') ? path.startsWith(pattern.slice(0, -1)) : path === pattern)?.[2]
    res.writeHead(status, {
      'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
      ...(policy ? { 'Content-Security-Policy': policy } : {}),
    })
    res.end(await readFile(file))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  let { port } = server.address() as { port: number }
  return { baseUrl: `http://127.0.0.1:${port}`, close: () => new Promise<void>((resolve) => server.close(() => resolve())) }
}
