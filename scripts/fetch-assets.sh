#!/usr/bin/env bash
set -e
# Stage 2 asset fetch — $0 budget, commercial-safe only
# Kenney gated zips require manual click — we log attempts and create placeholders
LOG="assets/fetch.log"
echo "=== fetch-assets $(date -u) ===" | tee "$LOG"
mkdir -p assets/art/source assets/fonts public/fonts assets/audio

# Attempt font woff2 via google fonts CDN (fallback to fontsource npm later)
echo "[fonts] fetching Press Start 2P + VT323 metadata..." | tee -a "$LOG"
curl -sL "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" -H "User-Agent: Mozilla/5.0" | head -n 20 | tee -a "$LOG" || echo "fonts CSS fetch failed (expected w/o proper UA)" | tee -a "$LOG"
# Note: woff2 binary requires parsing CSS url() — we will use npm @fontsource as primary in Phase 1 scaffold

# Kenney — HTML verified 200 in research, ZIP gated -> record
for slug in "top-down-tanks" "pixel-ui-pack" "ui-pack" "particle-pack" "interface-sounds" "casino-audio"; do
  url="https://kenney.nl/assets/$slug"
  echo "[kenney] checking $url" | tee -a "$LOG"
  curl -sI "$url" | head -n 5 | tee -a "$LOG" || true
done

# OGA — check CC0 pages still 200
for slug in "explosion-3" "pixel-art-explosion-animation"; do
  url="https://opengameart.org/content/$slug"
  echo "[oga] checking $url" | tee -a "$LOG"
  curl -sI "$url" | head -n 5 | tee -a "$LOG" || true
done

# Create placeholder PNGs (1x1 navy pixel) to prove pipeline until manual ZIPs arrive
# Use python to generate valid PNGs without external deps
python3 <<'PY'
import struct, zlib
def png_1x1(path, rgb):
    # 1x1 truecolor
    def chunk(typ, data):
        c = typ + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', 1,1,8,2,0,0,0) # 1x1 8-bit RGB
    data = zlib.compress(bytes([rgb[0], rgb[1], rgb[2]]))
    with open(path,'wb') as f:
        f.write(sig + chunk(b'IHDR', ihdr) + chunk(b'IDAT', data) + chunk(b'IEND', b''))
# navy
png_1x1('assets/art/raw/_placeholder_navy_1x1.png', (10,26,63))
png_1x1('assets/art/raw/player_idle_1.png', (79,242,227))
png_1x1('assets/art/raw/enemy1_idle_1.png', (255,79,216))
png_1x1('assets/art/raw/explosion_small_1.png', (255,217,79))
print("placeholders written")
PY
ls -lh assets/art/raw/ | tee -a "$LOG"

# Placeholder audio — generate silent 0.1s wav if ffmpeg present, else empty
if command -v ffmpeg >/dev/null 2>&1; then
  echo "[audio] ffmpeg found $(ffmpeg -version | head -n1)" | tee -a "$LOG"
  ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=mono -t 0.1 -acodec pcm_s16le assets/audio/sfx_ui_blip.wav 2>&1 | tail -n5 | tee -a "$LOG" || true
  ffmpeg -y -f lavfi -i "sine=frequency=880:duration=0.07" -acodec pcm_s16le assets/audio/sfx_ui_blip.wav 2>&1 | tail -n5 | tee -a "$LOG" || true
  ls -lh assets/audio/*.wav 2>&1 | tee -a "$LOG" || true
else
  echo "[audio] ffmpeg not found — creating empty placeholders" | tee -a "$LOG"
  touch assets/audio/sfx_ui_blip.wav assets/audio/sfx_lockon.wav assets/audio/sfx_fire.wav assets/audio/sfx_whoosh.wav assets/audio/sfx_clank.wav assets/audio/sfx_explosion_small.wav assets/audio/sfx_explosion_big.wav assets/audio/sfx_coin_tick.wav assets/audio/sfx_win.wav assets/audio/sfx_jackpot.wav assets/audio/sfx_miss.wav assets/audio/music_loop.wav
  ls -lh assets/audio/ | tee -a "$LOG"
fi

echo "=== done ===" | tee -a "$LOG"
cat "$LOG"
