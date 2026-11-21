"""Shared review locking, atomic JSON, and recovery of interrupted clip pair promotions."""
import fcntl
import json
import os
import select
import signal
import stat
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


# Recovery only writes fixed review paths; a journal cannot choose arbitrary destinations.
_REVIEW_FILES = ('index/montages.json', 'index/cut-drafts.json', 'index/cut-checks.json', 'work/review-queue.json')


def _sync_path(path):
    fd = os.open(path, os.O_RDONLY)
    try:
        os.fsync(fd)
    finally:
        os.close(fd)


def _recover_promotion(media_root):
    journal = _promotion_journal(media_root)
    try:
        journal.lstat()
    except FileNotFoundError:
        return
    with (journal / 'state.json').open(encoding='utf-8') as f:
        state = json.load(f)
    pair = _clip_pair(journal.parent, state['clip'])
    present = state['present']  # Older journals only record the pair.
    review = state.get('review', {})
    if (not isinstance(present, list) or len(present) != len(pair)
            or not isinstance(review, dict) or not review.keys() <= set(_REVIEW_FILES)
            or any(type(had_file) is not bool for had_file in [*present, *review.values()])):
        raise ValueError('Invalid prior files in review promotion')
    paths = dict(zip(pair, present)) | {Path(media_root) / path: had_file for path, had_file in review.items()}
    with tempfile.TemporaryDirectory(dir=journal.parent, prefix='.promotion-') as scratch:
        scratch = Path(scratch)
        # Check and stage every backup first. Never consume the only backups during restoration.
        for path, had_file in paths.items():
            if had_file:
                os.link(journal / path.name, scratch / path.name)
        for path, had_file in paths.items():
            if had_file:
                os.replace(scratch / path.name, path)
            else:
                path.unlink(missing_ok=True)
        # Clear atomically before cleaning the backups, so a kill during cleanup is harmless.
        journal.rename(scratch / 'resolved')


def promote_clip(media_root, name, staged_mp4, staged_jpg, *, review_updates=None):
    """Promote a verified pair and optional private review updates under the caller's lock."""
    media_root = Path(media_root)
    journal = _promotion_journal(media_root)
    pair = _clip_pair(journal.parent, name)
    updates = {Path(path): data for path, data in (review_updates or {}).items()}
    if not updates.keys() <= {media_root / path for path in _REVIEW_FILES}:
        raise ValueError('Invalid review promotion update path')
    with tempfile.TemporaryDirectory(dir=journal.parent, prefix='.promotion-') as scratch:
        scratch = Path(scratch)
        pending = scratch / 'pending'
        pending.mkdir()
        paths = {path: path.exists() for path in (*pair, *updates)}
        for path, had_file in paths.items():
            if had_file:
                os.link(path, pending / path.name)
        state = {'clip': name, 'present': [paths[path] for path in pair]}
        if updates:
            state['review'] = {path.relative_to(media_root).as_posix(): paths[path] for path in updates}
        write_json_atomic(pending / 'state.json', state)
        if updates:
            _sync_path(pending / 'state.json')
            _sync_path(pending)
        pending.rename(journal)  # Publish the complete rollback record before changing any live file.
        try:
            if updates:
                _sync_path(journal.parent)
            for staged, path in zip((staged_mp4, staged_jpg), pair):
                os.replace(staged, path)
            for path, data in updates.items():
                write_json_atomic(path, data)
            if updates:
                for path in paths:
                    _sync_path(path)
                for parent in {path.parent for path in paths}:
                    _sync_path(parent)
            journal.rename(scratch / 'resolved')
        except BaseException:
            _recover_promotion(media_root)
            raise
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
        _recover_promotion(media_root)
        yield


def write_json_atomic(path, data):
    with tempfile.TemporaryDirectory(dir=os.path.dirname(path) or '.', prefix='.review-json-') as scratch:
        staged = os.path.join(scratch, 'data.json')
        with open(staged, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=1)
            f.write('\n')
        os.replace(staged, path)


def _legacy_publisher_active(path):
    # An empty/malformed file may be between v1's O_EXCL create and PID write. Never remove it.
    try:
        fd = os.open(path, os.O_RDONLY | os.O_NONBLOCK)
        with os.fdopen(fd, 'rb') as lock:
            if not stat.S_ISREG(os.fstat(lock.fileno()).st_mode):
                return True
            raw = lock.read(32).strip()
    except FileNotFoundError:
        return False
    except OSError:
        return True
    if not raw.isdigit() or int(raw) == 0:
        return True
    try:
        os.kill(int(raw), 0)
    except ProcessLookupError:
        return False
    except (OSError, OverflowError):
        return True
    return True


def _kill_group(pid):
    try:
        os.killpg(pid, signal.SIGKILL)
    except ProcessLookupError:
        pass


def run_store_command(timeout_ms, args):
    """Hold the inherited publisher flock (fd 3) until this entire command group stops."""
    os.fstat(3)  # Fail closed if Node did not pass the descriptor.
    owner = sys.stdin.fileno()
    if select.select([owner], [], [], 0)[0]:
        return 74  # The owner's pipe is already closed.
    command = subprocess.Popen(args, start_new_session=True, stdin=subprocess.DEVNULL)
    deadline = time.monotonic() + timeout_ms / 1000
    try:
        while True:
            if (code := command.poll()) is not None:
                return 74 if code < 0 else code
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                return 124
            if select.select([owner], [], [], min(remaining, 0.05))[0]:
                return 74  # Nothing is written to the pipe; readability means the Node owner died.
    finally:
        _kill_group(command.pid)
        command.wait()
        # The child can be reaped before its descendants exit. Keep fd 3 until the group is gone.
        while True:
            try:
                os.killpg(command.pid, 0)
            except ProcessLookupError:
                break
            time.sleep(0.01)


def run_publisher(media_root, args):
    """Serialize release and takedown commands without holding the review-data lock during I/O."""
    work = Path(media_root) / 'work'
    work.mkdir(parents=True, exist_ok=True)
    with (work / 'review-publisher.lock').open('a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            return 75  # Another publisher owns the lock; the caller can try again.
        if _legacy_publisher_active(work / 'publish.lock'):
            return 75  # Do not overlap an in-flight v1 publisher during cutover.
        fd = lock.fileno()
        # Node and each detached store supervisor share this same open file description.
        env = dict(os.environ, REVIEW_PUBLISH_LOCKED='1', REVIEW_PUBLISH_LOCK_FD=str(fd))
        command = subprocess.Popen(args, start_new_session=True, pass_fds=(fd,), env=env)
        try:
            code = command.wait()
            return 74 if code < 0 else code  # Interrupted; reconcile the durable state without claiming success.
        except KeyboardInterrupt:
            return 74
        finally:
            # Store actions are in separate groups; their supervisors observe Node's EOF and drain them.
            _kill_group(command.pid)
            command.wait()


if __name__ == '__main__':
    if sys.argv[1] == '--publish-lock':
        sys.exit(run_publisher(sys.argv[2], sys.argv[3:]))
    if sys.argv[1] == '--store-command':
        sys.exit(run_store_command(int(sys.argv[2]), sys.argv[3:]))
    with review_lock(sys.argv[1]):
        print('1', flush=True)
        sys.stdin.buffer.read(1)  # Node holds the write end open for the duration of its critical section.
