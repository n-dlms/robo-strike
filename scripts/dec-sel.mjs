import { keccak256, toHex } from 'viem'
const target = '98fcd788'
const candidates = [
  'InsufficientPortfolioReserve()', 'CasinoGameFacet__BetRiskExceedsLimit()', 'CasinoGameFacet__BetRiskExceedsLimit(uint256,uint256)',
  'LocalCasinoHost__BetRiskExceedsLimit()', 'LocalCasinoHost__InsufficientPortfolioReserve()',
  'ERC20InsufficientBalance(address,uint256,uint256)', 'LocalCasinoHost__InvalidRiskProbability()',
  'LocalCasinoHost__InvalidSessionCaps(uint256,uint256)', 'RoboStrikeGame__InvalidGameData()',
  'CasinoGameFacet__MaxBetExceeded()', 'LocalCasinoHost__MaxWagerExceeded(uint256)',
  'LocalCasinoHost__WagerTooHigh(uint256,uint256)', 'LocalCasinoHost__InsufficientLiquidity()',
  'LocalCasinoHost__BetExceedsVaultLimit()', 'LocalCasinoHost__InsufficientVaultLiquidity()',
]
for (const c of candidates) {
  const sel = keccak256(toHex(c)).slice(2, 10)
  console.log(sel === target ? '*** MATCH: ' + c : sel + ' ' + c)
}
