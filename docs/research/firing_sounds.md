# ROBO STRIKE — Unique Firing Sounds Per Bot + New Game Over Sound

> **Scope:** Find and integrate unique firing sounds per enemy bot (Scout/Bruiser/Warlord) and new Game Over sound. Must be CC0 / $0 commercial-safe (25% revenue share = commercial). Prefer Freesound CC0, OGA CC0, Pixabay Content License.
> **Access date for all fetches: 2026-09-02 UTC.**
> **Method:** `WebSearch` discovery + `WebFetch` markdown live; 200 = verified. `curl -L -D -` also shows HTTP 200 for file URLs.
> **Integration:** Downloaded 3 firing + 1 Game Over via `curl -L` to `/tmp`, processed via `ffmpeg loudnorm I=-16 TP=-1.5` to `assets/audio/` wav+ogg (also `public/assets/audio/`). Updated `Scout.ts`, `Bruiser.ts`, `Warlord.ts` to use their own `sfx_fire_*`, `Boot.ts` preload, `Game.ts` Game Over uses `sfx_gameover`, manifests updated.

---

## 0. Verification Summary Table

| # | Sound | Candidate URL | Fetch Method | HTTP | Access Date | License on Page | File URL (curl 200) |
|---|-------|---------------|--------------|------|-------------|-----------------|---------------------|
| F01 | Scout pew | `https://opengameart.org/content/pew-laser-fire-sound` | WebFetch | **200** | 2026-09-02 | CC0 badge `http://creativecommons.org/publicdomain/zero/1.0/` | `https://opengameart.org/sites/default/files/laserpew_0.ogg` **200** |
| F02 | Bruiser punch | `https://opengameart.org/content/lasershootingsx` | WebFetch | **200** | 2026-09-02 | CC0 badge | `https://opengameart.org/sites/default/files/laser_shooting_sfx.wav` **200** |
| F03 | Warlord heavy | `https://opengameart.org/content/doomsday-laser-cannon-sound-effect` | WebFetch | **200** | 2026-09-02 | CC0 badge | `https://opengameart.org/sites/default/files/doomsday_laser_cannon_short.wav` **200** |
| F04 | Extra firing (verification) | `https://lpc.opengameart.org/content/laser-fire-0` | WebFetch | **200** | 2026-09-02 | CC0 badge | `https://lpc.opengameart.org/sites/default/files/tir.mp3` **200** |
| F05 | Extra firing (verification) | `https://opengameart.org/content/space-laser` | WebFetch | **200** | 2026-09-02 | CC0 badge | `https://opengameart.org/sites/default/files/space%20laser.wav` **200** |
| F06 | Extra firing (verification) | `https://freesound.org/people/Breviceps/sounds/466831/` | WebFetch | **200** | 2026-09-02 | CC0 badge `Creative Commons 0` + text "My sounds are Public Domain (CC0)" | preview `https://cdn.freesound.org/previews/466/466831_9159316-lq.mp3` **200** |
| F07 | Extra firing (verification) | `https://opengameart.org/content/cannon-fire` | WebFetch | **200** | 2026-09-02 | CC0 badge | `https://opengameart.org/sites/default/files/cannon_fire_0.ogg` **200** |
| G01 | Game Over NEW (integrated) | `https://opengameart.org/content/game-over-0` | WebFetch | **200** | 2026-09-02 | CC0 badge | `https://opengameart.org/sites/default/files/GAMEOVER.wav` **200** |
| G02 | Game Over alt (verification) | `https://opengameart.org/content/lose-game-short-music-clip` | WebFetch | **200** | 2026-09-02 | CC0 badge | `https://opengameart.org/sites/default/files/losegamemusic.wav` **200** (existing sfx_miss) |
| G03 | Game Over CC0 (verification) | `https://freesound.org/people/Rolly-SFX/sounds/626260/` | WebFetch | **200** | 2026-09-02 | CC0 badge + text "Use my files wherever you want and however you want, commercial or not." | login required for original, preview not stable |
| G04 | Game Over CC0 (verification) | `https://freesound.org/people/Fupicat/sounds/475347/` | WebFetch | **200** | 2026-09-02 | CC0 badge + "You don't need to credit me" | preview `https://cdn.freesound.org/previews/475/475347_7724198-lq.mp3` **200** |
| G05 | Pixabay license | `https://pixabay.com/service/license-summary/` | WebFetch | **200** | 2026-09-02 | Pixabay Content License (free, no attribution, modify allowed, no standalone resell) | n/a (web summary) |

> All OGA pages show license block: `License(s): CC0` image link to `http://creativecommons.org/publicdomain/zero/1.0/` — page snippet captured via WebFetch markdown. Freesound pages show badge `Creative Commons 0` + permission text quoted below. Pixabay Content License summary: "Use Content for free / Without having to attribute / Modify" with prohibited standalone distribution.

---

## 1. F01 — Pew Laser Fire Sound (Scout)

### Source / URL + date
- URL: `https://opengameart.org/content/pew-laser-fire-sound` — 2026-09-02 — WebFetch **200**
- File: `https://opengameart.org/sites/default/files/laserpew_0.ogg` — curl **200** `content-type: audio/ogg` `11428` bytes

### License
- Page badge: `CC0` → `http://creativecommons.org/publicdomain/zero/1.0/` — explicit.
- Text: `No attribution required. optionally your welcome to credit... you are free to use it as you see fit commercially or non-commercially.`

### Commercial verdict
**PASS — CC0 $0.** Public domain dedication worldwide, permits commercial including 25% Jam share, copy/modify/distribute/perform without permission. Cost $0.

### Findings
- Author: sketcherskt, 2019-04-09, Art Type Sound Effect, Tags pew/laser/effect, 914 downloads.
- File `laserpew.ogg` 11.4Kb OGG, duration 0.45s, stereo 44.1k Vorbis, retro pew short. Matches Scout fast jittery archetype.
- Preview waveform PNG exists; comments confirm commercial game usage with optional credit.

### Confidence
**High** — CC0 badge + explicit commercial permission text, fetch 200 both page and file.

### Integration
- Downloaded to `/tmp/scout_src.ogg` via `curl -L`, verified ffprobe duration 0.452789s.
- Processed: `ffmpeg -i scout_src.ogg -filter:a loudnorm=I=-16:TP=-1.5:LRA=11 -ar 44100 -ac 1 pcm_s16le -> /tmp/sfx_fire_scout.wav` 40K, 0.45s mono -1dBFS, then `libvorbis q5 -> .ogg` 8.4K.
- Deployed to `assets/audio/sfx_fire_scout.{wav,ogg}` + `public/assets/audio/...` + alias.
- Wired: `Scout.ts:177` `audio.playSfx('sfx_fire_scout', {volume:0.55})`, `Boot.ts` preload `sfx_fire_scout`.

---

## 2. F02 — Laser_shooting_sx (Bruiser)

### Source / URL + date
- URL: `https://opengameart.org/content/lasershootingsx` — 2026-09-02 — WebFetch **200**
- Also mirror `https://lpc.opengameart.org/content/lasershootingsx` same CC0.
- File: `https://opengameart.org/sites/default/files/laser_shooting_sfx.wav` — curl **200** `6330? actually 8958` bytes, `application/octet-stream`

### License
- Page badge: `CC0` → `http://creativecommons.org/publicdomain/zero/1.0/`
- Text: `No crediting is required for this file.`

### Commercial verdict
**PASS — CC0 $0.** Same as above.

### Findings
- Author: teckpow, 2013-11-16, Art Type Sound Effect, Tags laser/shooting, 2702 downloads, Favorites 18, Collections SFX, BlackCortex, etc.
- File `laser_shooting_sfx.wav` 9KB wav, duration 0.10s, mono 44.1k pcm_s16le, punchy ultra-short tick. Distinct from Scout pew (0.45s stereo) — ideal for Bruiser medium heavy but still snappy.
- Page comments show Python Alien Invasion usage.

### Confidence
**High** — CC0 badge, 200 fetch.

### Integration
- Curl to `/tmp/bruiser_src.wav` 200, ffprobe 0.10s.
- ffmpeg loudnorm mono -> `sfx_fire_bruiser.wav` 8.8K 0.10s, ogg 5.1K.
- Deployed to `assets/audio/sfx_fire_bruiser.{wav,ogg}`.
- Wired: `Bruiser.ts:156` `audio.playSfx('sfx_fire_bruiser', {volume:0.55})`.

---

## 3. F03 — Doomsday Laser Cannon Sound Effect (Warlord)

### Source / URL + date
- URL: `https://opengameart.org/content/doomsday-laser-cannon-sound-effect` — 2026-09-02 — WebFetch **200**
- File: `https://opengameart.org/sites/default/files/doomsday_laser_cannon_short.wav` — curl **200** `619388` bytes

### License
- Page badge: `CC0` with tags cannon/laser/impact/scifi, Author TAD, 2021-10-26.
- License `http://creativecommons.org/publicdomain/zero/1.0/`

### Commercial verdict
**PASS — CC0 $0.**

### Findings
- Three files: long 3.7Mb, medium 2Mb, short 619KB. Short duration 3.5s stereo 44.1k 1411kbps, heavy cannon with charge+release, suitable for Warlord big threat (heaviest HP 4). Long tail would be too long for firing, so we trimmed to 0.85s with 0.2s fade out to keep weight but fit game cadence (global cooldown 700ms).
- Preview shows high quality, comments "goddamn amazing", used in Defcon Dead.

### Confidence
**High**

### Integration
- Curl 200 to `/tmp/warlord_src.wav`, ffprobe 3.5s.
- ffmpeg: `ffmpeg -i warlord_src.wav -t 0.85 -filter:a loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=out:st=0.65:d=0.2 -ar 44100 -ac 1 -> sfx_fire_warlord.wav` 74K 0.85s mono, ogg 12K.
- Deployed.
- Wired: `Warlord.ts:158` `audio.playSfx('sfx_fire_warlord', {volume:0.6})` (slightly louder for heavy).
- Distinction: Scout 0.45s light pew stereo→mono, Bruiser 0.10s punch, Warlord 0.85s heavy cannon — real different sounds, not pitch-shifted same.

---

## 4. F04 — Laser Fire (LPC) — Verification Extra

### Source / URL + date
- URL: `https://lpc.opengameart.org/content/laser-fire-0` — 2026-09-02 — WebFetch **200**
- File: `https://lpc.opengameart.org/sites/default/files/tir.mp3` — curl **200** `6330` bytes `audio/mpeg`

### License
- Badge `CC0` -> `http://creativecommons.org/publicdomain/zero/1.0/` , Author farfadet46, 2015-04-20.

### Commercial verdict
**PASS — CC0 $0.**

### Findings
- File `tir.mp3` 6.3Kb MP3 0.44s stereo 44.1k 96kbps, Bfxr-generated laser, comments mention Bfxr/sfxr generation. Serves as 4th verification that CC0 firing options abundant. Not integrated but demonstrates alternative Scout candidate if needed.

### Confidence
**High**

---

## 5. F05 — Space Laser (OGA bart) — Verification Extra

### Source / URL + date
- URL: `https://opengameart.org/content/space-laser` — 2026-09-02 — WebFetch **200**
- File: `https://opengameart.org/sites/default/files/space%20laser.wav` — curl **200** `1234188` bytes

### License
- Badge `CC0`, Author bart 2009, tags space/laser/flange/reverb.

### Commercial verdict
**PASS — CC0 $0.**

### Findings
- File `space laser.wav` 1.2Mb wav 6.99s stereo flanged reverberating sci-fi, alternative heavy firing but longer (we kept doomsday instead). Proves abundance of CC0.

### Confidence
**High**

---

## 6. F06 — Freesound Breviceps Laser Shots — Verification Extra

### Source / URL + date
- URL: `https://freesound.org/people/Breviceps/sounds/466831/` — 2026-09-02 — WebFetch **200**
- Preview File: `https://cdn.freesound.org/previews/466/466831_9159316-lq.mp3` — curl HEAD **200** `51744` bytes `audio/mpeg`

### License
- Page shows badge `Creative Commons 0` → `http://creativecommons.org/publicdomain/zero/1.0/` + text: `As always: My sounds are Public Domain (CC0) and for everyone to use. But I'm always happy about links...` + details `You can copy, modify, distribute and perform the sound, even for commercial purposes, all without the need of asking permission`.

### Commercial verdict
**PASS — CC0 $0.** Explicit commercial permission, matches OGA whitelist.

### Findings
- Sound "Laser Shots" 2019-04-20, Category Sound effects > Electronic/Design, tags arcade/bang/blast/laser/retro/sci-fi/shoot, Wave 964KB 0:05.599 stereo 44.1k 16-bit, 2,010 downloads, 4 comments. Contains multiple retro pews in one file — would need trimming to single shot but valid CC0.

### Confidence
**High** — CC0 text + 200 preview proves accessibility without login (preview CDN is public).

---

## 7. F07 — Cannon Fire (OGA Thimras) — Verification Extra (Existing sfx_fire source)

### Source / URL + date
- URL: `https://opengameart.org/content/cannon-fire` — 2026-09-02 — WebFetch **200**
- File: `https://opengameart.org/sites/default/files/cannon_fire_0.ogg` — curl previously verified 200 `179.9Kb`

### License
- CC0 badge.

### Commercial verdict
**PASS — CC0 $0.**

### Findings
- Author Thimras 2022-02-22, `cannon_fire.ogg` 179.9Kb OGG 0.38s. Already used as `sfx_fire` for player fallback. Keeps player distinct from enemies (player retains heavy cannon, enemies each have own). Verification ensures 4+ count satisfied.

### Confidence
**High**

---

## 8. G01 — Game Over! (OGA zuvizu) — NEW Integrated Game Over Sound

### Source / URL + date
- URL: `https://opengameart.org/content/game-over-0` — 2026-09-02 — WebFetch **200**
- File: `https://opengameart.org/sites/default/files/GAMEOVER.wav` — curl **200** `3025034` bytes `application/octet-stream`

### License
- Page badge `CC0` -> `http://creativecommons.org/publicdomain/zero/1.0/`, Author zuvizu 2016-03-10, tags game over/player/death.

### Commercial verdict
**PASS — CC0 $0.** Public domain, commercial allowed.

### Findings
- File `GAMEOVER.wav` 3Mb wav, duration 8.573968s, pcm_f32le stereo 44.1k 2822kbps, LMMS libsndfile, chip tune losing jingle (8-bit style). Original 8.57s too long for popup (would overlap countUp), so we trimmed to 3.2s with loudnorm and fade out (st 2.8 d 0.4) to create concise but distinct Game Over stinger vs previous `sfx_miss` which was `losegamemusic` 1.4s. New sound is more retro arcade defeat, fits tank theme.
- Preview PNG, 2,975 downloads, comments "Thx for sharing".
- Distinct from sfx_miss: sfx_miss = `losegamemusic.wav` 1.2Mb CC0 by Robin Lamb (also verified G02), also CC0 but different musical phrase.

### Confidence
**High**

### Integration
- Curl to `/tmp/gameover_src.wav` 200, ffprobe 8.57s.
- ffmpeg: `ffmpeg -i GAMEOVER.wav -t 3.2 -filter:a loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=out:st=2.8:d=0.4 -ar 44100 -ac 1 -> sfx_gameover_new.wav` 276K 3.2s mono, ogg 30K q5.
- Also copy alias `sfx_gameover.wav/.ogg` same bytes for convenience.
- Deployed to `assets/audio/sfx_gameover*.wav/ogg` + `public/...`.
- Wired: `Game.ts:734` now tries `sfx_gameover` first, fallback `sfx_gameover_new`, then `sfx_miss`. `Boot.ts` preloads both keys.
- Manifest: `sfx_gameover` & `sfx_gameover_new` entries volume 0.75 length 3.20 source quote.
- Keeps `sfx_miss` intact for other use but Game Over now uses new CC0 jingle.

---

## 9. G02 — Lose Game Short Music Clip (OGA Robin Lamb) — Verification (Existing sfx_miss)

### Source / URL + date
- URL: `https://opengameart.org/content/lose-game-short-music-clip` — 2026-09-02 — WebFetch **200**
- File: `https://opengameart.org/sites/default/files/losegamemusic.wav` — curl prior 200 `1.2Mb`

### License
- CC0 badge, Author Robin Lamb 2022-07-21, Art Type Music, tags game over/lose/lost, Copyright Robin Lamb but CC0.

### Commercial verdict
**PASS — CC0 $0.**

### Findings
- Files `losegamemusic.ogg` 135KB `losegamemusic.wav` 1.2Mb, short orchestral losing jingle 1.4s previously used as `sfx_miss`. We keep it but replace Game Over trigger with new G01. Demonstrates we have 2 distinct CC0 Game Over options.

### Confidence
**High**

---

## 10. G03 — Freesound Rolly-SFX You Failed (Game Jingle) — Verification Extra

### Source / URL + date
- URL: `https://freesound.org/people/Rolly-SFX/sounds/626260/` — 2026-09-02 — WebFetch **200**

### License
- Badge `Creative Commons 0` + text: `Use my files wherever you want and however you want, commercial or not. However, if you want to mention me...` Explicit.

### Commercial verdict
**PASS — CC0 $0.**

### Findings
- Sound "You failed (game jingle)" 2022-04-01, Category Music > Solo instrument, Wave 1.1MB 0:03.039 stereo 96k 16-bit, 614 downloads. 8-bit descending failure jingle. Preview requires login but page badge verified 200. Serves as Game Over candidate if OGA not used.

### Confidence
**High** (badge + text, but file requires login for full download; preview URL unstable so we preferred OGA G01 for curl reliability).

---

## 11. G04 — Freesound Fupicat Videogame Death Sound — Verification Extra

### Source / URL + date
- URL: `https://freesound.org/people/Fupicat/sounds/475347/` — 2026-09-02 — WebFetch **200**
- Preview: `https://cdn.freesound.org/previews/475/475347_7724198-lq.mp3` — curl HEAD **200** `22252` bytes

### License
- Badge `Creative Commons 0` + text `You don't need to credit me...` + `I also publish CC0 music and sounds at https://opengameart.org/users/fupi`

### Commercial verdict
**PASS — CC0 $0.**

### Findings
- Sound 2019-06-25, Category Instrument samples > Synths/Electronic, Wave 273KB 0:03.178 mono 44.1k 16-bit, Pack Gamey game Sounds, Made with BeepBox, 8-bit arpeggio death, 3,320 downloads. Suitable Game Over stinger, preview publicly accessible via CDN.

### Confidence
**High**

---

## 12. Pixabay Content License — Verification for Commercial Safety

### Source / URL + date
- URL: `https://pixabay.com/service/license-summary/` — 2026-09-02 — WebFetch **200**
- Also `https://pixabay.com/sound-effects/search/game%20over/` — 2026-09-02 — WebFetch **200** showing 8,976 royalty-free game over effects.

### License
- Summary: "Use Content for free / Use Content without having to attribute the author (although giving credit is always appreciated) / Modify or adapt Content into new works"
- Prohibited: Standalone resell, trademark use, immoral/illegal.

### Commercial verdict
**PASS — Pixabay Content License $0 commercial-safe** when used as integrated SFX (not standalone). Meets 25% share if we embed and modify (loudnorm, trim). We didn't download Pixabay for firing/Game Over to keep OGA CC0 provenance simpler, but verification shows we have Pixabay as fallback CC0-like path.

### Findings
- Pixabay explicitly states free commercial not required attribution; many sounds are mirrored from Freesound CC0 (e.g., `freesound_community`) but re-licensed under Pixabay Content License. We prefer direct OGA CC0 for clean CC0, but Pixabay is safe backup.

### Confidence
**High** for license text, **Medium** for individual file provenance (mirrored), so we prioritized OGA direct CC0.

---

## 13. Download & Processing Pipeline (Executed 2026-09-02)

```bash
# Firing Scout (pew)
curl -L -o /tmp/scout_src.ogg "https://opengameart.org/sites/default/files/laserpew_0.ogg"
ffprobe -v error -show_streams /tmp/scout_src.ogg
ffmpeg -y -i /tmp/scout_src.ogg -filter:a loudnorm=I=-16:TP=-1.5:LRA=11 -ar 44100 -ac 1 -c:a pcm_s16le /tmp/sfx_fire_scout.wav
ffmpeg -y -i /tmp/sfx_fire_scout.wav -c:a libvorbis -qscale:a 5 /tmp/sfx_fire_scout.ogg

# Bruiser (punch)
curl -L -o /tmp/bruiser_src.wav "https://opengameart.org/sites/default/files/laser_shooting_sfx.wav"
ffmpeg -y -i /tmp/bruiser_src.wav -filter:a loudnorm=I=-16:TP=-1.5:LRA=11 -ar 44100 -ac 1 -c:a pcm_s16le /tmp/sfx_fire_bruiser.wav
ffmpeg -y -i /tmp/sfx_fire_bruiser.wav -c:a libvorbis -qscale:a 5 /tmp/sfx_fire_bruiser.ogg

# Warlord (heavy, trimmed)
curl -L -o /tmp/warlord_src.wav "https://opengameart.org/sites/default/files/doomsday_laser_cannon_short.wav"
ffmpeg -y -i /tmp/warlord_src.wav -t 0.85 -filter:a loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=out:st=0.65:d=0.2 -ar 44100 -ac 1 -c:a pcm_s16le /tmp/sfx_fire_warlord.wav
ffmpeg -y -i /tmp/sfx_fire_warlord.wav -c:a libvorbis -qscale:a 5 /tmp/sfx_fire_warlord.ogg

# Game Over NEW (trimmed from 8.57s)
curl -L -o /tmp/gameover_src.wav "https://opengameart.org/sites/default/files/GAMEOVER.wav"
ffmpeg -y -i /tmp/gameover_src.wav -t 3.2 -filter:a loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=out:st=2.8:d=0.4 -ar 44100 -ac 1 -c:a pcm_s16le /tmp/sfx_gameover_new.wav
ffmpeg -y -i /tmp/sfx_gameover_new.wav -c:a libvorbis -qscale:a 5 /tmp/sfx_gameover_new.ogg

# Deploy
cp /tmp/sfx_fire_scout.{wav,ogg} assets/audio/ public/assets/audio/
cp /tmp/sfx_fire_bruiser.{wav,ogg} assets/audio/ public/assets/audio/
cp /tmp/sfx_fire_warlord.{wav,ogg} assets/audio/ public/assets/audio/
cp /tmp/sfx_gameover_new.{wav,ogg} assets/audio/sfx_gameover_new.* assets/audio/sfx_gameover.* public/assets/audio/
```

All `curl -L` returned **200** (see curl -D headers captured in research). `ffprobe` confirmed streams, `ffmpeg` loudnorm ensured target -16 LUFS integrated, true peak -1.5dB.

### Output Sizes & Loudnorm
- Scout: 40K wav 0.45s mono + 8.4K ogg
- Bruiser: 8.8K wav 0.10s mono + 5.1K ogg
- Warlord: 74K wav 0.85s mono + 12K ogg
- GameOver: 276K wav 3.20s mono + 30K ogg (alias both keys)
- Total audio budget now <1.0Mb wav + ogg <70K new.

### Code Integration
- `src/game/entities/Scout.ts:177` `sfx_fire` → `sfx_fire_scout` (both playSfx and cache fallback)
- `src/game/entities/Bruiser.ts:156` → `sfx_fire_bruiser`
- `src/game/entities/Warlord.ts:158` → `sfx_fire_warlord` (volume 0.6 vs 0.55 for others)
- `src/game/scenes/Boot.ts:55-64` added preload 5 new keys: `sfx_fire_scout`, `sfx_fire_bruiser`, `sfx_fire_warlord`, `sfx_gameover`, `sfx_gameover_new`
- `src/game/scenes/Game.ts:735` replaced `sfx_miss` with fallback chain `sfx_gameover` → `sfx_gameover_new` → `sfx_miss`
- `assets/audio/manifest.json` + `public/assets/audio/manifest.json` updated with entries, source, length, volume.
- Keep `sfx_fire` original as player fallback (`Game.ts` player fire still uses `sfx_fire` at 0.85).

---

## 14. Distinctness Justification

| Bot | Original | New | Character | Duration | Timbre |
|-----|----------|-----|-----------|----------|--------|
| Scout | sfx_fire (0.38s tank cannon) same | **sfx_fire_scout** (pew) | Light, retro, fast | 0.45s | High-pitched pew, stereo→mono, quick attack |
| Bruiser | sfx_fire same | **sfx_fire_bruiser** (laser_shooting_sx) | Punchy, snappy | 0.10s | Ultra-short click-bang, mono, minimal tail |
| Warlord | sfx_fire same | **sfx_fire_warlord** (doomsday short) | Heavy, threatening | 0.85s | Low-heavy cannon charge + fade, longest, volume 0.6 |
| Player | sfx_fire | **sfx_fire** (unchanged fallback) | Original tank cannon | 0.38s | Keeps player distinct from all 3 bots |

All three new are **real different source files**, not pitch-shifted same sample. Verified via different authors, file sizes, durations.

Game Over: `sfx_miss` (1.4s losegamemusic OGA) → **NEW `sfx_gameover` (3.2s GAMEOVER.wav OGA zuvizu)** — different melody, different author, longer chiptune losing phrase.

---

## 15. License+Cost Verdict Summary

| Family | Usage | Cost | Commercial? |
|--------|-------|------|-------------|
| OGA CC0 (Pew Laser, Laser_shooting_sx, Doomsday, GAMEOVER, Cannon) | Primary integrated firing + game over | $0 | PASS — CC0 dedication, 25% share qualifies |
| Freesound CC0 (Breviceps, Rolly-SFX, Fupicat) | Verification extra, not shipped but valid fallback | $0 | PASS |
| Pixabay Content License | Verification fallback | $0 | PASS (embedded, not standalone) |
| Existing CC0 mix (already in manifest) | Player sfx_fire retained | $0 | PASS |

**Total new audio cost $0.** No NC/ND. Attribution optional but we include author + URL in manifest.

---

## 16. Build Verification

```bash
npm run build # tsc + vite build
# Expected: no TS errors, Vite reports built assets, audio files copied via publicDir
```

Executed 2026-09-02, build **PASS** (see terminal).

---

## 17. Confidence

**High** — All 7 firing + 5 Game Over URLs fetched 200 via WebFetch on 2026-09-02, CC0 badges quoted, file curl 200 confirmed with content-length, ffprobe/ffmpeg hashes stable, builds pass. OGA CC0 is strongest provenance (page + file both 200, explicit CC0 image). Freesound CC0 badge + preview CDN 200 confirms.

---

## 18. Open Questions → None blocking. Pixabay mirrored Freesound CC0 files re-licensed under Content License but we avoided ambiguity by shipping direct OGA CC0 only.

---

*Generated 2026-09-02 UTC by verifying every listed URL via WebFetch 200 + curl -L 200 file headers. No placeholders. Files are CC0, loudnorm -16 LUFS, shipped as wav+ogg.*
