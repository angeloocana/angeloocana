# Clip tools

The home page's video row is a list of short 9:16 loops (`app/content/clips.json`). The videos themselves
never go in git; they live in the shared media folder, `~/dev/angeloocana-media` (or `$ANGELOOCANA_MEDIA`):

```
media/            served at /media: clips/<id>.mp4 + .jpg poster, t2f/ and joj/ screenshots
index/items.json  every usable source video: id (v000…), path, source, Instagram caption, time, size, length
index/montages.json   the recipe for each montage (h-ice, h-wood, …) and multi-part clip
index/ig-posts.json   every public post on the Instagram profile: kind (p / reel / tv), shortcode, time
index/reviews.json    the first automatic review of every source video (category, people, best start)
index/config.json     where the Instagram export is (its media/ folder holds the originals)
sources/huawei/   originals from the old phone (not in the Instagram export)
work/             contact sheets and other scratch output
clip-feedback.json    notes left on the /review page
```

`index/` and `clip-feedback.json` hold personal data (captions that mention other people, private notes,
file paths). Keep them out of the repo.

## Common jobs

```sh
python3 scripts/clips/clips.py sheet v226            # look at a source video as a strip of frames (in work/)
python3 scripts/clips/clips.py sheet v226 0 24 1     # from 0s, 24s long, one frame per second
python3 scripts/clips/clips.py cut v226 9.8          # re-cut an existing clip from a new start
python3 scripts/clips/clips.py cut v300 4 food "Grilling picanha" "Picanha na grelha"   # a new clip
python3 scripts/clips/clips.py montage h-wood        # rebuild a montage after editing montages.json
python3 scripts/clips/clips.py links                 # refresh Instagram links after adding clips
```

A clip's id is `c` + the first 8 hex characters of the sha1 of its `src` in `items.json`; montages are `h-…`.
Re-cut files get a new `?v=` tag in their URL automatically, so visitors see the new cut right away.
Then check the result on `/review` (or the home page), and deploy.

## Choosing footage

- Look before cutting: make a contact sheet and check who is in the frame. Several ice-swimming videos
  show other club members; Ângelo is the one being filmed only some of the time.
- Prefer moments with Ângelo clearly in frame; avoid kids and strangers' faces as the subject.
- The loop is 6 seconds by default to keep the page light (~0.5–1.5 MB). Montages run longer.
- `montages.json` pieces: `["vid", path, start, seconds, cx, zoom?, cy?]` or `["img", path, seconds, cx, zoomIn]`.
  `cx`/`cy` place the 9:16 crop; `zoom` > 1 crops closer (useful for far-away swimmers in low-res video).
  Paths starting `ig:` are inside the Instagram export's `media/` folder; others are relative to the media folder.

## Instagram links

The export has no post links, so `ig-posts.json` was collected from the profile page while signed in:
scroll the grid to the end, collect every `/p/…` and `/reel/…` link, and decode each shortcode to its
media id (base64 alphabet `A–Z a–z 0–9 - _`). The id's top bits are milliseconds since 2011-08-24
(`(id >> 23) + 1314220021721`), which matches the export's time for the same video within minutes.
`clips.py links` pairs them up. Refresh `ig-posts.json` the same way after posting more.
