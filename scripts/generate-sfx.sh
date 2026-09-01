#!/usr/bin/env bash
set -e
# Generate placeholder SFX wavs via ffmpeg approximating audio.md §10 recipes
# Real jsfxr/Bfxr exports will replace these in Phase 4, same filenames keep pipeline intact
mkdir -p public/assets/audio assets/audio/layers

# Helper: sine burst with envelope via ffmpeg afade
gen_sine() { # freq dur outfile
  freq=$1; dur=$2; out=$3
  ffmpeg -y -f lavfi -i "sine=frequency=${freq}:duration=${dur}:sample_rate=44100" -ac 1 -ar 44100 -acodec pcm_s16le -af "afade=t=in:st=0:d=0.005,afade=t=out:st=$(python3 -c "print(float('${dur}')-0.01)"):d=0.01" "$out" 2>&1 | tail -n2 || true
}
gen_noise() { # dur outfile
  dur=$1; out=$2
  ffmpeg -y -f lavfi -i "anoisesrc=d=0.2:c=white:r=44100:a=0.5" -t "$dur" -ac 1 -ar 44100 -acodec pcm_s16le -af "afade=t=in:st=0:d=0.005,afade=t=out:st=$(python3 -c "print(float('${dur}')-0.02)"):d=0.02,volume=0.6" "$out" 2>&1 | tail -n2 || true
}

echo "Generating SFX per audio.md recipes..."
gen_sine 880 0.07 assets/audio/sfx_ui_blip.wav
gen_sine 600 0.35 assets/audio/sfx_lockon.wav
# fire: sweep 450Hz down via two tones layered (approx) — use 450Hz 0.22s
gen_sine 450 0.22 assets/audio/sfx_fire.wav
# whoosh: noise 0.25s
ffmpeg -y -f lavfi -i "anoisesrc=d=0.25:c=white:r=44100:a=0.4" -t 0.25 -ac 1 -ar 44100 -acodec pcm_s16le assets/audio/sfx_whoosh.wav 2>&1 | tail -n2 || true
gen_sine 650 0.18 assets/audio/sfx_clank.wav
ffmpeg -y -f lavfi -i "anoisesrc=d=0.58:c=white:r=44100:a=0.6" -t 0.58 -ac 1 -ar 44100 -acodec pcm_s16le -af "lowpass=f=1200,volume=0.7" assets/audio/sfx_explosion_small.wav 2>&1 | tail -n2 || true
ffmpeg -y -f lavfi -i "anoisesrc=d=0.92:c=brown:r=44100:a=0.6" -t 0.92 -ac 1 -ar 44100 -acodec pcm_s16le -af "lowpass=f=800,volume=0.8" assets/audio/sfx_explosion_big.wav 2>&1 | tail -n2 || true
gen_sine 1200 0.07 assets/audio/sfx_coin_tick.wav
gen_sine 900 1.2 assets/audio/sfx_win.wav
gen_sine 1100 2.8 assets/audio/sfx_jackpot.wav
gen_sine 220 0.35 assets/audio/sfx_miss.wav

# BeepBox loop placeholder: 50.5s C-minor drone (real BeepBox 28bars @133BPM will replace)
# Use two sine layers: C2 65.41Hz + G2 98Hz = C minor feel, with slight vibrato via tremolo
echo "Generating loop placeholder 50.5s..."
ffmpeg -y -f lavfi -i "sine=frequency=65.41:duration=50.5:beep_factor=2:sample_rate=44100" -t 50.5 -ac 2 -ar 44100 -acodec pcm_s16le -af "volume=0.25,apulsator=hz=0.2:amount=0.5" assets/audio/music_loop.wav 2>&1 | tail -n3 || true
# fallback if beep_factor not supported, use simple sine
if [ ! -f assets/audio/music_loop.wav ] || [ ! -s assets/audio/music_loop.wav ]; then
  ffmpeg -y -f lavfi -i "sine=frequency=65.41:duration=50.5:sample_rate=44100" -t 50.5 -ac 2 -ar 44100 -acodec pcm_s16le -af "volume=0.25" assets/audio/music_loop.wav 2>&1 | tail -n3 || true
fi

# Convert to ogg via libvorbis if available
for wav in assets/audio/*.wav; do
  ogg="public/assets/audio/$(basename "$wav" .wav).ogg"
  mkdir -p public/assets/audio
  if ffmpeg -y -i "$wav" -c:a libvorbis -qscale:a 4 "$ogg" 2>&1 | tail -n2; then
    echo "ogg $ogg"
  else
    cp "$wav" "$ogg" 2>&1 || true
  fi
  # also copy wav to public
  cp "$wav" "public/assets/audio/$(basename "$wav")" 2>&1 || true
done

# also copy layers placeholder (if any) — generate silent layer wavs for CC0 optional
touch assets/audio/layers/kenney_chip_04.wav
ffmpeg -y -f lavfi -i "sine=frequency=1200:duration=0.07:sample_rate=44100" -t 0.07 -ac 1 -ar 44100 -acodec pcm_s16le -af "volume=0.15" assets/audio/layers/kenney_chip_04.wav 2>&1 | tail -n2 || true
cp assets/audio/layers/kenney_chip_04.wav public/assets/audio/ 2>&1 || true

# manifest
cat > assets/audio/manifest.json <<'JSON'
{
  "sfx_ui_blip": {"file":"sfx_ui_blip.wav","ogg":"sfx_ui_blip.ogg","volume":0.45,"length":0.07},
  "sfx_lockon": {"file":"sfx_lockon.wav","ogg":"sfx_lockon.ogg","volume":0.55,"length":0.35},
  "sfx_fire": {"file":"sfx_fire.wav","ogg":"sfx_fire.ogg","volume":0.65,"length":0.22},
  "sfx_whoosh": {"file":"sfx_whoosh.wav","ogg":"sfx_whoosh.ogg","volume":0.5,"length":0.25},
  "sfx_clank": {"file":"sfx_clank.wav","ogg":"sfx_clank.ogg","volume":0.5,"length":0.18},
  "sfx_explosion_small": {"file":"sfx_explosion_small.wav","ogg":"sfx_explosion_small.ogg","volume":0.7,"length":0.58},
  "sfx_explosion_big": {"file":"sfx_explosion_big.wav","ogg":"sfx_explosion_big.ogg","volume":0.8,"length":0.92},
  "sfx_coin_tick": {"file":"sfx_coin_tick.wav","ogg":"sfx_coin_tick.ogg","volume":0.6,"length":0.07},
  "sfx_win": {"file":"sfx_win.wav","ogg":"sfx_win.ogg","volume":0.6,"length":1.2},
  "sfx_jackpot": {"file":"sfx_jackpot.wav","ogg":"sfx_jackpot.ogg","volume":0.75,"length":2.8},
  "sfx_miss": {"file":"sfx_miss.wav","ogg":"sfx_miss.ogg","volume":0.5,"length":0.35},
  "music_loop": {"file":"music_loop.wav","ogg":"music_loop.ogg","volume":0.45,"loop":true,"bpm":133,"bars":28,"duration":50.5,"key":"C minor","channels":["Square Lead","Square Harmony","Triangle Bass","Noise Drums"]}
}
JSON
cat > public/assets/audio/manifest.json <<'JSON'
{
  "sfx_ui_blip": {"file":"sfx_ui_blip.wav","ogg":"sfx_ui_blip.ogg","volume":0.45},
  "sfx_lockon": {"file":"sfx_lockon.wav","ogg":"sfx_lockon.ogg","volume":0.55},
  "sfx_fire": {"file":"sfx_fire.wav","ogg":"sfx_fire.ogg","volume":0.65},
  "sfx_whoosh": {"file":"sfx_whoosh.wav","ogg":"sfx_whoosh.ogg","volume":0.5},
  "sfx_clank": {"file":"sfx_clank.wav","ogg":"sfx_clank.ogg","volume":0.5},
  "sfx_explosion_small": {"file":"sfx_explosion_small.wav","ogg":"sfx_explosion_small.ogg","volume":0.7},
  "sfx_explosion_big": {"file":"sfx_explosion_big.wav","ogg":"sfx_explosion_big.ogg","volume":0.8},
  "sfx_coin_tick": {"file":"sfx_coin_tick.wav","ogg":"sfx_coin_tick.ogg","volume":0.6},
  "sfx_win": {"file":"sfx_win.wav","ogg":"sfx_win.ogg","volume":0.6},
  "sfx_jackpot": {"file":"sfx_jackpot.wav","ogg":"sfx_jackpot.ogg","volume":0.75},
  "sfx_miss": {"file":"sfx_miss.wav","ogg":"sfx_miss.ogg","volume":0.5},
  "music_loop": {"file":"music_loop.wav","ogg":"music_loop.ogg","volume":0.45,"loop":true}
}
JSON

ls -lh assets/audio/*.wav public/assets/audio/*.ogg 2>&1 | head -n 30
echo "--- manifest ---"
cat assets/audio/manifest.json
