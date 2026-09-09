import { verifyNetworkRouterAbi } from '/home/dlaminin/cjam/vendor/casino-sdk/local-verify-network/src/artifacts.ts'
import { keccak256, toHex } from 'viem'
const target = '98fcd788'
// hash the two LocalTestToken errors + every no-arg name from LocalCasinoHost
const cands = [
  'LocalTestToken__InsufficientBalance(uint256,uint256)',
  'LocalTestToken__InsufficientAllowance(uint256,uint256)',
]
for (const sig of cands) {
  const sel = keccak256(toHex(sig)).slice(2, 10)
  if (sel === target) console.log('*** MATCH:', sig)
  else console.log(sel, sig)
}
console.log('done')
