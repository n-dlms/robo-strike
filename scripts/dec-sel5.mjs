import { keccak256, toHex } from 'viem'
const target = '98fcd788'
const variants = []
for (const name of ['CasinoGameFacet__BetRiskExceedsLimit', 'LocalCasinoHost__BetRiskExceedsLimit']) {
  const combos = [
    'uint256,uint256', 'uint256,uint256,uint256', 'uint128,uint128', 'uint256,int256',
    'address,uint256', 'uint256', 'uint256,uint64', 'uint96,uint256',
  ]
  for (const args of combos) variants.push(`${name}(${args})`)
}
for (const v of variants) {
  const sel = keccak256(toHex(v)).slice(2, 10)
  if (sel === target) console.log('*** MATCH:', v)
  else console.log(sel, v)
}
