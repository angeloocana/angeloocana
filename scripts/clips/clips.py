"""Tools for the home page's video row. Needs python3 and ffmpeg. See scripts/clips/README.md.

    python3 scripts/clips/clips.py sheet v226               contact sheet of a source video, to pick a moment
    python3 scripts/clips/clips.py sheet v226 0 24 1        ...from second 0, 24 seconds long, one frame a second
    python3 scripts/clips/clips.py cut v226 9.8 ice "Butterfly in the ice pool" "Borboleta na piscina de gelo"
    python3 scripts/clips/clips.py montage h-wood           rebuild a montage from index/montages.json
    python3 scripts/clips/clips.py links                    match Instagram post links (needs index/ig-posts.json)

Everything reads and writes the shared media folder (~/dev/angeloocana-media or $ANGELOOCANA_MEDIA), never
the repo, except app/content/clips.json. Output has no audio and no metadata (no GPS, no camera info).
"""
import hashlib
import json
import os
import subprocess
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MEDIA = os.environ.get('ANGELOOCANA_MEDIA') or os.path.expanduser('~/dev/angeloocana-media')
CLIPS_JSON = os.path.join(REPO, 'app', 'content', 'clips.json')
OUT = os.path.join(MEDIA, 'media', 'clips')
WORK = os.path.join(MEDIA, 'work')
FPS = 30
SCALE = 'scale=720:1280:force_original_aspect_ratio=increase:flags=lanczos'


def config():
    path = os.path.join(MEDIA, 'index', 'config.json')
    return json.load(open(path)) if os.path.exists(path) else {}


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
    os.makedirs(OUT, exist_ok=True)
    mp4, jpg = os.path.join(OUT, f'{cid}.mp4'), os.path.join(OUT, f'{cid}.jpg')
    ffmpeg('-ss', str(start), '-t', str(length), '-i', source(it['path']), '-an', '-map_metadata', '-1', '-map_chapters', '-1',
           '-vf', f'{SCALE},crop=720:1280,fps={FPS},format=yuv420p',
           '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-profile:v', 'high', '-movflags', '+faststart', mp4)
    poster(mp4, jpg)
    clips = load_clips()
    if not any(c['id'] == cid for c in clips):
        if not (cat and en and pt):
            sys.exit(f'{cid} is new: pass a category and EN and PT captions')
        source_kind = 'instagram' if it['source'].startswith('Instagram') else 'phone'
        clip = {'id': cid, 'cat': cat, 'label': {'en': en, 'pt': pt}, 'star': 0, 'rejected': False, 'score': 3, 'source': source_kind}
        if source_kind == 'instagram':
            clip['igKind'] = it['source'].split('·')[-1].strip()
        clips.append(clip)
        save_clips(clips)
    print(mp4)


def montage(name):
    """Pieces: ["vid", path, start, seconds, cx, zoom?, cy?] or ["img", path, seconds, cx, zoom_in].
    cx/cy place the 9:16 crop (0 = left/top, 1 = right/bottom); zoom > 1 crops closer."""
    pieces = json.load(open(os.path.join(MEDIA, 'index', 'montages.json')))['clips'][name]
    os.makedirs(WORK, exist_ok=True)
    segs = []
    for i, p in enumerate(pieces):
        seg = os.path.join(WORK, f'{name}_{i}.mp4')
        if p[0] == 'img':
            _, path, secs, cx, zoom_in = p
            n = int(secs * FPS)
            z = f'1+0.07*on/{n}' if zoom_in else f'1.07-0.07*on/{n}'
            vf = (f'scale=1440:2560:force_original_aspect_ratio=increase,crop=1440:2560:(iw-1440)*{cx}:(ih-2560)/2,setsar=1,'
                  f"zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s=720x1280:fps={FPS},format=yuv420p")
            ffmpeg('-loop', '1', '-i', source(path), '-vf', vf, '-frames:v', str(n), '-an', '-c:v', 'libx264', '-crf', '18', '-preset', 'fast', seg)
        else:
            _, path, start, secs, cx, *rest = p
            zoom, cy = (rest + [1, 0.5])[:2] if rest else (1, 0.5)
            pre = f'crop=iw/{zoom}:ih/{zoom}:(iw-iw/{zoom})*{cx}:(ih-ih/{zoom})*{cy},' if zoom != 1 else ''
            vf = f'{pre}{SCALE},crop=720:1280:(iw-720)*{cx}:(ih-1280)/2,fps={FPS},setsar=1,format=yuv420p'
            ffmpeg('-ss', str(start), '-t', str(secs), '-i', source(path), '-vf', vf, '-an', '-c:v', 'libx264', '-crf', '18', '-preset', 'fast', seg)
        segs.append(seg)
    inputs = [arg for s in segs for arg in ('-i', s)]
    concat = ''.join(f'[{i}:v]' for i in range(len(segs))) + f'concat=n={len(segs)}:v=1:a=0[out]'
    mp4 = os.path.join(OUT, f'{name}.mp4')
    # longer montages get a little more compression so the first clip on the page stays light
    crf = '31' if sum(p[3] if p[0] == 'vid' else p[2] for p in pieces) > 15 else '28'
    ffmpeg(*inputs, '-filter_complex', concat, '-map', '[out]', '-an', '-map_metadata', '-1', '-map_chapters', '-1',
           '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-profile:v', 'high', '-movflags', '+faststart', mp4)
    poster(mp4, os.path.join(OUT, f'{name}.jpg'))
    for s in segs:
        os.remove(s)
    print(mp4)


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
    commands = {'sheet': sheet, 'cut': cut, 'montage': montage, 'links': links}
    if len(sys.argv) < 2 or sys.argv[1] not in commands:
        sys.exit(__doc__)
    commands[sys.argv[1]](*sys.argv[2:])
