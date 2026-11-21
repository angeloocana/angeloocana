"""Synthetic render regression (python3 -B -m unittest discover -s scripts/clips)."""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import clips


class ClipRenderTest(unittest.TestCase):
    def test_short_clip_and_failed_poster_keeps_previous_pair(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            out = root / 'media' / 'clips'
            recipe = root / 'montages.json'
            clip = 'short'
            mp4, jpg = out / 'short.mp4', out / 'short.jpg'
            with patch.multiple(clips, MEDIA=tmp, OUT=str(out), RECIPES=str(recipe)):
                clips.ffmpeg('-f', 'lavfi', '-i', 'testsrc2=size=96x160:rate=30', '-t', '1', str(root / 'source.mp4'))
                recipe.write_text(json.dumps({'clips': {clip: [['vid', 'source.mp4', 0, 0.3, 0.5]]}}))
                clips.build(clip)
                for path in (mp4, jpg):
                    self.assertGreater(path.stat().st_size, 0)
                    clips.ffmpeg('-xerror', '-i', str(path), '-f', 'null', '-')
                before = (mp4.read_bytes(), jpg.read_bytes())

                # ffmpeg has produced the replacement video, but poster generation then fails.
                with patch.object(clips, 'poster', side_effect=RuntimeError('poster failed')):
                    with self.assertRaisesRegex(RuntimeError, 'poster failed'):
                        clips.build(clip)
                self.assertEqual((mp4.read_bytes(), jpg.read_bytes()), before)
                self.assertEqual(set(out.iterdir()), {mp4, jpg})

    def test_next_lock_recovers_pair_after_interrupted_promotion_and_recovery(self):
        child = '''
import os
import sys
from pathlib import Path
from unittest.mock import patch
from review_io import promote_clip, review_lock

root, phase = Path(sys.argv[1]), sys.argv[2]
out = root / 'media' / 'clips'
mp4, jpg = out / 'clip.mp4', out / 'clip.jpg'
replace = os.replace

def exit_after_mp4(source, destination):
    replace(source, destination)
    if Path(destination) == mp4:
        os._exit(71)

if phase == 'promote':
    with review_lock(root), patch('os.replace', exit_after_mp4):
        promote_clip(root, 'clip', root / 'next.mp4', root / 'next.jpg')
elif phase == 'recover':
    with patch('os.replace', exit_after_mp4), review_lock(root):
        raise AssertionError('Interrupted recovery should not grant the lock')
else:
    with review_lock(root):
        assert mp4.read_bytes() == b'old-video'
        assert jpg.read_bytes() == b'old-poster'
'''
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            out = root / 'media' / 'clips'
            out.mkdir(parents=True)
            mp4, jpg = out / 'clip.mp4', out / 'clip.jpg'
            journal = out / '.review-promotion'
            mp4.write_bytes(b'old-video')
            jpg.write_bytes(b'old-poster')
            (root / 'next.mp4').write_bytes(b'next-video')
            (root / 'next.jpg').write_bytes(b'next-poster')

            def run(phase, status):
                result = subprocess.run([sys.executable, '-B', '-c', child, tmp, phase],
                                        cwd=Path(__file__).resolve().parent, capture_output=True, timeout=10)
                self.assertEqual(result.returncode, status, result.stderr.decode())

            run('promote', 71)
            self.assertEqual((mp4.read_bytes(), jpg.read_bytes()), (b'next-video', b'old-poster'))
            self.assertTrue(journal.is_dir())
            run('recover', 71)
            self.assertTrue(journal.is_dir())
            run('snapshot', 0)
            self.assertFalse(journal.exists())
