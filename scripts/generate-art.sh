#!/usr/bin/env bash
set -e
# Generate full sprite raw placeholders for all S01-S17 per assets.md mapping
# Real Kenney ZIPs manually replace these; placeholders prove pipeline & keep vite build green
mkdir -p assets/art/raw assets/art/source assets/art/dist public/assets/atlas
python3 <<'PY'
import struct, zlib, os, json
def png_1x1(path, rgb, size=1):
    # create size x size solid with 1px outline if size>1
    # simple: generate size*size with border = outline color
    outline=(26,26,26)
    fill=rgb
    def chunk(typ, data):
        c=typ+data
        import struct, zlib
        return struct.pack('>I', len(data))+c+struct.pack('>I', zlib.crc32(c)&0xffffffff)
    w=h=size
    raw=b''
    for y in range(h):
        raw+=b'\x00'
        for x in range(w):
            if x==0 or y==0 or x==w-1 or y==h-1:
                raw+=bytes(outline)
            else:
                raw+=bytes(fill)
    ihdr=struct.pack('>IIBBBBB', w,h,8,2,0,0,0)
    dat=zlib.compress(raw)
    sig=b'\x89PNG\r\n\x1a\n'
    with open(path,'wb') as f:
        f.write(sig+chunk(b'IHDR', ihdr)+chunk(b'IDAT', dat)+chunk(b'IEND', b''))
# palette map
colors={
 'navy':(10,26,63),
 'cyan':(79,242,227),
 'magenta':(255,79,216),
 'yellow':(255,217,79),
 'green':(88,255,155),
 'white':(255,255,255),
}
# S01 player idle2/recoil2
png_1x1('assets/art/raw/player_idle_1.png', colors['cyan'], 16)
png_1x1('assets/art/raw/player_idle_2.png', colors['cyan'], 16)
png_1x1('assets/art/raw/player_recoil_1.png', colors['white'], 16)
png_1x1('assets/art/raw/player_recoil_2.png', colors['yellow'], 16)
# S03-07 enemies x3 each 10 frames: idle2 hit2 destroyed6
for i, (name, col) in enumerate([('enemy1', colors['magenta']), ('enemy2', colors['yellow']), ('enemy3', colors['green'])],1):
    png_1x1(f'assets/art/raw/{name}_idle_1.png', col, 16)
    png_1x1(f'assets/art/raw/{name}_idle_2.png', col, 16)
    png_1x1(f'assets/art/raw/{name}_hit_1.png', colors['white'], 16)
    png_1x1(f'assets/art/raw/{name}_hit_2.png', colors['white'], 16)
    for k in range(1,7):
        # destroyed 6 but first 4 shared for small vs big split
        c = colors['magenta'] if k%2 else colors['yellow']
        png_1x1(f'assets/art/raw/{name}_destroyed_{k}.png', c, 32 if k>4 else 16)
# S08 bunker 3 states
png_1x1('assets/art/raw/bunker_intact.png', colors['navy'], 32)
png_1x1('assets/art/raw/bunker_damaged.png', colors['green'], 32)
png_1x1('assets/art/raw/bunker_destroyed.png', colors['magenta'], 32)
# S09 shell+trail 5
png_1x1('assets/art/raw/shell.png', colors['cyan'], 8)
for k in range(1,5):
    png_1x1(f'assets/art/raw/shell_trail_{k}.png', colors['yellow'], 4+k)
# S10 muzzle 2
png_1x1('assets/art/raw/muzzle_1.png', colors['white'], 16)
png_1x1('assets/art/raw/muzzle_2.png', colors['yellow'], 12)
# S11-12 explosions
for k in range(1,5):
    png_1x1(f'assets/art/raw/explosion_small_{k}.png', colors['yellow'] if k<3 else colors['magenta'], 16)
for k in range(1,7):
    png_1x1(f'assets/art/raw/explosion_big_{k}.png', colors['white'] if k<3 else colors['magenta'], 32)
# S13 coin 4
for k in range(1,5):
    png_1x1(f'assets/art/raw/coin_{k}.png', colors['yellow'], 8)
# S14 reticle 2
png_1x1('assets/art/raw/reticle_1.png', colors['cyan'], 16)
png_1x1('assets/art/raw/reticle_2.png', colors['magenta'], 16)
# S15 UI kit placeholder (panels)
png_1x1('assets/art/raw/ui_panel.png', colors['navy'], 64)
png_1x1('assets/art/raw/ui_button.png', colors['cyan'], 32)
png_1x1('assets/art/raw/ui_button_hover.png', colors['green'], 32)
# S16 starfield 256 tile (approx)
png_1x1('assets/art/raw/bg_starfield.png', colors['navy'], 64)
# S17 scanline 4x4 already via placeholder but redo 4x4
png_1x1('assets/art/raw/scanline.png', (255,255,255), 4)

# Create atlas manifest placeholder JSON (Phaser Hash) for Phase 1 preload
import os, glob
frames={}
for p in glob.glob('assets/art/raw/*.png'):
    name=os.path.basename(p)
    frames[name]={"frame":{"x":0,"y":0,"w":16,"h":16},"rotated":False,"trimmed":False,"spriteSourceSize":{"x":0,"y":0,"w":16,"h":16},"sourceSize":{"w":16,"h":16}}
# pick one big for variety check
atlas={"frames":frames,"meta":{"app":"robo-strike generate-art.sh","version":"1.0","image":"robo-atlas.png","format":"RGBA8888","size":{"w":1024,"h":1024},"scale":"1"}}
os.makedirs('public/assets/atlas', exist_ok=True)
with open('public/assets/atlas/robo-atlas.json','w') as f:
    json.dump(atlas,f,indent=2)
# create placeholder atlas png (reuse 64x64 navy's larger)
import shutil
shutil.copy('assets/art/raw/bg_starfield.png','public/assets/atlas/robo-atlas.png')
shutil.copy('assets/art/raw/scanline.png','public/assets/atlas/scanline.png')
print(f"generated {len(frames)} frame entries -> public/assets/atlas/robo-atlas.json")
PY
ls -lh assets/art/raw/ | wc -l
ls -lh assets/art/raw/ | head -n 50
ls -lh public/assets/atlas/
echo "art generation done"
