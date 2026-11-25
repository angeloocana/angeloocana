import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { staleMediaReferences } from './media-references.ts'

describe('emitted /media/ references', () => {
  it('names every reference that bypasses media.json: unversioned (pre-cfa6b21), stale, unknown', () => {
    let versions = { 't2f/desktop.webp': '0123456789', 'clips/c01d58aac.jpg': 'aBb1D-e2G3h4_IJ5' }
    let problems = staleMediaReferences(
      [
        {
          file: 'dist/index.html',
          text: [
            '<meta property="og:image" content="https://angeloocana.com/media/t2f/desktop.webp?v=0123456789">',
            '<img src="/media/clips/c01d58aac.jpg?v=aBb1D-e2G3h4_IJ5">',
            '<img src="/media/t2f/desktop.webp">',
            '<img src="//www.angeloocana.com/media/t2f/desktop.webp">',
            '<a href="https://example.org/media/presentation">',
            '<img src="/media/t2f/desktop.webp?v=0">',
            '<img src="/media/t2f/gone.webp?v=0123456789">',
            '<script type="module" src="/assets/app/ui/public/rails/media.ts.js"></script>',
          ].join(''),
        },
        { file: 'dist/data/clips.json', text: '[{"poster":"/media/clips/c01d58aac.jpg?v=aBb1D-e2G3h4_IJ5"}]' },
      ],
      versions,
    )
    assert.deepEqual(problems, [
      'dist/index.html: /media/t2f/desktop.webp (it has no ?v=)',
      'dist/index.html: //www.angeloocana.com/media/t2f/desktop.webp (it has no ?v=)',
      "dist/index.html: /media/t2f/desktop.webp?v=0 (its ?v= isn't 0123456789)",
      "dist/index.html: /media/t2f/gone.webp?v=0123456789 (t2f/gone.webp isn't in app/content/media.json)",
    ])
  })
})
