"""Synthetic render regression (python3 -B -m unittest discover -s scripts/clips)."""
import io
import json
import subprocess
import sys
import tempfile
import unittest
from contextlib import contextmanager
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


class CutRebuildTest(unittest.TestCase):
    def setUp(self):
        tmp = self.enterContext(tempfile.TemporaryDirectory())
        root = Path(tmp)
        self.out = root / 'media' / 'clips'
        self.recipe = root / 'montages.json'
        self.drafts = root / 'cut-drafts.json'
        self.checks = root / 'cut-checks.json'
        self.enterContext(patch.multiple(clips, MEDIA=tmp, OUT=str(self.out), RECIPES=str(self.recipe),
                                         DRAFTS=str(self.drafts), CHECKS=str(self.checks)))
        clips.ffmpeg('-f', 'lavfi', '-i', 'testsrc2=size=96x160:rate=30', '-t', '1', str(root / 'source.mp4'))
        self.base = [['vid', 'source.mp4', 0, 0.3, 0.5]]
        self.draft = [['vid', 'source.mp4', 0.2, 0.3, 0.5]]
        self.new = [['vid', 'source.mp4', 0.4, 0.3, 0.5]]
        clips.save_recipe('clip', self.base)
        clips.write_json_atomic(self.drafts, {'clip': self.draft})
        clips.write_json_atomic(self.checks, {'clip': {'state': 'kept', 'at': '2026-01-01T00:00:00Z'}})
        clips.build('clip')

    def snapshot(self):
        files = [self.out / 'clip.mp4', self.out / 'clip.jpg', self.recipe, self.drafts, self.checks]
        return tuple(path.read_bytes() for path in files)

    def test_web_rebuild_refuses_inputs_replaced_before_read(self):
        expected = json.dumps({'draft': self.draft, 'recipe': self.base})
        for changed in ('draft', 'recipe'):
            with self.subTest(changed=changed):
                with clips.review_lock(clips.MEDIA):
                    clips.save_recipe('clip', self.new if changed == 'recipe' else self.base)
                    clips.write_json_atomic(self.drafts, {'clip': self.new if changed == 'draft' else self.draft})
                before = self.snapshot()
                with patch('sys.stdin', io.StringIO(expected)), patch.object(clips, 'render_clip') as render:
                    with self.assertRaisesRegex(clips.StaleCut, 'cut changed;.*rebuild again'):
                        clips.rebuild_expected('clip')
                    render.assert_not_called()
                self.assertEqual(self.snapshot(), before)

    def test_slow_cli_rebuild_cannot_overwrite_newer_edit(self):
        render = clips.render_clip
        before_first = self.snapshot()
        newer = None

        @contextmanager
        def interleave(pieces):
            nonlocal newer
            self.assertEqual(pieces, self.draft)
            with render(pieces) as staged:
                # A later rebuild finishes while the first job is still rendering (outside the flock).
                with clips.review_lock(clips.MEDIA):
                    clips.write_json_atomic(self.drafts, {'clip': self.new})
                with patch.object(clips, 'render_clip', render):
                    clips.rebuild('clip')
                newer = self.snapshot()
                yield staged

        with patch.object(clips, 'render_clip', interleave):
            with self.assertRaisesRegex(clips.StaleCut, 'cut changed;.*rebuild again'):
                clips.rebuild()
        self.assertEqual(self.snapshot(), newer)
        self.assertNotEqual(newer[:2], before_first[:2])
        self.assertEqual(clips.recipes()['clip'], self.new)
        self.assertEqual(clips.read_json(self.drafts, {}), {})
        self.assertEqual(clips.read_json(self.checks, {})['clip']['state'], 'edited')
        self.assertEqual({p.name for p in self.out.iterdir()}, {'clip.mp4', 'clip.jpg'})

    def test_web_rebuild_preserves_draft_when_only_recipe_changes_during_render(self):
        render = clips.render_clip
        expected = json.dumps({'draft': self.draft, 'recipe': self.base})
        changed = None

        @contextmanager
        def interleave(pieces):
            nonlocal changed
            with render(pieces) as staged:
                with clips.review_lock(clips.MEDIA):
                    clips.save_recipe('clip', self.new)
                with patch.object(clips, 'render_clip', render):
                    clips.build('clip')  # Rebuild from the new recipe, leaving the existing draft alone.
                changed = self.snapshot()
                yield staged

        with patch('sys.stdin', io.StringIO(expected)), patch.object(clips, 'render_clip', interleave):
            with self.assertRaisesRegex(clips.StaleCut, 'cut changed;.*rebuild again'):
                clips.rebuild_expected('clip')
        self.assertEqual(self.snapshot(), changed)
        self.assertEqual(clips.read_json(self.drafts, {}), {'clip': self.draft})
