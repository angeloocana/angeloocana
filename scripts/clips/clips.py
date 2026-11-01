"""Tools for the home page's video row. Needs python3 and ffmpeg, plus numpy and Pillow for `moments` and
`recipes`. See scripts/clips/README.md.

    python3 scripts/clips/clips.py sheet v226               contact sheet of a source video, to pick a moment
    python3 scripts/clips/clips.py sheet v226 0 24 1        ...from second 0, 24 seconds long, one frame a second
    python3 scripts/clips/clips.py cut v226 9.8 ice "Butterfly in the ice pool" "Borboleta na piscina de gelo"
    python3 scripts/clips/clips.py build h-wood             rebuild a clip from its recipe (index/montages.json)
    python3 scripts/clips/clips.py rebuild                  rebuild every clip whose cut was changed on /review/cut
    python3 scripts/clips/clips.py rebuild ca94616f1        ...just this one
    python3 scripts/clips/clips.py moments v226             split a source video into short moments, for /review/cut
    python3 scripts/clips/clips.py moments all              ...every source video (skips the ones already done)
    python3 scripts/clips/clips.py recipes                  find the recipe of clips cut before recipes were kept
    python3 scripts/clips/clips.py links                    match Instagram post links (needs index/ig-posts.json)

Everything reads and writes the shared media folder (~/dev/angeloocana-media or $ANGELOOCANA_MEDIA), never
the repo, except app/content/clips.json. Output has no audio and no metadata (no GPS, no camera info).
"""
import hashlib
import io
import json
import math
import os
import subprocess
import sys
import time

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MEDIA = os.environ.get('ANGELOOCANA_MEDIA') or os.path.expanduser('~/dev/angeloocana-media')
CLIPS_JSON = os.path.join(REPO, 'app', 'content', 'clips.json')
OUT = os.path.join(MEDIA, 'media', 'clips')
WORK = os.path.join(MEDIA, 'work')
# How every clip is made: {"clips": {clip id: [piece, …]}}. The name is from when only montages had one.
RECIPES = os.path.join(MEDIA, 'index', 'montages.json')
# Cuts changed on /review/cut that have not been rebuilt yet: {clip id: [piece, …]}.
DRAFTS = os.path.join(MEDIA, 'index', 'cut-drafts.json')
# Clips whose cut was checked on /review/cut: {clip id: {"state": "edited" | "kept", "at": time}}.
# A rebuild from a draft marks the clip edited; "Keep this cut" marks it kept.
CHECKS = os.path.join(MEDIA, 'index', 'cut-checks.json')
# Each source video split into short moments (v226.json) and a sheet of their thumbnails (v226.jpg).
# Kept in work/, not media/, so they are never deployed.
MOMENTS = os.path.join(WORK, 'moments')
MOMENTS_VERSION = 1
FPS = 30
SCALE = 'scale=720:1280:force_original_aspect_ratio=increase:flags=lanczos'


def read_json(path, default):
    return json.load(open(path)) if os.path.exists(path) else default


def write_json(path, data):
    """Write to a temporary file first, so the dev server never reads half a file."""
    tmp = path + '.tmp'
    with open(tmp, 'w') as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
        f.write('\n')
    os.replace(tmp, path)


def config():
    return read_json(os.path.join(MEDIA, 'index', 'config.json'), {})


def source(path):
    """Index paths are 'ig:reels/…' (inside the Instagram export) or relative to the media folder."""
    if path.startswith('ig:'):
        export = os.path.expanduser(config().get('instagram_export', ''))
        return os.path.join(export, 'media', path[3:])
    return path if os.path.isabs(path) else os.path.join(MEDIA, path)


def items():
    return {it['id']: it for it in json.load(open(os.path.join(MEDIA, 'index', 'items.json')))}


def clip_id(item):
    return 'c' + hashlib.sha1(item['src'].encode()).hexdigest()[:8]


def ffmpeg(*args):
    subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', *args], check=True)


def poster(mp4, jpg):
    ffmpeg('-i', mp4, '-map_metadata', '-1', '-vf', 'select=eq(n\\,12),scale=540:-2', '-frames:v', '1', '-q:v', '4', jpg)


def load_clips():
    return json.load(open(CLIPS_JSON))


def save_clips(clips):
    with open(CLIPS_JSON, 'w') as f:
        json.dump(clips, f, ensure_ascii=False, indent=1)
        f.write('\n')


def recipes():
    return read_json(RECIPES, {'clips': {}})['clips']


def save_recipe(name, pieces):
    data = read_json(RECIPES, {'clips': {}})
    data['clips'][name] = pieces
    write_json(RECIPES, data)


def sheet(item_id, start='0', length=None, step=None):
    """A strip of frames, 10 per row, saved in the media folder's work/ (not in the repo)."""
    it = items()[item_id]
    length = float(length or it['dur'])
    step = float(step or max(1, length / 30))
    os.makedirs(WORK, exist_ok=True)
    out = os.path.join(WORK, f'{item_id}_{start}.jpg')
    ffmpeg('-ss', str(start), '-t', str(length), '-i', source(it['path']),
           '-vf', f'fps=1/{step},scale=-2:220,tile=10x{max(1, int(length / step / 10) + 1)}:padding=3', '-frames:v', '1', out)
    print(out)


def cut(item_id, start, cat=None, en=None, pt=None, length='6'):
    """A 6-second 9:16 loop starting at `start` seconds. Adds the clip to clips.json if it is new."""
    it = items()[item_id]
    cid = clip_id(it)
    clips = load_clips()
    if not any(c['id'] == cid for c in clips) and not (cat and en and pt):
        sys.exit(f'{cid} is new: pass a category and EN and PT captions')
    pieces = [['vid', it['path'], float(start), float(length), 0.5]]
    mp4 = build(cid, pieces)
    save_recipe(cid, pieces)
    if not any(c['id'] == cid for c in clips):
        source_kind = 'instagram' if it['source'].startswith('Instagram') else 'phone'
        clip = {'id': cid, 'cat': cat, 'label': {'en': en, 'pt': pt}, 'star': 0, 'rejected': False, 'score': 3, 'source': source_kind}
        if source_kind == 'instagram':
            clip['igKind'] = it['source'].split('·')[-1].strip()
        clips.append(clip)
        save_clips(clips)
    print(mp4)


def full(p):
    """A piece with every field filled in.
    ["vid", path, start, seconds, cx, zoom, cy]: cx/cy place the 9:16 crop (0 = left/top, 1 = right/bottom),
    zoom > 1 crops closer. ["img", path, seconds, cx, zoom_in]: a photo with a slow zoom in (1) or out (0)."""
    if p[0] == 'img':
        return ['img', p[1], float(p[2]), float(p[3]), 1 if p[4] else 0]
    rest = list(p[5:])
    return ['vid', p[1], float(p[2]), float(p[3]), float(p[4]), float(rest[0]) if rest else 1.0, float(rest[1]) if len(rest) > 1 else 0.5]


def joined(pieces):
    """Back-to-back pieces of the same video with the same framing play as one, without a seam."""
    out = []
    for p in map(full, pieces):
        q = out[-1] if out else None
        if q and p[0] == q[0] == 'vid' and p[1] == q[1] and p[4:] == q[4:] and abs(q[2] + q[3] - p[2]) < 0.05:
            q[3] = round(p[2] + p[3] - q[2], 3)
        else:
            out.append(p)
    return out


def build(name, pieces=None):
    """Render a clip from its pieces (default: its recipe) in one pass: each piece is cropped to 9:16,
    then they play one after another. Writes media/clips/<name>.mp4 and its poster."""
    pieces = joined(pieces if pieces is not None else recipes()[name])
    inputs, chains = [], []
    for i, p in enumerate(pieces):
        if p[0] == 'img':
            _, path, secs, cx, zoom_in = p
            n = max(1, round(secs * FPS))
            z = f'1+0.07*on/{n}' if zoom_in else f'1.07-0.07*on/{n}'
            inputs += ['-i', source(path)]
            chains.append(f'[{i}:v]scale=1440:2560:force_original_aspect_ratio=increase,crop=1440:2560:(iw-1440)*{cx}:(ih-2560)/2,setsar=1,'
                          f"zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s=720x1280:fps={FPS},setpts=PTS-STARTPTS,format=yuv420p[p{i}]")
        else:
            _, path, start, secs, cx, zoom, cy = p
            pre = f'crop=iw/{zoom}:ih/{zoom}:(iw-iw/{zoom})*{cx}:(ih-ih/{zoom})*{cy},' if zoom != 1 else ''
            inputs += ['-ss', f'{start:.3f}', '-t', f'{secs:.3f}', '-i', source(path)]
            chains.append(f'[{i}:v]setpts=PTS-STARTPTS,{pre}{SCALE},crop=720:1280:(iw-720)*{cx}:(ih-1280)/2,setsar=1,fps={FPS},format=yuv420p[p{i}]')
    graph = ';'.join(chains) + ';' + ''.join(f'[p{i}]' for i in range(len(pieces))) + f'concat=n={len(pieces)}:v=1:a=0[out]'
    os.makedirs(OUT, exist_ok=True)
    mp4, tmp = os.path.join(OUT, f'{name}.mp4'), os.path.join(OUT, f'{name}.part.mp4')
    # longer clips get a little more compression so the page stays light
    crf = '31' if sum(p[3] if p[0] == 'vid' else p[2] for p in pieces) > 15 else '28'
    ffmpeg(*inputs, '-filter_complex', graph, '-map', '[out]', '-an', '-map_metadata', '-1', '-map_chapters', '-1',
           '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-profile:v', 'high', '-movflags', '+faststart', tmp)
    os.replace(tmp, mp4)
    poster(mp4, os.path.join(OUT, f'{name}.jpg'))
    return mp4


def montage(name):
    """The old name for `build`."""
    print(build(name))


def rebuild(*names):
    """Apply the cuts saved on /review/cut: render each one, then make it the clip's recipe."""
    drafts = read_json(DRAFTS, {})
    todo = names or list(drafts)
    if not todo:
        print('No changed cuts to rebuild')
    for name in todo:
        pieces = drafts.get(name)
        print(build(name, pieces), flush=True)
        if pieces is not None:
            save_recipe(name, pieces)
            drafts = read_json(DRAFTS, {})
            drafts.pop(name, None)
            write_json(DRAFTS, drafts)
            checks = read_json(CHECKS, {})
            checks[name] = {'state': 'edited', 'at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}
            write_json(CHECKS, checks)


# ---- moments: every source video split into short pieces to choose from on /review/cut ----

THUMB_H = 160
SHEET_COLS = 10


def find_moments(it):
    """Split a video into moments of about 2.5 seconds, cutting at the camera's cuts, with a thumbnail and
    a motion and sharpness score each. Saves work/moments/<id>.json and <id>.jpg."""
    import numpy as np
    from PIL import Image

    src = source(it['path'])
    first = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', src, '-frames:v', '1', '-vf', f'scale=-2:{THUMB_H}',
                            '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True, check=True).stdout
    tw, th = Image.open(io.BytesIO(first)).size
    dur = float(it['dur'])
    rate = min(6.0, 1800 / dur)  # frames looked at per second; long videos get fewer
    raw = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', src, '-an', '-vf', f'fps={rate:.4f},scale={tw}:{th}',
                          '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
    frames = np.frombuffer(raw, np.uint8).reshape(-1, th, tw, 3)
    n = len(frames)
    if not n:
        raise RuntimeError(f'{it["id"]}: no frames')

    # how much changes from one frame to the next: in the pixels (motion) and in the colours (cuts)
    small = frames[:, ::4, ::4].mean(axis=3)
    diff = np.zeros(n)
    diff[1:] = np.abs(small[1:] - small[:-1]).mean(axis=(1, 2)) / 255
    quant = frames[:, ::2, ::2] >> 5
    hist = np.stack([np.concatenate([np.bincount(f[..., c].ravel(), minlength=8) for c in range(3)]) for f in quant]).astype(float)
    hist /= hist[:, :8].sum(axis=1, keepdims=True)
    hdiff = np.zeros(n)
    hdiff[1:] = np.abs(hist[1:] - hist[:-1]).sum(axis=1) / 6
    # a cut is a jump much bigger than the frames around it (a pan changes every frame, a cut just one),
    # or a big change of colours
    around = np.array([np.median(np.concatenate([diff[max(1, i - 4):i], diff[i + 1:i + 5]])) if n > 2 else 0 for i in range(n)])
    cut = ((diff > 0.07) & (diff > 3 * np.maximum(around, 0.01))) | (hdiff > 0.3)
    cut[0] = True

    # shots between cuts; a flash shorter than 0.8 s joins the shot before it
    starts = [0.0] + [round((i - 0.5) / rate, 2) for i in range(1, n) if cut[i]]
    shots = []
    for a, b in zip(starts, starts[1:] + [dur]):
        if shots and b - a < 0.8:
            shots[-1][1] = b
        else:
            shots.append([a, b])
    target = 2.5 if dur <= 180 else 4

    gray = lambda f: f.mean(axis=2)
    sharpness = lambda g: float((4 * g[1:-1, 1:-1] - g[:-2, 1:-1] - g[2:, 1:-1] - g[1:-1, :-2] - g[1:-1, 2:]).var())
    moments, thumbs = [], []
    for a, b in shots:
        k = max(1, round((b - a) / target))
        for j in range(k):
            s, e = a + (b - a) * j / k, a + (b - a) * (j + 1) / k
            idx = list(range(min(n - 1, math.ceil(s * rate)), min(n, max(math.ceil(e * rate), math.ceil(s * rate) + 1))))
            inner = [i for i in idx if not cut[i]]
            # the thumbnail is the sharpest frame from the middle half of the moment
            mid = idx[len(idx) // 4: max(len(idx) // 4 + 1, 3 * len(idx) // 4)]
            sharp = {i: sharpness(gray(frames[i].astype(float))) for i in mid}
            best = max(sharp, key=sharp.get)
            moments.append({'s': round(s, 2), 'e': round(e, 2), 'shot': j == 0,
                            'motion': round(float(diff[inner].mean()) if inner else 0.0, 4), 'sharp': round(sharp[best], 1)})
            thumbs.append(frames[best])

    rows = math.ceil(len(thumbs) / SHEET_COLS)
    cols = min(SHEET_COLS, len(thumbs))
    sheet_img = Image.new('RGB', (cols * tw, rows * th))
    for i, f in enumerate(thumbs):
        sheet_img.paste(Image.fromarray(f), ((i % SHEET_COLS) * tw, (i // SHEET_COLS) * th))
    os.makedirs(MOMENTS, exist_ok=True)
    jpg = os.path.join(MOMENTS, f'{it["id"]}.jpg')
    sheet_img.save(jpg + '.tmp', 'JPEG', quality=72)
    os.replace(jpg + '.tmp', jpg)
    data = {'version': MOMENTS_VERSION, 'id': it['id'], 'dur': round(dur, 2), 'w': tw, 'h': th, 'cols': cols, 'moments': moments}
    write_json(os.path.join(MOMENTS, f'{it["id"]}.json'), data)
    return data


def moments(which, force=None):
    all_items = items()
    if which != 'all':
        data = find_moments(all_items[which])
        print(f'{which}: {len(data["moments"])} moments')
        return
    todo = [vid for vid in sorted(all_items)
            if force or read_json(os.path.join(MOMENTS, f'{vid}.json'), {}).get('version') != MOMENTS_VERSION]
    for n, vid in enumerate(todo):
        try:
            data = find_moments(all_items[vid])
            print(f'{n + 1}/{len(todo)} {vid}: {len(data["moments"])} moments', flush=True)
        except Exception as error:  # one unreadable video should not stop the rest
            print(f'{n + 1}/{len(todo)} {vid}: failed ({error})', flush=True)


# ---- recipes: clips cut before recipes were kept get one by finding where they start in the source ----

def gray_frames(np, path, start=None, length=None):
    """Frames at 30 fps, cropped to 9:16 like a clip, shrunk to 36×64 grey."""
    pre = (['-ss', f'{start:.3f}'] if start else []) + (['-t', f'{length:.3f}'] if length else [])
    raw = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', *pre, '-i', path, '-an', '-vf',
                          f'{SCALE},crop=720:1280,fps={FPS},scale=36:64:flags=area,format=gray', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, 64, 36).astype(np.float32)


def match_start(np, clip, src, hint=None):
    """The second in `src` where `clip` starts, and how far off the best match is (0 = identical)."""
    steps = [0, 10, 20, 30]
    probe = gray_frames(np, clip, length=1.2)[steps]

    def best(frames, origin):
        count = len(frames) - steps[-1]
        if count <= 0:
            return None, float('inf')
        errors = np.mean([np.abs(frames[d:d + count] - probe[k]).mean(axis=(1, 2)) for k, d in enumerate(steps)], axis=0)
        o = int(errors.argmin())
        return round(origin + o / FPS, 3), float(errors[o])

    if hint is not None:
        a = max(0.0, float(hint) - 3)
        found = best(gray_frames(np, src, a, 7.5), a)
        if found[1] < 4:
            return found
    return best(gray_frames(np, src), 0.0)


def find_recipes():
    import numpy as np

    by_clip = {clip_id(it): it for it in items().values()}
    hints = {r['id']: r.get('start') for r in read_json(os.path.join(MEDIA, 'index', 'reviews.json'), [])}
    have = recipes()
    for c in load_clips():
        it = by_clip.get(c['id'])
        if c['id'] in have or not it:
            continue
        mp4 = os.path.join(OUT, f"{c['id']}.mp4")
        length = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4],
                                      capture_output=True, text=True, check=True).stdout)
        start, error = match_start(np, mp4, source(it['path']), hints.get(it['id']))
        if start is None or error > 12:
            print(f"{c['id']} ({it['id']}): no match (off by {error:.1f}), skipped", flush=True)
            continue
        save_recipe(c['id'], [['vid', it['path'], start, round(length, 2), 0.5]])
        print(f"{c['id']} ({it['id']}): starts at {start}s, {length:.2f}s long (off by {error:.1f})", flush=True)


def links():
    """Instagram posts and reels get a link to the public post, matched by time: a post's ID encodes when it
    was posted, and the export gives each video's time. index/ig-posts.json is [{kind, code, ts}], collected
    from the profile page (see README). Stories expire, so they get no link."""
    posts = json.load(open(os.path.join(MEDIA, 'index', 'ig-posts.json')))
    videos = [it for it in items().values() if it['source'].startswith('Instagram') and 'stories' not in it['source']]
    pairs = sorted((abs(p['ts'] - it['ts']), it['id'], i) for it in videos for i, p in enumerate(posts) if abs(p['ts'] - it['ts']) < 3600)
    used, got = set(), {}
    for _, vid, i in pairs:
        if vid in got or (posts[i]['kind'] != 'p' and i in used):
            continue  # a reel is one video; a post (kind p) can hold several
        got[vid] = i
        used.add(i)
    by_clip = {clip_id(it): it['id'] for it in videos}
    clips = load_clips()
    n = 0
    for c in clips:
        vid = by_clip.get(c['id'])
        if vid in got:
            p = posts[got[vid]]
            c['ig'] = f"/{p['kind']}/{p['code']}/"
            n += 1
    save_clips(clips)
    print(f'{n} clips linked')


if __name__ == '__main__':
    commands = {'sheet': sheet, 'cut': cut, 'build': lambda name: print(build(name)), 'montage': montage, 'rebuild': rebuild,
                'moments': moments, 'recipes': find_recipes, 'links': links}
    if len(sys.argv) < 2 or sys.argv[1] not in commands:
        sys.exit(__doc__)
    commands[sys.argv[1]](*sys.argv[2:])
