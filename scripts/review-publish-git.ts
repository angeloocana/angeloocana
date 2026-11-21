import { spawnSync, type SpawnSyncReturns } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { devNull } from 'node:os'
import { join, resolve } from 'node:path'

const MASTER = 'refs/heads/master'
const CLIPS = 'app/content/clips.json'
const MEDIA = 'app/content/media.json'

export interface ReviewGit {
  fetchMaster(): { sha: string; clipsJson: string; mediaJson: string }
  makeCandidate(masterSha: string, clipsJson: string, mediaJson: string): string
  pushCandidate(masterSha: string, candidateSha: string): 'pushed' | 'moved'
  contains(masterSha: string, candidateSha: string): boolean
  close(): void
}

function gitFailure(action: string, result: SpawnSyncReturns<string>, rejection?: string): Error {
  // Git and remote hooks may print credentials, paths, or arbitrary text. Show only fixed diagnostics.
  const stderr = result.stderr ?? ''
  let reason = `Git exited with status ${result.status ?? result.signal ?? 'unknown'}`
  if (result.error) reason = 'could not run Git'
  else if (/hook declined/.test(rejection ?? '')) reason = 'the remote rejected the push with a hook'
  else if (/authentication failed|could not read (username|password)|permission denied|access denied|(?:error|HTTP)[: ]+(?:401|403)\b/i.test(stderr)) {
    reason = 'Git authentication failed or access was denied'
  } else if (/could not resolve (host|hostname)|failed to connect|connection (refused|reset|timed out)|operation timed out|SSL certificate|TLS/i.test(stderr)) {
    reason = 'could not connect to origin (network or TLS error)'
  } else if (rejection?.startsWith('[remote rejected]')) reason = 'origin refused to update master (check branch rules and permissions)'
  return new Error(`Review Git could not ${action}: ${reason}`)
}

export function openReviewGit(sourceRepo: string, scratchRoot: string): ReviewGit {
  // A parent Git process (e.g. a hook) may have exported its repository or index location.
  const env: NodeJS.ProcessEnv = { ...process.env, LC_ALL: 'C', GIT_TERMINAL_PROMPT: '0' }
  for (const key of [
    'GIT_DIR', 'GIT_COMMON_DIR', 'GIT_WORK_TREE', 'GIT_IMPLICIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_PREFIX',
    'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_SHALLOW_FILE', 'GIT_GRAFT_FILE',
    'GIT_REPLACE_REF_BASE', 'GIT_CONFIG', 'GIT_CONFIG_COUNT', 'GIT_CONFIG_PARAMETERS',
  ]) delete env[key]
  env.GIT_NO_REPLACE_OBJECTS = '1'

  function git(cwd: string, args: string[], input?: string) {
    return spawnSync('git', args, { cwd, env, input, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
  }
  function checked(cwd: string, action: string, args: string[], input?: string): string {
    const result = git(cwd, args, input)
    if (result.status !== 0) throw gitFailure(action, result)
    return result.stdout
  }
  const source = (action: string, ...args: string[]) => checked(sourceRepo, action, args).trim()
  const url = source('read the source origin URL', 'remote', 'get-url', 'origin')
  // Relative filesystem remotes are relative to the source checkout, not the disposable repo.
  const origin = /^[^/]+:/.test(url) ? url : resolve(sourceRepo, url)
  const format = source('read the source object format', 'rev-parse', '--show-object-format')
  env.GIT_AUTHOR_NAME = env.GIT_COMMITTER_NAME = source('read the source Git user.name', 'config', '--get', 'user.name')
  env.GIT_AUTHOR_EMAIL = env.GIT_COMMITTER_EMAIL = source('read the source Git user.email', 'config', '--get', 'user.email')

  mkdirSync(scratchRoot, { recursive: true })
  const workspace = mkdtempSync(join(resolve(scratchRoot), 'review-git-'))
  const close = () => rmSync(workspace, { recursive: true, force: true })
  const run = (action: string, args: string[], input?: string) => checked(workspace, action, args, input)
  try {
    // No source clone, shared objects, inherited templates, or checkout filters.
    run('create a disposable repository', ['init', '--bare', '--quiet', '--template=', `--object-format=${format}`])
    run('disable local hooks in the disposable repository', ['config', '--local', 'core.hooksPath', devNull])
  } catch (error) {
    close()
    throw error
  }

  let fetchedSha: string | undefined
  const candidates = new Set<string>()
  function requireFetched(sha: string) {
    if (sha !== fetchedSha) throw new Error('Review Git requires the latest fetched master SHA')
  }

  return {
    fetchMaster() {
      fetchedSha = undefined
      candidates.clear()
      run('fetch origin master', ['fetch', '--no-tags', '--no-recurse-submodules', '--refmap=', '--', origin, MASTER])
      const sha = run('identify fetched master', ['rev-parse', 'FETCH_HEAD^{commit}']).trim()
      const clipsJson = run('read clips.json from master', ['cat-file', 'blob', `${sha}:${CLIPS}`])
      const mediaJson = run('read media.json from master', ['cat-file', 'blob', `${sha}:${MEDIA}`])
      fetchedSha = sha
      return { sha, clipsJson, mediaJson }
    },
    makeCandidate(masterSha, clipsJson, mediaJson) {
      requireFetched(masterSha)
      const updates = [[CLIPS, clipsJson], [MEDIA, mediaJson]].flatMap(([path, text]) => {
        const blob = run(`write ${path} blob`, ['hash-object', '-w', '--stdin'], text).trim()
        const prior = run(`identify ${path} on master`, ['rev-parse', `${masterSha}:${path}`]).trim()
        return blob === prior ? [] : [`100644,${blob},${path}`]
      })
      if (!updates.length) return masterSha

      // A bare repo's index is private to this workspace. Start it from the exact fetched tree.
      run('load the master tree into the private index', ['read-tree', masterSha])
      for (const update of updates) run('update the private index', ['update-index', '--add', '--cacheinfo', update])
      const tree = run('write the candidate tree', ['write-tree']).trim()
      const candidate = run('commit the review candidate', [
        'commit-tree', tree, '-p', masterSha, '--no-gpg-sign', '-m', 'Clip review: update clips and media',
        '-m', 'Published by the review server (scripts/publish-review.ts).',
      ]).trim()
      candidates.add(candidate)
      return candidate
    },
    pushCandidate(masterSha, candidateSha) {
      requireFetched(masterSha)
      if (candidateSha !== masterSha && !candidates.has(candidateSha)) {
        throw new Error('Review Git can only push master or a candidate made from it in this workspace')
      }
      // The lease is an exact compare-and-swap, and the candidate is a direct child of that base.
      const result = git(workspace, [
        'push', '--porcelain', '--no-follow-tags', '--recurse-submodules=no',
        `--force-with-lease=${MASTER}:${masterSha}`, '--', origin, `${candidateSha}:${MASTER}`,
      ])
      if (result.status === 0) return 'pushed'

      const rejection = (result.stdout ?? '').split('\n').find((line) =>
        line.startsWith('!\t') && line.split('\t')[1]?.endsWith(`:${MASTER}`),
      )?.split('\t')[2]
      if (rejection === '[rejected] (stale info)' || rejection === '[rejected] (fetch first)' ||
        rejection === '[rejected] (non-fast-forward)' || rejection === '[remote rejected] (non-fast-forward)' ||
        rejection === '[remote rejected] (incorrect old value provided)') return 'moved'
      // Some Git versions use a generic status for a move during receive-pack's ref transaction.
      const mismatch = `cannot lock ref '${MASTER}': is at [0-9a-f]+ but expected ${masterSha}\\b`
      if (rejection === '[remote rejected] (failed to update ref)' && new RegExp(mismatch).test(result.stderr ?? '')) return 'moved'
      throw gitFailure('push master', result, rejection)
    },
    contains(masterSha, candidateSha) {
      requireFetched(masterSha)
      if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(candidateSha)) return false
      // A candidate from a previous run is available only if it arrived with fetched ancestry.
      const type = run('look up the candidate object', ['cat-file', '--batch-check=%(objecttype)'], `${candidateSha}\n`).trim()
      if (type !== 'commit') return false
      const result = git(workspace, ['merge-base', '--is-ancestor', candidateSha, masterSha])
      if (result.status === 0) return true
      if (result.status === 1) return false
      throw gitFailure('check candidate ancestry', result)
    },
    close,
  }
}
