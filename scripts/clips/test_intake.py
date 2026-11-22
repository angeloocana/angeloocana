"""Private MOV intake regression; every file outside the checkout is in a temporary media root."""
import json
import os
import subprocess
import sys
import tempfile
import unittest
import uuid
from pathlib import Path

import clips


class IntakeTest(unittest.TestCase):
    def test_render_stays_private_until_verified_approval(self):
        root = Path(self.enterContext(tempfile.TemporaryDirectory()))
        name = 'c0c30f79e'
        relative = 'sources/uploads/synthetic-private.mov'
        original = root / relative
        original.parent.mkdir(parents=True)
        clips.ffmpeg('-f', 'lavfi', '-i', 'testsrc2=size=96x160:rate=30', '-t', '1', str(original))
        before_original = original.read_bytes()
        tracked = Path(clips.CLIPS_JSON)
        before_tracked = tracked.read_bytes()

        index = root / 'index'
        index.mkdir()
        catalogue = index / 'items.json'
        drafts = index / 'cut-drafts.json'
        recipes = index / 'montages.json'
        checks = index / 'cut-checks.json'
        queue = root / 'work' / 'review-queue.json'
        directory = root / 'work' / 'intake' / name
        receipt_file = directory / 'preview.json'
        media = root / 'media'
        item = {'id': 'v999', 'path': relative, 'privateFor': name}
        other = {'id': 'v998', 'path': 'sources/huawei/other.mp4'}
        raw = [['vid', relative, 0, 0.3, 0.5]]
        catalogue.write_text(json.dumps([other, item]))
        drafts.write_text(json.dumps({name: raw}))
        expected = {'draft': raw, 'recipe': None}
        public = {'id': name, 'cat': 'other', 'label': {'en': 'Synthetic clip', 'pt': 'Vídeo sintético'},
                  'star': 0, 'rejected': False, 'score': 3, 'source': 'phone'}

        def run(*args, data=None, status=0, active=True, python=None, error=None):
            cli = [clips.__file__, *args] if python is None else ['-c', python, *args]
            result = subprocess.run([sys.executable, '-B', *cli], input=json.dumps(data), text=True,
                                    capture_output=True, timeout=20, cwd=Path(clips.__file__).parent,
                                    env={'PATH': os.environ['PATH'], 'ANGELOOCANA_MEDIA': str(root),
                                         'REVIEW_AUTOPUBLISH': '1' if active else '0'})
            self.assertEqual(result.returncode, status, result.stderr)
            self.assertNotIn(relative, result.stdout + result.stderr)
            if error is not None:
                self.assertEqual(result.stderr.strip(), error)

        def assert_pending(draft=raw):
            self.assertEqual(json.loads(catalogue.read_bytes()), [other, item])
            self.assertEqual(json.loads(drafts.read_bytes()), {name: draft})
            for absent in (recipes, checks, queue, media):
                self.assertFalse(absent.exists(), absent)
            self.assertEqual(tracked.read_bytes(), before_tracked)
            self.assertEqual(original.read_bytes(), before_original)

        run('rebuild')  # A pending draft cannot accidentally be included in a normal batch rebuild.
        run('rebuild-expected', name, data=expected, status=3)
        assert_pending()
        run('preview-intake', name, data=expected)
        receipt = json.loads(receipt_file.read_bytes())
        self.assertEqual(receipt['draft'], raw)
        uuid.UUID(receipt['revision'])
        pair = [directory / receipt['revision'] / f'clip.{ext}' for ext in ('mp4', 'jpg')]
        for path in pair:
            clips.ffmpeg('-xerror', '-i', str(path), '-f', 'null', '-')
        rendered = [path.read_bytes() for path in pair]
        assert_pending()

        approval = {'revision': receipt['revision'], 'clip': public}
        run('approve-intake', name, data=approval, active=False, status=1)
        run('approve-intake', name, data={**approval, 'clip': {**public, 'original': relative}}, status=1,
            error='Intake approval could not be completed')
        assert_pending()
        self.assertEqual(json.loads(receipt_file.read_bytes()), receipt)
        run('approve-intake', name, data={**approval, 'revision': str(uuid.uuid4())}, status=3)
        changed = [['vid', relative, 0.2, 0.3, 0.5]]
        drafts.write_text(json.dumps({name: changed}))
        run('approve-intake', name, data=approval, status=3)
        run('preview-intake', name, data=expected, status=3)
        assert_pending(changed)
        self.assertEqual(json.loads(receipt_file.read_bytes()), receipt)
        drafts.write_text(json.dumps({name: raw}))

        run(name, data=expected, status=3, python='''
import sys
from contextlib import contextmanager
from unittest.mock import patch
import clips

render = clips.render_clip

@contextmanager
def interleave(*args, **kwargs):
    with render(*args, **kwargs) as staged:
        with clips.review_lock(clips.MEDIA):
            items = clips.read_json(clips.items_path(), [])
            items[-1]['id'] = 'v1000'
            clips.write_json_atomic(clips.items_path(), items)
        yield staged

with patch.object(clips, 'render_clip', interleave):
    try:
        clips.preview_intake(sys.argv[1])
    except clips.StaleCut:
        sys.exit(3)
''')
        self.assertEqual(json.loads(receipt_file.read_bytes()), receipt)
        self.assertEqual(set(directory.iterdir()), {receipt_file, pair[0].parent})
        run('approve-intake', name, data=approval, status=3)
        catalogue.write_text(json.dumps([other, item]))
        assert_pending()

        pair[1].write_bytes(b'nonempty but not the verified poster')
        run('approve-intake', name, data=approval, status=3)
        assert_pending()
        pair[1].write_bytes(rendered[1])

        # Fault after replacing the media, recipe, draft, check, catalogue and queue. The journal must restore
        # all previous files, including the existing catalogue and its marker, without consuming the preview.
        run(name, data=approval, status=1, error='Intake approval could not be completed', python='''
import sys
from pathlib import Path
from unittest.mock import patch
import clips
import review_io

sync = review_io._sync_path

def fail_queue_sync(path):
    if path == Path(clips.REVIEW_QUEUE):
        assert 'privateFor' not in clips.items()['v999']
        assert (Path(clips.WORK) / '.review-promotion' / 'items.json').is_file()
        raise OSError('synthetic sync failure')
    sync(path)

with patch.object(review_io, '_sync_path', fail_queue_sync):
    clips.approve_intake(sys.argv[1])
''')
        media_clips = media / 'clips'
        self.assertEqual(list(media_clips.iterdir()), [])
        media_clips.rmdir()
        media.rmdir()
        assert_pending()
        self.assertEqual(json.loads(receipt_file.read_bytes()), receipt)
        self.assertEqual([path.read_bytes() for path in pair], rendered)

        run('approve-intake', name, data=approval)
        self.assertEqual(json.loads(catalogue.read_bytes()), [other, {'id': 'v999', 'path': relative}])
        self.assertEqual(json.loads(drafts.read_bytes()), {})
        self.assertEqual(json.loads(recipes.read_bytes()), {'clips': {name: raw}})
        self.assertEqual(json.loads(checks.read_bytes())[name]['state'], 'edited')
        queued = json.loads(queue.read_bytes())
        self.assertEqual(queued['clips'], [*json.loads(before_tracked), public])
        self.assertNotIn(relative, queue.read_text())
        self.assertEqual([(media_clips / f'{name}.{ext}').read_bytes() for ext in ('mp4', 'jpg')], rendered)
        self.assertEqual(tracked.read_bytes(), before_tracked)
        self.assertEqual(original.read_bytes(), before_original)
        run('approve-intake', name, data=approval, status=3)
        self.assertEqual(json.loads(queue.read_bytes()), queued)
