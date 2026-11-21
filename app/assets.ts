import { createAssetServer } from 'remix/assets'
import { componentHmr } from 'remix/component-hmr/assets'

const rootDir = process.cwd()
const nodeEnv = process.env.NODE_ENV ?? 'development'
const isDevelopment = nodeEnv === 'development'
const isHmr = Boolean(isDevelopment && process.env.REMIX_NODE_HMR)

export const assets = createAssetServer({
  basePath: '/assets',
  rootDir,

  allowFiles: ['app/routes.ts', 'app/**/public/**'],
  allowPackages: ['remix'],
  denyFiles: ['app/**/*.test.*'],
  sourceMaps: isDevelopment ? 'external' : undefined,
  minify: !isDevelopment,
  // A hash of each file goes in its URL (rails.@a1b2c3.tsx), so a new build gets new URLs. The built
  // site caches /assets/ for a year without asking again (scripts/build.ts), and with stable URLs
  // phones that had visited kept running the old scripts against new pages.
  fingerprint: !isDevelopment,
  watch: isDevelopment,
  hmr: isHmr
    ? {
        channel: async () => (await import('remix/node-hmr/runtime')).createBrowserHmrChannel(),
        moduleImporter: 'remix/multiple-import-maps-polyfill',
      }
    : undefined,
  scripts: { loaders: isHmr ? [componentHmr()] : undefined },
})

const entry = nodeEnv === 'production' ? 'app/actions/public/entry-static.ts' : 'app/actions/public/entry.ts'

export const scriptEntry = await assets.getScriptEntry(entry)

// Posts use the pointer ring and, on video tutorials only, a click-to-load player.
export const cursorEntry = await assets.getScriptEntry('app/ui/public/cursor.ts')
export const postVideoEntry = await assets.getScriptEntry('app/ui/public/post-video.ts')
