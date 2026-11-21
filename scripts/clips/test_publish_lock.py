"""Exercise the guarded store wrapper with a synthetic npx process tree; never use Wrangler."""
import json
import os
import shutil
import signal
import subprocess
import sys
import tempfile
import time
import unittest
from contextlib import suppress
from pathlib import Path

HELPER = Path(__file__).with_name('review_io.py').resolve()
STORE = HELPER.parent.parent / 'review-publish-media.ts'


class PublishLockTest(unittest.TestCase):
    def setUp(self):
        self.root = Path(self.enterContext(tempfile.TemporaryDirectory()))
        self.work = self.root / 'work'
        self.work.mkdir()
        self.guard = [sys.executable, '-B', str(HELPER), '--publish-lock', str(self.root)]

    def probe(self):
        return subprocess.run([*self.guard, sys.executable, '-c', 'pass'], timeout=10).returncode

    def test_new_guard_fails_closed_on_legacy_holder_or_incomplete_pid_write(self):
        legacy = self.work / 'publish.lock'
        for text in (str(os.getpid()), ''):
            legacy.write_text(text)
            self.assertEqual(self.probe(), 75)
            self.assertEqual(legacy.read_text(), text)
        exited = subprocess.Popen([sys.executable, '-c', 'pass'])
        exited.wait(timeout=10)
        legacy.write_text(str(exited.pid))
        self.assertEqual(self.probe(), 0)
        self.assertEqual(legacy.read_text(), str(exited.pid))
        killed = 'import os, signal; os.kill(os.getpid(), signal.SIGKILL)'
        self.assertEqual(subprocess.run([*self.guard, sys.executable, '-c', killed], timeout=10).returncode, 74)

    def test_timeout_and_node_death_drain_the_store_group_after_guardian_death(self):
        node = shutil.which('node')
        if not node:
            self.skipTest('Node is needed to exercise the real store wrapper')
        # The child PATH contains only the fake npx. Shorten the command budget in the Python
        # launcher without introducing a production timeout override or calling a real store.
        launcher = self.root / 'python-test'
        launcher.write_text(f'#!{sys.executable}\n' + '''import os, sys
helper, mode, _, command, *args = sys.argv[1:]
assert mode == '--store-command' and command == 'npx'
os.execv(sys.executable, [sys.executable, helper, mode, os.environ['TEST_BUDGET'], command, *args])
''')
        launcher.chmod(0o755)
        npx = self.root / 'npx'
        npx.write_text(f'#!{sys.executable}\n' + '''import json, os, subprocess, sys, time
from pathlib import Path
assert sys.argv[1:6] == ['-y', 'wrangler@4.151.1', 'r2', 'object', 'delete']
child = subprocess.Popen([sys.executable, '-c', 'import time; time.sleep(60)'])
Path('tree.next').write_text(json.dumps([os.getppid(), os.getpid(), child.pid]))
Path('tree.next').rename('tree')
time.sleep(60)
''')
        npx.chmod(0o755)
        script = f'''
import {{ writeFileSync }} from 'node:fs'
import {{ makeR2ObjectStore }} from {json.dumps(STORE.as_uri())}
writeFileSync('node-pid', String(process.pid))
try {{
  await makeR2ObjectStore().remove('clips/h-test.mp4')
  writeFileSync('result', 'unexpected success')
}} catch (error) {{
  writeFileSync('result', error.message)
}}
'''

        def wait_for(predicate):
            deadline = time.monotonic() + 10
            while not predicate():
                if time.monotonic() >= deadline:
                    self.fail('Timed out waiting for the synthetic store process tree')
                time.sleep(0.02)

        def exited(pid):
            try:
                os.kill(pid, 0)
            except ProcessLookupError:
                return True
            return False

        tree, pid_file, result = (self.root / name for name in ('tree', 'node-pid', 'result'))
        for interrupted in (False, True):
            with self.subTest(interrupted=interrupted):
                tree.unlink(missing_ok=True)
                pid_file.unlink(missing_ok=True)
                result.unlink(missing_ok=True)
                env = dict(os.environ, PATH=str(self.root), PYTHON=str(launcher),
                           TEST_BUDGET='60000' if interrupted else '2000')
                guardian = subprocess.Popen([*self.guard, node, '--input-type=module', '-e', script], cwd=self.root, env=env)
                supervisor = group = owner = None
                stopped = False
                try:
                    wait_for(tree.exists)
                    supervisor, group, grandchild = json.loads(tree.read_text())
                    owner = int(pid_file.read_text())
                    self.assertEqual(os.getpgid(grandchild), group)
                    guardian.kill()
                    guardian.wait(timeout=10)
                    if interrupted:
                        # Freeze the sole surviving supervisor before Node dies, then prove its
                        # inherited FD still prevents a second publisher from entering.
                        os.kill(supervisor, signal.SIGSTOP)
                        stopped = True
                        os.kill(owner, signal.SIGKILL)
                        wait_for(lambda: exited(owner))
                        owner = None
                    self.assertEqual(self.probe(), 75)
                    os.kill(grandchild, 0)
                    if interrupted:
                        os.kill(supervisor, signal.SIGCONT)
                        stopped = False
                    else:
                        wait_for(result.exists)
                        self.assertEqual(result.read_text(), 'Wrangler media command timed out')
                    wait_for(lambda: self.probe() == 0)
                    with self.assertRaises(ProcessLookupError):
                        os.killpg(group, 0)
                    self.assertEqual(result.exists(), not interrupted)
                finally:
                    if stopped:
                        with suppress(ProcessLookupError):
                            os.kill(supervisor, signal.SIGCONT)
                    if guardian.poll() is None:
                        guardian.kill()
                        guardian.wait(timeout=10)
                    if owner:
                        with suppress(ProcessLookupError):
                            os.kill(owner, signal.SIGKILL)
                    if group:
                        with suppress(ProcessLookupError):
                            os.killpg(group, signal.SIGKILL)
