import sharp from 'sharp'
const SRC = '/tmp/art/bleed'
async function loadRaw(path) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data, w: info.width, h: info.height }
}
for (const t of ['T34', 'KV-2']) {
  const raw = await loadRaw(`${SRC}/${t}_strip2.png`)
  const { data, w, h } = raw
  const colHas = new Array(w).fill(false)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 8) colHas[x] = true
  const spans = []
  let start = -1
  for (let x = 0; x <= w; x++) {
    if (x < w && colHas[x]) { if (start < 0) start = x }
    else if (start >= 0) { spans.push([start, x - 1]); start = -1 }
  }
  console.log(t, 'w=' + w, 'spans:', JSON.stringify(spans))
}
