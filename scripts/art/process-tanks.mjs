#!/usr/bin/env node
// ROBO STRIKE art pipeline — Bleed's WW2 top-down tanks (CC-BY 3.0, credit in README).
// Splits hull/turret from each strip (alpha-gap component split), rotates barrels
// up, downscales to class sizes, tints toward the locked palette accent, adds a
// 1px class-colored outline, and writes the 8 game sprites.
//
//   player  = T-34          (cyan  #4ff2e3)
//   SCOUT   = Pz.Kpfw.IV-G  (magenta #ff4fd8) — small, fast
//   BRUISER = Tiger-II      (gold   #ffd94f) — heavy brawler
//   WARLORD = KV-2          (green  #58ff9b) — massive howitzer
import sharp from 'sharp'
import { writeFileSync, mkdirSync } from 'node:fs'

const SRC = '/tmp/art/bleed'
const OUT = 'public/assets/raw'
mkdirSync(OUT, { recursive: true })

// ---- load raw RGBA, split components on empty alpha columns ----
async function loadRaw(path) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data, w: info.width, h: info.height }
}

function components({ data, w, h }) {
  const colHas = new Array(w).fill(false)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (data[(y * w + x) * 4 + 3] > 8) colHas[x] = true
  // group contiguous non-empty columns into spans
  const spans = []
  let start = -1
  for (let x = 0; x <= w; x++) {
    if (x < w && colHas[x]) {
      if (start < 0) start = x
    } else if (start >= 0) {
      spans.push([start, x - 1])
      start = -1
    }
  }
  // merge spans separated by < 6px (details like barrel tips)
  const merged = []
  for (const s of spans) {
    const last = merged[merged.length - 1]
    if (last && s[0] - last[1] < 6) last[1] = s[1]
    else merged.push([...s])
  }
  // bounding box per span
  return merged.map(([x0, x1]) => {
    let ymin = h, ymax = -1
    for (let y = 0; y < h; y++)
      for (let x = x0; x <= x1; x++)
        if (data[(y * w + x) * 4 + 3] > 8) {
          if (y < ymin) ymin = y
          if (y > ymax) ymax = y
        }
    return { x: x0, y: ymin, w: x1 - x0 + 1, h: ymax - ymin + 1 }
  }).filter(b => b.h > 4)
}

const mix = (c, target, t) => Math.round(c + (target - c) * t)

function tintRegion(data, box, w, accent, t) {
  for (let y = box.y; y < box.y + box.h; y++)
    for (let x = box.x; x < box.x + box.w; x++) {
      const i = (y * w + x) * 4
      if (data[i + 3] === 0) continue
      data[i] = mix(data[i], accent[0], t)
      data[i + 1] = mix(data[i + 1], accent[1], t)
      data[i + 2] = mix(data[i + 2], accent[2], t)
    }
}

function outlineRegion(data, box, w, h, color) {
  // 1px outline on transparent pixels adjacent to opaque ones
  const at = (x, y) => (y >= 0 && y < h && x >= 0 && x < w) ? data[(y * w + x) * 4 + 3] : 0
  const marks = []
  for (let y = box.y - 1; y <= box.y + box.h; y++)
    for (let x = box.x - 1; x <= box.x + box.w; x++) {
      if (at(x, y) > 8) continue
      if (at(x + 1, y) > 8 || at(x - 1, y) > 8 || at(x, y + 1) > 8 || at(x, y - 1) > 8) marks.push([x, y])
    }
  for (const [x, y] of marks) {
    const i = (y * w + x) * 4
    data[i] = color[0]; data[i + 1] = color[1]; data[i + 2] = color[2]; data[i + 3] = 255
  }
}

async function process(tankFile, name, hullH, turretH, accent) {
  const raw = await loadRaw(`${SRC}/${tankFile}_strip2.png`)
  const parts = components(raw)
  if (parts.length < 2) throw new Error(`${tankFile}: expected hull+turret, got ${parts.length} components`)
  parts.sort((a, b) => b.w * b.h - a.w * a.h)
  const [hullBox, turretBox] = parts // hull is the bigger mass

  // keep the WW2 steel/camo — class identity from a neon rim (CRT aesthetic),
  // a light hull cast so teams read at a glance, and a stronger turret tint
  const hullTint = name === 'player' ? 0.20 : 0.10
  tintRegion(raw.data, hullBox, raw.w, accent, hullTint)
  tintRegion(raw.data, turretBox, raw.w, accent, 0.28)
  outlineRegion(raw.data, hullBox, raw.w, raw.h, accent)
  outlineRegion(raw.data, turretBox, raw.w, raw.h, accent)

  const hull = await sharp(raw.data, { raw: { width: raw.w, height: raw.h, channels: 4 } })
    .extract({ left: hullBox.x, top: hullBox.y, width: hullBox.w, height: hullBox.h })
    .rotate(180) // barrels rendered pointing down; game sprites point up
    .resize({ height: hullH, kernel: 'lanczos3' })
    .png().toBuffer()
  const turret = await sharp(raw.data, { raw: { width: raw.w, height: raw.h, channels: 4 } })
    .extract({ left: turretBox.x, top: turretBox.y, width: turretBox.w, height: turretBox.h })
    .rotate(180)
    .resize({ height: turretH, kernel: 'lanczos3' })
    .png().toBuffer()

  writeFileSync(`${OUT}/${name}_base.png`, hull)
  writeFileSync(`${OUT}/${name}_turret.png`, turret)
  const hm = await sharp(hull).metadata(); const tm = await sharp(turret).metadata()
  console.log(`${name}: hull ${hm.width}x${hm.height} (${Math.round(hm.length ? hull.length / 1024 : 0)}B), turret ${tm.width}x${tm.height} (${Math.round(turret.length / 1024)}B)`)
}

// accent RGB from the locked palette
const CYAN = [0x4f, 0xf2, 0xe3], MAGENTA = [0xff, 0x4f, 0xd8], GOLD = [0xff, 0xd9, 0x4f], GREEN = [0x58, 0xff, 0x9b]

await process('T34', 'player', 40, 30, CYAN)
await process('Pz.Kpfw.IV-G', 'enemy1', 30, 22, MAGENTA)   // SCOUT — light
await process('Tiger-II', 'enemy2', 42, 30, GOLD)          // BRUISER — heavy
await process('KV-2', 'enemy3', 48, 40, GREEN)             // WARLORD — massive howitzer
console.log('done')
