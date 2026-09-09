import { keccak256, toHex } from 'viem'
import * as art from '../node_modules/.cache/local-vrf.mjs'
// pull every ABI the bundle exports and walk error entries properly
const abis = []
for (const k of Object.keys(art)) {
  const v = art[k]
  const scan = (x) => {
    if (!x) return
    if (Array.isArray(x)) x.forEach(scan)
    else if (typeof x === 'object' && x.type === 'error') abis.push(x)
  }
  scan(v)
}
console.log('errors found:', abis.length)
const target = '98fcd788'
let hit = null
for (const e of abis) {
  const sig = e.name + '(' + (e.inputs ?? []).map((i) => i.type).join(',') + ')'
  const sel = keccak256(toHex(sig)).slice(2, 10)
  if (sel === target) hit = sig
}
console.log(hit ? '*** MATCH: ' + hit : 'no match in router ABIs')
