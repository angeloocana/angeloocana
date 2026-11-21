"""Synthetic render regression (python3 -B -m unittest discover -s scripts/clips)."""
import json
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
