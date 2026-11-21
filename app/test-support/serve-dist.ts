import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIST = fileURLToPath(new URL('../../dist/', import.meta.url))
const TYPES: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }

// A folder answers with its index.html. Test Cloudflare redirects separately in Wrangler.
export async function serveDist() {
  let server = createServer(async (req, res) => {
    let file = join(DIST, decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname))
    try {
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html')
      let body = await readFile(file)
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' })
      res.end(body)
    } catch {
      res.writeHead(404)
      res.end()
    }
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  let { port } = server.address() as { port: number }
  return { baseUrl: `http://127.0.0.1:${port}`, close: () => new Promise<void>((resolve) => server.close(() => resolve())) }
}
