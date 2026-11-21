"""Shared review locking and atomic JSON writes. Keep the lock file on disk: the lock is on its inode."""
import fcntl
import json
import os
import sys
import tempfile
import time
from contextlib import contextmanager


@contextmanager
def review_lock(media_root):
    work = os.path.join(media_root, 'work')
    os.makedirs(work, exist_ok=True)
    path = os.path.join(work, 'review-data.lock')
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
        yield


def write_json_atomic(path, data):
    with tempfile.TemporaryDirectory(dir=os.path.dirname(path) or '.', prefix='.review-json-') as scratch:
        staged = os.path.join(scratch, 'data.json')
        with open(staged, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=1)
            f.write('\n')
        os.replace(staged, path)


if __name__ == '__main__':
    with review_lock(sys.argv[1]):
        print('1', flush=True)
        sys.stdin.buffer.read(1)  # Node holds the write end open for the duration of its critical section.
