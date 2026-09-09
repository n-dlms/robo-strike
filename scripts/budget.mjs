// Wire-budget check: prints gzipped sizes of the built dist; exits 1 over 1.2MB.
import { readdirSync, statSync, readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'

const dist = join(process.cwd(), 'dist')
const walk = (dir, base = '') => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f)
  return statSync(p).isDirectory() ? walk(p, base + f + '/') : [{ path: base + f, full: p }]
})
const files = walk(dist).filter((f) => !f.path.startsWith('assets/audio/'))
const initial = files.reduce((t, f) => t + gzipSync(readFileSync(f.full)).length, 0)
const sfx = walk(dist).filter((f) => f.path.startsWith('assets/audio/sfx_') && f.path.endsWith('.ogg'))
  .reduce((t, f) => t + gzipSync(readFileSync(f.full)).length, 0)
const music = walk(dist).filter((f) => f.path === 'assets/audio/music_loop.ogg')
  .reduce((t, f) => t + gzipSync(readFileSync(f.full)).length, 0)
console.log(`initial (JS+html+manifest+sprites):  ${(initial / 1024).toFixed(0)} KB gz`)
console.log(`preloaded sfx:                       ${(sfx / 1024).toFixed(0)} KB gz`)
console.log(`initial total (≤1229 KB budget):     ${((initial + sfx) / 1024).toFixed(0)} KB gz`)
console.log(`music (lazy, post-boot):             ${(music / 1024).toFixed(0)} KB gz`)
if (initial + sfx > 1229 * 1024) { console.error('BUDGET EXCEEDED'); process.exit(1) }
console.log('BUDGET OK')
