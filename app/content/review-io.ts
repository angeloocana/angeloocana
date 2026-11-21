import { spawn } from 'node:child_process'
import { mkdtempSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HELPER = fileURLToPath(new URL('../../scripts/clips/review_io.py', import.meta.url))

/** Share the kernel lock with clips.py. Do not acquire it again inside work. */
export async function withReviewLock<T>(mediaRoot: string, work: () => T | Promise<T>): Promise<T> {
  let helper = spawn(process.env.PYTHON ?? 'python3', [HELPER, mediaRoot], { stdio: ['pipe', 'pipe', 'pipe'] })
  let error = ''
  helper.stderr.setEncoding('utf8').on('data', (chunk) => (error += chunk))
  helper.on('error', (cause) => (error += cause.message))
  helper.stdin.on('error', (cause) => (error += cause.message))
  let closed = new Promise<number | null>((resolve) => helper.once('close', resolve))
  let acquired = new Promise<boolean>((resolve) => {
    helper.stdout.setEncoding('utf8').once('data', (chunk: string) => resolve(chunk[0] === '1'))
    void closed.then(() => resolve(false))
  })
  let failed = () => new Error(`Review lock helper failed${error.trim() ? `: ${error.trim()}` : ''}`)

  let result: T
  let status: number | null
  try {
    if (!(await acquired)) throw failed()
    result = await work()
  } finally {
    // EOF releases the lock, including if this Node process dies mid-operation.
    helper.stdin.end()
    status = await closed
  }
  if (status !== 0) throw failed()
  return result
}

/** Atomically replace JSON without ever sharing a temporary filename with another writer. */
export function writeJsonAtomic(file: string | URL, data: unknown, indent = 1): void {
  let path = typeof file === 'string' ? file : fileURLToPath(file)
  let json = JSON.stringify(data, null, indent)
  if (json === undefined) throw new TypeError('Expected serializable JSON')
  let scratch = mkdtempSync(join(dirname(path), '.review-json-'))
  let staged = join(scratch, 'data.json')
  try {
    writeFileSync(staged, json + '\n')
    renameSync(staged, path)
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
}
