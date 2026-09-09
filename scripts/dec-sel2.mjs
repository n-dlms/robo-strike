import { keccak256, toHex } from 'viem'
import { readFileSync } from 'node:fs'
const lines = readFileSync('/tmp/router-errors.txt', 'utf8').split('\n').filter(Boolean)
for (const c of lines) {
  const sel = keccak256(toHex(c)).slice(2, 10)
  if (sel === '98fcd788') console.log('*** MATCH:', c)
}
console.log('checked', lines.length, 'errors')
