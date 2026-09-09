import { verifyNetworkRouterAbi, ecvrfVerifierAbi, trustedOperatorEnclaveKeyVerifierAbi } from '/home/dlaminin/cjam/vendor/casino-sdk/local-verify-network/src/artifacts.ts'
import { keccak256, toHex } from 'viem'
const target = '98fcd788'
const all = [...verifyNetworkRouterAbi, ...ecvrfVerifierAbi, ...trustedOperatorEnclaveKeyVerifierAbi]
const errs = all.filter((x) => x.type === 'error')
console.log('all errors:', errs.length)
for (const e of errs) {
  const sig = e.name + '(' + e.inputs.map((i) => i.type).join(',') + ')'
  const sel = keccak256(toHex(sig)).slice(2, 10)
  if (sel === target) console.log('*** MATCH:', sig)
}
console.log('done')
