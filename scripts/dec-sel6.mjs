import { verifyNetworkRouterAbi, ecvrfVerifierAbi, trustedOperatorEnclaveKeyVerifierAbi } from '/home/dlaminin/cjam/vendor/casino-sdk/local-verify-network/src/artifacts.ts'
import { keccak256, toHex } from 'viem'
const target = '98fcd788'
const all = [...verifyNetworkRouterAbi, ...ecvrfVerifierAbi, ...trustedOperatorEnclaveKeyVerifierAbi]
const errs = all.filter((x) => x.type === 'error')
for (const e of errs) {
  // try zero-arg version of EVERY error (some revert paths pass no args)
  const sig = e.name + '()'
  const sel = keccak256(toHex(sig)).slice(2, 10)
  if (sel === target) console.log('*** MATCH (zero-arg):', sig)
}
// also try every function name as error (unlikely) and the LocalCasinoHost zero-arg set
console.log('done, checked', errs.length)
