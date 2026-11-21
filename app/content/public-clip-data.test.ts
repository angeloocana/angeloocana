import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { loadClips } from './clips.ts'
import { assertPublicClipData } from './public-clip-data.ts'

const clip = {
  id: 'c12345678', cat: 'snow', source: 'instagram', rejected: true, score: 2, star: 0,
  label: { en: 'Out in the snow', pt: 'Na neve' }, ig: '/reel/Example_1/',
}

describe('public clip data', () => {
  it('accepts the published catalogue and ordinary captions', () => {
    assertPublicClipData(loadClips())
    assertPublicClipData([clip])
  })

  it('rejects a private caption or review field even on a rejected clip, without echoing it', () => {
    assert.throws(() => assertPublicClipData([{ ...clip, label: { ...clip.label, pt: 'Olá @example' } }]), /^Error: Clip 1: PT caption looks like it contains contact information, a link, or a location\./)
    assert.throws(() => assertPublicClipData([{ ...clip, note: 'Private note' }]), /^Error: Clip 1: only public clip fields are allowed\.$/)
  })
})
