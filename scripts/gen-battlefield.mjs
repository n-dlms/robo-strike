#!/usr/bin/env node
// Generate public/assets/raw/bg_battlefield.png — deterministic pixel-art desert
// arena (320×240) in the game's muted terrain family. Pure Node (zlib + CRC),
// seeded LCG — no Math.random, no image libs.
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const W = 320
const H = 240

// ---- seeded LCG (deterministic; cosmetic only) ----
let seed = 0x726f626f >>> 0
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0
  return seed / 0x100000000
}
const ri = (min, max) => min + Math.floor(rnd() * (max - min + 1))

// ---- terrain shades (muted khaki/brown family, low contrast so sprites pop) ----
const C = {
  base: [152, 144, 122],
  dark: [104, 96, 80],
  deeper: [86, 78, 64],
  light: [170, 162, 138],
  road: [170, 162, 140],
  roadEdge: [116, 108, 90],
  grass: [100, 130, 64],
  grassDark: [84, 114, 52],
}
const px = (c, d = 0) => [c[0] + d, c[1] + d, c[2] + d]

const buf = Buffer.alloc(W * H * 3, 0)
const set = (x, y, c) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return
  const i = (y * W + x) * 3
  buf[i] = Math.max(0, Math.min(255, c[0]))
  buf[i + 1] = Math.max(0, Math.min(255, c[1]))
  buf[i + 2] = Math.max(0, Math.min(255, c[2]))
}

// 1. base + organic tonal blobs (overlapping random-walk discs, no hard edges)
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) set(x, y, C.base)
for (let p = 0; p < 26; p++) {
  const d = rnd() < 0.5 ? -5 : 5
  let bx = ri(0, W)
  let by = ri(0, H)
  const steps = ri(8, 22)
  for (let st = 0; st < steps; st++) {
    const r = ri(8, 20)
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r) continue
      if (rnd() < 0.12) continue // ragged edge
      set(bx + dx, by + dy, px(C.base, d))
    }
    bx += ri(-14, 14)
    by += ri(-10, 10)
  }
}

// 2. per-pixel dither noise (12% of pixels shift ±3)
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  if (rnd() < 0.15) set(x, y, px(C.base, rnd() < 0.5 ? -4 : 4))
}

// 3. road band with worn edges (y 150..176)
const ROAD_Y0 = 150
const ROAD_Y1 = 176
for (let y = ROAD_Y0; y <= ROAD_Y1; y++) for (let x = 0; x < W; x++) {
  const edge = y === ROAD_Y0 || y === ROAD_Y1
  set(x, y, edge ? C.roadEdge : C.road)
  if (!edge && rnd() < 0.08) set(x, y, px(C.road, -5))
}
// road cracks
for (let k = 0; k < 7; k++) {
  let x = ri(6, W - 6)
  let y = ri(ROAD_Y0 + 1, ROAD_Y1 - 1)
  const len = ri(6, 16)
  for (let n = 0; n < len; n++) {
    set(x, y, C.roadEdge)
    x += rnd() < 0.5 ? 1 : rnd() < 0.5 ? -1 : 0
    y += rnd() < 0.4 ? 1 : 0
  }
}

// 4. craters (dark ellipse + rim highlight) — keep off the road and HUD rows
for (let k = 0; k < 6; k++) {
  const cx = ri(10, W - 10)
  const cy = ri(20, H - 40)
  if (cy > ROAD_Y0 - 6 && cy < ROAD_Y1 + 6) continue
  const r = ri(3, 6)
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const dist = (dx * dx + dy * dy) / (r * r)
    if (dist > 1) continue
    if (dist > 0.55) set(cx + dx, cy + dy, C.dark)
    else set(cx + dx, cy + dy, C.deeper)
  }
  set(cx - r + 1, cy - r, C.light)
  set(cx - r, cy - r + 1, C.light)
}

// 5. tread tracks — two dashed pairs crossing the road vertically
for (const tx of [70, 210]) {
  let x = tx + ri(-6, 6)
  for (let y = 14; y < H - 24; y++) {
    if (rnd() < 0.08) x += rnd() < 0.5 ? 1 : -1
    for (const off of [-3, 3]) {
      if (rnd() < 0.55) set(x + off, y, C.dark)
      if (rnd() < 0.2) set(x + off, y + 1, C.deeper)
    }
  }
}

// 6. grass tufts — small dark-green clusters, avoiding the road
for (let k = 0; k < 26; k++) {
  const gx = ri(2, W - 3)
  const gy = ri(16, H - 30)
  if (gy > ROAD_Y0 - 4 && gy < ROAD_Y1 + 4) continue
  const n = ri(2, 4)
  for (let j = 0; j < n; j++) {
    set(gx + ri(-1, 1), gy + ri(-1, 1), rnd() < 0.5 ? C.grass : C.grassDark)
  }
}

// 7. subtle vignette — darken toward edges for CRT depth
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const dx = (x / W - 0.5) * 2
  const dy = (y / H - 0.5) * 2
  const d = Math.sqrt(dx * dx + dy * dy)
  const f = 1 - 0.16 * Math.max(0, (d - 0.45) / 0.95)
  const i = (y * W + x) * 3
  buf[i] = Math.round(buf[i] * f)
  buf[i + 1] = Math.round(buf[i + 1] * f)
  buf[i + 2] = Math.round(buf[i + 2] * f)
}

// ---- minimal PNG writer (RGB8, filter 0) ----
const crcTable = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()
const crc32 = (b) => {
  let c = -1
  for (const byte of b) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}
const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(W, 0)
ihdr.writeUInt32BE(H, 4)
ihdr[8] = 8 // bit depth
ihdr[9] = 2 // color type RGB
const raw = Buffer.alloc(H * (1 + W * 3))
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 3)] = 0 // filter none
  buf.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3)
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
])
writeFileSync('public/assets/raw/bg_battlefield.png', png)
console.log(`bg_battlefield.png written: ${png.length} bytes (${W}x${H})`)
