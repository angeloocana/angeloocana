# Clip tools

The home page's video row is a list of short 9:16 loops (`app/content/clips.json`). The videos themselves
never go in git; they live in the shared media folder, `~/dev/angeloocana-media` (or `$ANGELOOCANA_MEDIA`):

```
media/            served at /media: clips/<id>.mp4 + .jpg poster, t2f/ and joj/ screenshots
index/items.json  every usable source video: id (v000…), path, source, Instagram caption, time, size, length
index/montages.json   the recipe of every clip: which seconds of which videos (or photos), and the framing
index/cut-drafts.json cuts changed on /review/cut that have not been rebuilt yet
index/cut-checks.json clips whose cut was checked on /review/cut: edited (rebuilt from a draft) or kept as it was
index/ig-posts.json   every public post on the Instagram profile: kind (p / reel / tv), shortcode, time
index/reviews.json    the first automatic review of every source video (category, people, best start)
index/config.json     where the Instagram export is (its media/ folder holds the originals)
sources/huawei/   originals from the old phone (not in the Instagram export)
work/             contact sheets and other scratch output
work/moments/     each source video split into short moments (v226.json) and their thumbnails (v226.jpg)
clip-feedback.json    notes left on the /review page
```

`index/`, `work/` and `clip-feedback.json` hold personal data (captions that mention other people, private
notes, file paths, frames of every video). Keep them out of the repo; `work/` is never deployed either.

## Common jobs

```sh
python3 scripts/clips/clips.py rebuild               # rebuild every clip whose cut was changed on /review/cut
python3 scripts/clips/clips.py sheet v226            # look at a source video as a strip of frames (in work/)
python3 scripts/clips/clips.py sheet v226 0 24 1     # from 0s, 24s long, one frame per second
python3 scripts/clips/clips.py cut v226 9.8          # re-cut an existing clip from a new start
python3 scripts/clips/clips.py cut v300 4 food "Grilling picanha" "Picanha na grelha"   # a new clip
python3 scripts/clips/clips.py build h-wood          # rebuild a clip after editing montages.json by hand
python3 scripts/clips/clips.py moments all           # find the moments of new source videos (for /review/cut)
python3 scripts/clips/clips.py recipes               # find the recipe of clips cut before recipes were kept
python3 scripts/clips/clips.py links                 # refresh Instagram links after adding clips
```

## The cut editor

`/review/cut/<clip id>` (the **Edit cut** link on each card of `/review`, dev server only) shows every
short moment of the clip's source videos: about 2.5 seconds each, split where the camera cuts, with a bar
for how much motion it has. Moments the clip uses now have a dashed amber outline; the new selection has a
green one, numbered in play order. Hover a moment to watch it, click to add it or take it out, and add
footage from any other source video with **+ Footage from another video**. Each piece of the selection
has its own start, length, zoom and framing, and **Play your cut** previews it all in order.

Every change saves as a draft in `index/cut-drafts.json`. **Rebuild video** renders it right away
(`clips.py rebuild <id>`); `clips.py rebuild` with no id renders every draft. Rebuilding makes the draft
the clip's recipe in `montages.json`. Moments are found the first time a video is opened (or all at once
with `clips.py moments all`) and kept in `work/moments/`.

To go through every clip: rebuilding a draft marks the clip **edited**, and **Keep this cut** marks one that
is fine as it is **kept** (`index/cut-checks.json`). `/review` shows the mark on each card, how many cuts
are checked, and a **To check** filter; **Next to check →** in the editor opens the next unchecked clip.

A clip's id is `c` + the first 8 hex characters of the sha1 of its `src` in `items.json`; montages are `h-…`.
Re-cut files get a new `?v=` tag in their URL automatically, so visitors see the new cut right away.
Then check the result on `/review` (or the home page), and deploy.

## Choosing footage

- Look before cutting: make a contact sheet and check who is in the frame. Several ice-swimming videos
  show other club members; Ângelo is the one being filmed only some of the time.
- Prefer moments with Ângelo clearly in frame; avoid kids and strangers' faces as the subject.
- The loop is 6 seconds by default to keep the page light (~0.5–1.5 MB). Montages run longer; above 15
  seconds a clip gets more compression.
- `montages.json` pieces: `["vid", path, start, seconds, cx, zoom?, cy?]` or `["img", path, seconds, cx, zoomIn]`.
  `cx`/`cy` place the 9:16 crop; `zoom` > 1 crops closer (useful for far-away swimmers in low-res video).
  Paths starting `ig:` are inside the Instagram export's `media/` folder; others are relative to the media folder.
  Back-to-back pieces of the same video with the same framing are joined, so they play without a seam.

## Instagram links

The export has no post links, so `ig-posts.json` was collected from the profile page while signed in:
scroll the grid to the end, collect every `/p/…` and `/reel/…` link, and decode each shortcode to its
media id (base64 alphabet `A–Z a–z 0–9 - _`). The id's top bits are milliseconds since 2011-08-24
(`(id >> 23) + 1314220021721`), which matches the export's time for the same video within minutes.
`clips.py links` pairs them up. Refresh `ig-posts.json` the same way after posting more.
