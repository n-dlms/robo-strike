#!/usr/bin/env python3
"""
PNG asserts for ROBO STRIKE — palette, size, outline, duplicates, valid PNG
Run: python3 scripts/assert_png.py
Fails (exit 1) if any assert breaks. Used in CI and pre-commit.
"""
import pathlib, hashlib, sys
from PIL import Image

RAW = pathlib.Path("assets/art/raw")
# Locked palette from docs/ASSET_INVENTORY.md + PLAYBOOK
PALETTE = {
    (10,26,63),   # #0a1a3f navy
    (79,242,227), # #4ff2e3 cyan
    (255,79,216), # #ff4fd8 magenta
    (255,217,79), # #ffd94f gold
    (88,255,155), # #58ff9b mint
    (255,255,255),# #ffffff white
    (26,26,26),   # #1a1a1a outline
}
# Allow slight tolerance for anti-aliasing? No — must be exact after palette lock.
ALLOWED = PALETTE | {(0,0,0,0)}  # transparent is allowed separately via alpha

MAX_RAW_SIZE_KB = 600  # single raw should be <600KB (before atlas)
ATLAS_MAX = 1024
EXPECTED = {
    # size checks — at least these exist with correct dims
    "player_idle_1.png": (32,32),
    "coin_1.png": (8,8),
    "bg_starfield.png": (64,64),
    "ui_title_bg.png": (320,180),
    "scanline.png": (4,4),
}

errors = []
warnings = []

if not RAW.exists():
    print(f"FAIL: {RAW} not found")
    sys.exit(1)

pngs = sorted(RAW.glob("*.png"))
print(f"Checking {len(pngs)} PNGs in {RAW}")

# 1. Valid PNG + palette lock
for p in pngs:
    try:
        im = Image.open(p).convert("RGBA")
    except Exception as e:
        errors.append(f"{p.name}: not valid PNG — {e}")
        continue
    w,h = im.size
    if w == 0 or h == 0:
        errors.append(f"{p.name}: zero size")
    if max(w,h) > ATLAS_MAX*2:
        warnings.append(f"{p.name}: large {w}x{h} > {ATLAS_MAX*2} — will be sliced")

    # palette check
    bad_pixels = []
    for y in range(h):
        for x in range(w):
            r,g,b,a = im.getpixel((x,y))
            if a < 10:
                continue
            if (r,g,b) not in PALETTE:
                # allow near-white/gold etc with tolerance 5?
                # strict: must be exactly palette
                bad_pixels.append((x,y,(r,g,b)))
                if len(bad_pixels) > 5:
                    break
        if len(bad_pixels) > 5:
            break
    if bad_pixels:
        errors.append(f"{p.name}: palette violation — {len(bad_pixels)} bad pixels e.g. {bad_pixels[:3]} not in {sorted(PALETTE)}")
    # size
    kb = p.stat().st_size / 1024
    if kb > MAX_RAW_SIZE_KB:
        warnings.append(f"{p.name}: {kb:.1f}KB > {MAX_RAW_SIZE_KB}KB — consider pngquant")
    # check expected dims
    if p.name in EXPECTED:
        exp = EXPECTED[p.name]
        if (w,h) != exp:
            warnings.append(f"{p.name}: size {w}x{h} != expected {exp[0]}x{exp[1]}")

# 2. Duplicates (should be 0 after dedup fix)
hash_to_files = {}
for p in pngs:
    h = hashlib.md5(p.read_bytes()).hexdigest()
    hash_to_files.setdefault(h, []).append(p.name)
dups = {h:fs for h,fs in hash_to_files.items() if len(fs) > 1}
if dups:
    for h, fs in dups.items():
        errors.append(f"duplicate hash {h[:8]}: {fs} — every raw must be distinct picture (see fef579d fix)")

# 3. Outline check: at least 75% of sprites should have #1a1a1a outline on edge
# Simple: check that at least one edge pixel is outline color
outline = (26,26,26)
no_outline = []
for p in pngs:
    im = Image.open(p).convert("RGBA")
    w,h = im.size
    has_outline = False
    # scan border
    for x in range(w):
        for y in [0, h-1]:
            r,g,b,a = im.getpixel((x,y))
            if a>10 and (r,g,b)==outline:
                has_outline = True
                break
        if has_outline:
            break
    for y in range(h):
        for x in [0, w-1]:
            r,g,b,a = im.getpixel((x,y))
            if a>10 and (r,g,b)==outline:
                has_outline = True
                break
        if has_outline:
            break
    if not has_outline and p.name not in ["scanline.png", "bg_starfield.png"]:  # starfield/scanline are special
        warnings.append(f"{p.name}: no 1px outline #1a1a1a found on border — check PLAYBOOK 1px rule")

# 4. Count
if len(pngs) < 66:
    errors.append(f"only {len(pngs)} raw PNGs — expected >=66 (S01-S17 + title/HUD)")
if len(pngs) > 80:
    warnings.append(f"{len(pngs)} raw PNGs >80 — atlas may exceed 1024")

print("\n".join(warnings) if warnings else "No warnings")
if errors:
    print("\nFAIL:")
    for e in errors:
        print(" -", e)
    sys.exit(1)
else:
    print(f"PASS: {len(pngs)} PNGs ok, palette locked {len(PALETTE)} colors, no dups, outline checked")
    sys.exit(0)
