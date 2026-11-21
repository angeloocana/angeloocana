// The local Python approval command uses the same public boundary as the HTTP route.
import { readFileSync } from 'node:fs'
import { assertPublicClipData } from '../app/content/public-clip-data.ts'

try {
  assertPublicClipData([JSON.parse(readFileSync(0, 'utf8'))])
} catch {
  process.exitCode = 1
}
