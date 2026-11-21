"""Shared review locking, atomic JSON, and recovery of interrupted clip pair promotions."""
import fcntl
import json
import os
import signal
import subprocess
import sys
import tempfile
import time
from contextlib import contextmanager
from pathlib import Path


def _promotion_journal(media_root):
    # Keep backups on the same filesystem as the canonical pair; hidden dirs are not published.
    return Path(media_root) / 'media' / 'clips' / '.review-promotion'


def _clip_pair(out, name):
    if not isinstance(name, str) or name in {'', '.', '..'} or Path(name).name != name:
        raise ValueError('Invalid clip name in review promotion')
    return out / f'{name}.mp4', out / f'{name}.jpg'


def _recover_promotion(journal):
    try:
        journal.lstat()
    except FileNotFoundError:
        return
    with (journal / 'state.json').open(encoding='utf-8') as f:
        state = json.load(f)
    pair = _clip_pair(journal.parent, state['clip'])
    present = state['present']
    if (not isinstance(present, list) or len(present) != len(pair)
            or any(type(had_file) is not bool for had_file in present)):
        raise ValueError('Invalid prior pair in review promotion')
    with tempfile.TemporaryDirectory(dir=journal.parent, prefix='.promotion-') as scratch:
        scratch = Path(scratch)
        # Check and stage both backups first. Never consume the only backups during restoration.
        for path, had_file in zip(pair, present):
            if had_file:
                os.link(journal / path.name, scratch / path.name)
        for path, had_file in zip(pair, present):
            if had_file:
                os.replace(scratch / path.name, path)
            else:
                path.unlink(missing_ok=True)
        # Clear atomically before cleaning the backups, so a kill during cleanup is harmless.
        journal.rename(scratch / 'resolved')


def promote_clip(media_root, name, staged_mp4, staged_jpg):
    """Promote a verified pair under the caller's review lock, rolling back on interruption."""
    journal = _promotion_journal(media_root)
    pair = _clip_pair(journal.parent, name)
    with tempfile.TemporaryDirectory(dir=journal.parent, prefix='.promotion-') as scratch:
        scratch = Path(scratch)
        pending = scratch / 'pending'
        pending.mkdir()
        present = [path.exists() for path in pair]
        for path, had_file in zip(pair, present):
            if had_file:
                os.link(path, pending / path.name)
        write_json_atomic(pending / 'state.json', {'clip': name, 'present': present})
        pending.rename(journal)  # Publish the complete rollback record before changing either file.
        try:
            for staged, path in zip((staged_mp4, staged_jpg), pair):
                os.replace(staged, path)
        except OSError:
            _recover_promotion(journal)
            raise
        journal.rename(scratch / 'resolved')
    return str(pair[0])


@contextmanager
def review_lock(media_root):
    work = os.path.join(media_root, 'work')
    os.makedirs(work, exist_ok=True)
    path = os.path.join(work, 'review-data.lock')
    # Never remove the lock file: other processes may already be waiting on this inode.
    with open(path, 'a') as lock:
        deadline = time.monotonic() + 30
        while True:
            try:
                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
                break
            except BlockingIOError:
                if time.monotonic() >= deadline:
                    raise TimeoutError(f'Timed out waiting for {path}') from None
                time.sleep(0.05)
        _recover_promotion(_promotion_journal(media_root))
        yield


def write_json_atomic(path, data):
    with tempfile.TemporaryDirectory(dir=os.path.dirname(path) or '.', prefix='.review-json-') as scratch:
        staged = os.path.join(scratch, 'data.json')
        with open(staged, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=1)
            f.write('\n')
        os.replace(staged, path)


def run_publisher(media_root, args):
    """Serialize release and takedown commands without holding the review-data lock during I/O."""
    work = Path(media_root) / 'work'
    work.mkdir(parents=True, exist_ok=True)
    with (work / 'review-publisher.lock').open('a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            return 75  # Another publisher owns the lock; the caller can try again.
        # Retain the fd in the child too, in case only this guardian is stopped.
        env = dict(os.environ, REVIEW_PUBLISH_LOCKED='1')
        command = subprocess.Popen(args, start_new_session=True, pass_fds=(lock.fileno(),), env=env)
        try:
            code = command.wait()
            return 74 if code < 0 else code  # Interrupted; reconcile the durable state without claiming success.
        finally:
            # If Node dies during a put, don't let its local Wrangler process keep running
            # after we release the lock and allow a takedown. An already sent call is journaled.
            try:
                os.killpg(command.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass


if __name__ == '__main__':
    if sys.argv[1] == '--publish-lock':
        sys.exit(run_publisher(sys.argv[2], sys.argv[3:]))
    with review_lock(sys.argv[1]):
        print('1', flush=True)
        sys.stdin.buffer.read(1)  # Node holds the write end open for the duration of its critical section.
