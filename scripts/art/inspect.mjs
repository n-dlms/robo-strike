import sharp from 'sharp'
import { readdirSync } from 'node:fs'
for (const f of readdirSync('/tmp/art/bleed').filter(f => f.includes('strip'))) {
  const m = await sharp('/tmp/art/bleed/' + f).metadata()
  console.log(f, m.width + 'x' + m.height)
}
