import { execFile } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'
import * as assert from 'remix/assert'
import { it } from 'remix/test'

import { withReviewLock, writeJsonAtomic } from './review-io.ts'

const run = promisify(execFile)
const probe = `
import fcntl, sys
with open(sys.argv[1], 'a') as lock:
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        assert sys.argv[2] == 'held'
    else:
        assert sys.argv[2] == 'free'
`

it('shares the kernel review lock with Python and releases it when the callback throws', async () => {
  let root = mkdtempSync(join(tmpdir(), 'review-lock-'))
  let lock = join(root, 'work', 'review-data.lock')
  let python = process.env.PYTHON ?? 'python3'
  try {
    await assert.rejects(withReviewLock(root, async () => {
      await run(python, ['-c', probe, lock, 'held'])
      let file = pathToFileURL(join(root, 'work', 'example.json'))
      writeJsonAtomic(file, { en: 'before' })
      writeJsonAtomic(file, { en: 'after' }, 2)
      assert.equal(readFileSync(file, 'utf8'), '{\n  "en": "after"\n}\n')
      throw new Error('callback failed')
    }), /callback failed/)
    await run(python, ['-c', probe, lock, 'free'])
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
