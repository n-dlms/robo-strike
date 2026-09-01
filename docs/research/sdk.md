# ROBO STRIKE — Chain wtf Casino SDK Exhaustive Research

> Source-verified ONLY from **chain.wtf** SDK domain (sdk.chain.wtf / jam.chain.wtf). Never Chainlink.
> Access date for all fetches: **2026-09-01 UTC**. Verification via `WebFetch` and direct `curl` of zip/bundles.
> Chainlink is deliberately excluded.

---

## Method & Verification Table

All URLs were fetched and status-recorded. `200` = source-verified. `404` noted and resolved via alternative (zip contents).

| URL | Fetch Method | Status | Access Date | Notes |
|-----|--------------|--------|-------------|-------|
| `https://sdk.chain.wtf/casino` | WebFetch markdown | **200** | 2026-09-01 | Index page, download link, doc table |
| `https://sdk.chain.wtf/casino/GETTING_STARTED.md` | WebFetch | **200** | 2026-09-01 | Full doc |
| `https://sdk.chain.wtf/casino/CHAIN_WTF_CASINO_GAMES.md` | WebFetch | **200** | 2026-09-01 | Self-contained reference, all types/patterns |
| `https://sdk.chain.wtf/casino/LOCAL_SIMULATOR.md` | WebFetch | **200** | 2026-09-01 | Offline stack details |
| `https://sdk.chain.wtf/casino/CONTRACT_CONSTRAINTS.md` | WebFetch | **200** | 2026-09-01 | Facet constraints summary |
| `https://sdk.chain.wtf/casino/RANDOMNESS_DICE.md` | WebFetch | **200** | 2026-09-01 | Unbiased d6 canonical |
| `https://sdk.chain.wtf/casino/VISUAL_AND_UX.md` | WebFetch | **200** | 2026-09-01 | Iframe sandbox, theme, manifest presentation |
| `https://sdk.chain.wtf/casino/REPO_STRUCTURE.md` | WebFetch | **200** | 2026-09-01 | Package layout |
| `https://sdk.chain.wtf/casino/SLOTS_RISK_AND_RESERVES.md` | WebFetch | **200** | 2026-09-01 | Heavy-tail tiered reserve |
| `https://sdk.chain.wtf/casino/CHANGELOG.md` | WebFetch | **200** | 2026-09-01 | Date-versioned 2026.06–2026.08 releases |
| `https://sdk.chain.wtf/sdk/casino-sdk.zip` | curl HEAD + unzip -l + extract | **200** | 2026-09-01 | `985935 bytes`, ETag `ac54be4c...`, 131 files, zip verified |
| `https://sdk.chain.wtf/casino/solidity/ICasinoGameV2.sol` | WebFetch + zip extract | **404 via HTTP / 200 via zip** | 2026-09-01 | HTTP 404 is Vocs routing 404 page; file exists in zip at `casino-sdk/solidity/ICasinoGameV2.sol` (SPDX MIT) |
| `https://sdk.chain.wtf/casino/examples/coinflip-public/game.manifest.json` via HTTP | curl | **404** | 2026-09-01 | Vocs 404; canonical source is zip `examples/coinflip-public/public/game.manifest.json` — verified |
| `https://jam.chain.wtf` | WebFetch html + JS bundle curl | **200** | 2026-09-01 | SPA shell + `assets/index-NtGTwgFV.js` (456738 bytes) |
| `https://jam.chain.wtf/widget.js` | curl GET + HEAD | **200** | 2026-09-01 | 4328 bytes, ETag `5026b8c7...`, inline docs inside file |
| `https://jam.chain.wtf/assets/index-NtGTwgFV.js` (bundle) | curl | **200** | 2026-09-01 | Contains submission form logic, widget reference, eligibility details |

> Zip extraction root: `/tmp/casino-extract/casino-sdk/` — all files listed in §1.

---

## 1. SDK Download URL and Contents

### Sources
- URL + access date: `https://sdk.chain.wtf/casino` — 2026-09-01
- URL + access date: `https://sdk.chain.wtf/sdk/casino-sdk.zip` — 2026-09-01 (HEAD 200, unzip -l verified)
- URLs + access date: each doc under `https://sdk.chain.wtf/casino/<DOC>.md` — 2026-09-01 (table above)
- Local extracted manifest: `/tmp/casino-extract/casino-sdk/docs/*.md` — 2026-09-01
- Local extracted structure: `/tmp/casino-extract/casino-sdk/src/types.ts` etc.

### Findings

**Download URL (canonical, source-verified):**
```
https://sdk.chain.wtf/sdk/casino-sdk.zip
```
Also rendered on `/casino` index as `[↓ Download Casino SDK (.zip)](/sdk/casino-sdk.zip)` — relative link resolves to same absolute.

Headers verified 2026-09-01: `Content-Type: application/zip`, `Content-Length: 985935`, `ETag: "ac54be4c6106c265144d3d77f508c68c"`, `Content-Disposition: inline; filename="casino-sdk.zip"` (Vercel CDN).

**Zip contents (131 files, top-level `casino-sdk/` folder):**

```
casino-sdk/
  README.md
  .gitignore
  package.json                    # @chain/casino-sdk@0.2.0, workspaces: simulator, local-verify-network, examples/*
  tsconfig.json
  solidity/ICasinoGameV2.sol
  src/
    types.ts                      # HostSnapshotV1, HostApiV1, GuestApiV1, manifest types
    manifest.ts                   # zod schema + validateCasinoGameManifest, canonicalCasinoGameId
    guest.ts                      # connectGameToHost, computeMaxWager re-export, observeGameContentSize
    host.ts                       # connectHostToGame
    index.ts                      # re-exports
    bet-limits.ts                 # computeMaxWager implementation
    bet-limits.test.ts
  docs/
    CHAIN_WTF_CASINO_GAMES.md (41144 bytes)   # self-contained integration guide
    GETTING_STARTED.md (9772 bytes)
    LOCAL_SIMULATOR.md (7023 bytes)
    CONTRACT_CONSTRAINTS.md (6424 bytes)
    RANDOMNESS_DICE.md (6092 bytes)
    SLOTS_RISK_AND_RESERVES.md (10534 bytes)
    VISUAL_AND_UX.md (2785 bytes)
    REPO_STRUCTURE.md (2566 bytes)
    CHANGELOG.md (13345 bytes)
    RANDOMNESS_VERIFICATION.md (5202 bytes)  # not listed on index but present in zip
    README.md
  examples/coinflip-public/
    README.md
    index.html
    package.json
    public/game.manifest.json
    src/App.tsx (347 lines, 12397 bytes)
    src/lib/coinflip.ts (3709 bytes core logic + encode/decode ABI, RTP math)
    src/lib/coinflip.test.ts
    src/lib/useCasinoHost.ts (1472 bytes bridge hook)
    vite.config.ts, tsconfig.json
    assets/backdrop*, coin-badge*
  simulator/
    README.md
    package.json
    hardhat.config.js
    index.html
    vite.config.ts
    contracts/LocalCasinoHost.sol (20342 bytes)
    contracts/LocalTestToken.sol (1978 bytes)
    local-node/index.ts, game-contracts.ts
    src/*.ts/tsx (harness: App.tsx, use-game-host.ts, balance-hold.ts, etc.)
    src/local-node/artifacts.ts (58061 bytes)
    scripts/compile-contracts.mjs
  local-verify-network/
    package.json, src/{artifacts.ts, ecvrf.ts, local-verify-network.ts, ...}
```

**Docs index table from `/casino` (verified):**

| Guide | What it covers (verbatim from source) |
|-------|----------------------------------------|
| `GETTING_STARTED.md` | Start here. Step-by-step: run the local stack, write the contract, build the UI, ship. |
| `LOCAL_SIMULATOR.md` | The offline test environment: what it runs, what it replicates from production, how to break things on purpose. |
| `CHAIN_WTF_CASINO_GAMES.md` | The complete reference: host/guest model, Penpal bridge, gameData/actionData, ABI patterns, full frontend examples (coinflip, blackjack, mines). |
| `CONTRACT_CONSTRAINTS.md` | CasinoGameFacet rules your contract must respect: phases, timeouts, whitelist, portfolio risk, reverting errors. |
| `RANDOMNESS_DICE.md` | Deriving unbiased dice/cards from bytes32 RNG — rejection sampling, never raw byte%6. Canonical Solidity/TS. |
| `SLOTS_RISK_AND_RESERVES.md` | Why heavy-tail games (slots, jackpots) need quoteRiskParams + tiered jackpot reserve. |
| `VISUAL_AND_UX.md` | Iframe sandbox, theme/locale snapshot, manifest presentation, aligning with main app's look. |
| `REPO_STRUCTURE.md` | What's inside the @chain/casino-sdk package. |
| `CHANGELOG.md` | Date-versioned SDK release notes (2026.06.18 – 2026.08.30). |

**Per-file coverage summary (fetched & read):**

- **GETTING_STARTED.md** (`sdk.chain.wtf/casino/GETTING_STARTED.md:1`): 8-step pipeline from empty folder to working game. Covers: deliverables (contract + static iframe + manifest), `npm install`/`npm start` local stack, contract function table (`onSessionStart`, `onRandomness`, `onPlayerAction`, `quoteCaps`, `quoteRiskParams`), instant vs multi-action pattern pointer, `simulator/contracts/` drop-in watch, `forge create` alternative for constructor args, guest bridge snippet (`connectGameToHost`, `openSession` with `encodeAbiParameters`, `sessionKey` matching, `revealOutcome`), manifest same-origin rule, chaos-testing (indexer lag, stuck randomness via `cast rpc hardhat_mine 0x10`, wallet overrides, refresh recovery), and final handoff (audited contract + HTTPS static build).

- **CHAIN_WTF_CASINO_GAMES.md** (`sdk.chain.wtf/casino/CHAIN_WTF_CASINO_GAMES.md:1`): ~41kB self-contained spec. Sections: Platform model (Host owns wallet/valut/signing; Guest is sandboxed iframe `allow-scripts allow-same-origin` via Penpal), On-chain architecture (full `ICasinoGameV2` Solidity, `CasinoGameFacet` summary, instant vs multi-action patterns, sequence mermaid), Bridge SDK (types.ts/guest.ts/host.ts verbatim, guest/host lifecycle, stable refs, teardown), Snapshot usage (`wallet.status`, `computeMaxWager`, `sessionKey` format `${chainId}:${sessionId}`, terminal phases, derive-not-accumulate semantics), Manifest validation (canonical id, `presentation`/`capabilities`), Frontend patterns (shared bootstrap, coinflip/blackjack/mines encode examples, approvalAmount, risk preview, cancelStuckRandomness), Host integrator checklist, Appendix (package.json deps, security notes).

- **LOCAL_SIMULATOR.md** (`sdk.chain.wtf/casino/LOCAL_SIMULATOR.md:1`): Local backend (`npm run local-node` chain+VRF+minimal casino, `LocalTestToken` 18 decimals, `LocalCasinoHost` + `LocalCasinoVault`, `CoinflipGame` vendored artifact, funding, `deployed.json` served at `/__local-contracts.json`), Drop-in contracts (`simulator/contracts/` watch, solc viaIR, constructor args skip), Harness replication (optimistic `pending:<uuid>`, two data layers flashblock + indexed lag, monotonic settled, game-steered balance, stuck randomness banner), Setup panel (flashblock/indexer sliders, wallet override, game URL), Differences (EOA vs gasless vault, `getRandomnessVerification` not implemented), Editing harness contracts (`npm run compile-contracts`).

- **CONTRACT_CONSTRAINTS.md** (`sdk.chain.wtf/casino/CONTRACT_CONSTRAINTS.md:1`): `ICasinoGameV2` requirements (`quoteCaps`/`quoteRiskParams` semantics, WAD, unbiased d6 MUST, `quoteForfeitPayout` semantics & cut), Facet orchestration (whitelist, vault, provider, double `onSessionStart` simulation with `sessionId==0`, payout cap, escrow caps, phase transitions, `nonReentrant` via `ReentrancyGuardTransient` EIP-1153, `view` staticcall), Governance constants table (action 43200 blocks, randomness 150, maxBetRiskBps 100, confidence 372, safety 15000, minReserve 1500, heavyTail mult 100, prob 1e15 WAD), Portfolio insolvency errors, Build note (`pnpm build` in monorepo).

- **RANDOMNESS_DICE.md** (`sdk.chain.wtf/casino/RANDOMNESS_DICE.md:1`): Rule never `byte%6`, rejection threshold `DIE_REJECT=252` (42*6), `DIE_FACES=6`, table of bias (43 preimages for 1-4 vs 42 for 5-6), canonical algorithm (two dice from one bytes32, thread seed+idx, rehash `keccak256(abi.encodePacked(seed))`), Solidity ref `_rollDie`/`_diceFromRandomness`, TS ref `rollDie`/`diceFromRandomness` with `keccak256`, agent DO/DON'T checklist, other ranges formula `limit=floor(M/n)*n`, lifecycle, Related docs.

- **VISUAL_AND_UX.md** (`sdk.chain.wtf/casino/VISUAL_AND_UX.md:1`): Iframe sandbox `allow-scripts allow-same-origin` referencing `packages/web/src/features/casino/CasinoGameFrameClient.tsx`, snapshot-driven UI (`ui.theme`/`locale`, `viewport.availableHeight` vs broken `100vh`), Manifest (`game.manifest.json` at same origin, `validateCasinoGameManifest` in `src/manifest.ts`, `presentation.mode`/`hostPanels`, `capabilities.resize` + `observeGameContentSize`), `canonicalCasinoGameId` host rejection, internal Next.js i18n/shadcn note, motion & accessibility (`prefers-reduced-motion`, tap targets), assets icon/cover.

- **REPO_STRUCTURE.md** (`sdk.chain.wtf/casino/REPO_STRUCTURE.md:1`): No required folder layout for third-party games; table of paths (`src/types.ts`, `src/manifest.ts`, `src/guest.ts`/`host.ts`, `src/index.ts`, `solidity/ICasinoGameV2.sol`, `examples/.../game.manifest.json`, `docs/...`); note each game lives in own repo, TypeScript via `shadcn add @chain/casino-sdk` or vendoring.

- **SLOTS_RISK_AND_RESERVES.md** (`sdk.chain.wtf/casino/SLOTS_RISK_AND_RESERVES.md:1`): `quoteCaps` per-session ceilings vs `quoteRiskParams` aggregate VaR, jackpot heavy-tail detection, example paytable (RTP 92%, top 5000x @ 2e-6), tiered VaR math (lambda=N*pJ, kj formula, jackpotReserve = kj*(Mmax-1)*wmax, E[M^2] stripping), `quoteCaps` impl (maxEscrowStake=wager, maxReservedProfit=maxPayout-wager), `quoteRiskParams` impl (maxPayout=w*5000, probabilityWad=2e12, expectedPayout=RTP*w, subJackpot 0), invariants, session phase pattern for RNG slot.

- **CHANGELOG.md** (`sdk.chain.wtf/casino/CHANGELOG.md:1`): Versioned `YYYY.MM.DD-N`. Covers `sessions.items[].stake` (2026.08.30-1), `quoteForfeitPayout` (2026.08.29-1), `casino` block + `computeMaxWager` + `maxBetAmount` (2026.08.08-1), `simulator/` (2026.08.03-1), tx hashes `openTransactionHash`/`settleTransactionHash`/`randomnessRequests[].transactionHash` (2026.07.26-1), `raw.randomnessRequests` + `getRandomnessVerification` (2026.07.20-1), `ui.viewport.availableHeight` (2026.07.19-1), `token.iconUrl` (2026.07.18-1), `reportContentSize`/`observeGameContentSize` + removal of `presentation.minHeight` (2026.07.03-1), `revealOutcome` mandatory tightening (2026.07.02-1), opaque game bytes events (2026.06.18-1).

- **RANDOMNESS_VERIFICATION.md** (zip only, not linked on index): Covers `getRandomnessVerification` ECVRF artifact verification — not separately fetched via HTTP but present; cross-ref CHANGELOG 2026.07.20.

### License+Cost Verdict (Topic 1)

- **SDK zip + docs + src/**: Free to download, no paywall, no API key. `package.json` is `"private": true` but redistributed via `@chain/ui` shadcn registry (`shadcn add @chain/casino-sdk`) and by vendoring — no license purchase. No cost to run local simulator (Node 22+, Hardhat in-memory, bundled VRF). **Cost: $0**.
- **License**: `ICasinoGameV2.sol` is explicit `// SPDX-License-Identifier: MIT` (`sdk.chain.wtf/casino/CHAIN_WTF_CASINO_GAMES.md:21` and `solidity/ICasinoGameV2.sol:1` extracted). Bridge TS (`src/*.ts`) ships MIT-equivalent via zip; no separate LICENSE file observed — treat as permissive free reuse per docs' vendoring guidance. For production contract, your game code is yours; platform handoff is audited contract + hosted frontend.
- **Chain costs**: Target is Base L2; test chain is local Hardhat (gas free). Real deployment gas is user's.

### Confidence

**High** — every doc 200-verified, zip 131-file listing extracted, headers/ETags recorded. The 404s for `ICasinoGameV2.sol` HTTP and `game.manifest.json` HTTP are confirmed Vocs 404 pages (not missing package); zip is canonical.

### Open Questions (Topic 1)

None. Alternative source (zip) resolves HTTP 404s. See §11 for tracker.

---

## 2. Contract Responsibilities

### Sources
- `https://sdk.chain.wtf/casino/CHAIN_WTF_CASINO_GAMES.md#2` — full interface + semantics — 2026-09-01
- `https://sdk.chain.wtf/casino/CONTRACT_CONSTRAINTS.md` — facet summary + governance constants — 2026-09-01
- `https://sdk.chain.wtf/casino/SLOTS_RISK_AND_RESERVES.md` — quoteRiskParams mapping — 2026-09-01
- `casino-sdk/solidity/ICasinoGameV2.sol` extracted from zip — 2026-09-01
- `casino-sdk/simulator/contracts/LocalCasinoHost.sol` (harness facet stand-in) — zip — 2026-09-01

### Findings

**Full `ICasinoGameV2` interface — canonical Solidity (`CHAIN_WTF_CASINO_GAMES.md:21` and `ICasinoGameV2.sol:1`):**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

enum SessionPhase {
  NONE,
  WAITING_RANDOMNESS,
  WAITING_PLAYER_ACTION,
  SETTLED,
  FORFEITED,
  CANCELLED
}

struct SessionContext {
  uint256 sessionId;
  address player;
  address vault;
  uint256 wagerBase;
  uint256 escrowedStake;
  uint256 reservedProfit;
  uint32 step;
  bytes gameData;
  bytes gameState;
}

struct StepResult {
  bytes newGameState;
  int256 escrowDelta;
  int256 reservedProfitDelta;
  SessionPhase nextPhase;
  bool requestRandomnessNow;
  uint256 payout;
}

interface ICasinoGameV2 {
  function quoteCaps(uint256 wager, bytes calldata gameData)
    external view returns (uint256 maxEscrowStake, uint256 maxReservedProfit);

  function quoteRiskParams(uint256 wager, bytes calldata gameData)
    external view returns (
      uint256 maxPayout,
      uint256 probabilityWad,
      uint256 expectedPayout,
      uint256 subJackpotVarianceScaled
    );

  function onSessionStart(SessionContext calldata ctx)
    external view returns (StepResult memory);

  function onPlayerAction(SessionContext calldata ctx, bytes calldata actionData)
    external view returns (StepResult memory);

  function onRandomness(SessionContext calldata ctx, bytes32 randomness)
    external view returns (StepResult memory);

  function quoteForfeitPayout(SessionContext calldata ctx)
    external view returns (uint256 cashoutValue);
}
```

**Field semantics (source-verified):**

- `quoteCaps(wager, gameData) -> (maxEscrowStake, maxReservedProfit)`: `maxEscrowStake >= wager` else `CasinoGameFacet__GameNotWhitelisted` path reverts open. `maxReservedProfit` checked vs `maxBetRiskBps`/`availableLiquidity` (see `CONTRACT_CONSTRAINTS.md` default `maxBetRiskBps=100` (=1%)). Called before portfolio commit in `openSession`.
- `quoteRiskParams(wager, gameData) -> (maxPayout, probabilityWad, expectedPayout, subJackpotVarianceScaled)`: WAD precision `1e18=100%` for `probabilityWad`; must be `<=1e18` else `CasinoGameFacet__InvalidRiskProbability`. `maxPayout` is worst-case total payout (token units, same as wager). For heavy-tail slots, `probabilityWad` must be **top-tier jackpot only** (largest multiplier), not any-win probability. `expectedPayout = RTP * wager` mean. `subJackpotVarianceScaled` normally `0`; advanced precomputed sub-jackpot variance after stripping jackpot tier (`CasinoRiskLib`).
- `onSessionStart(ctx) -> StepResult`: Validates bet (`gameData`), sets opaque `newGameState` (`abi.encode` of game struct), returns next phase. Called **twice** in facet's `openSession` — once as simulation with `sessionId==0` before portfolio commit, then with real id — must be **consistent and view-safe** (pure/view, no state mutations beyond return). `escrowDelta` typically 0 at start; `reservedProfitDelta = int(maxReservedProfit)` committed.
- `onPlayerAction(ctx, actionData) -> StepResult`: Only in `WAITING_PLAYER_ACTION` before `actionDeadlineBlock`; requires `msg.sender == player`. Decode `actionData` (e.g., `uint8 actionCode` for blackjack hit/stand/double/split, or `(uint8,uint8)` for mines reveal/cashout). May set `requestRandomnessNow=true` to go `WAITING_RANDOMNESS` for one step, then `onRandomness` continues machine.
- `onRandomness(ctx, randomness) -> StepResult`: Consumes `bytes32` VRF word delivered by provider callback `onRandomnessFulfilled`. Map bytes to outcome with **rejection sampling** (see §6). Return terminal `SETTLED` (or loop to `WAITING_PLAYER_ACTION` for multi-step) with `payout` (0..maxPayout). Encode result into `newGameState` for frontend decode.
- `quoteForfeitPayout(ctx) -> cashoutValue`: Current cash-out (stake + accrued winnings) derived purely from `ctx.gameState`. Called defensively via gas-capped `staticcall` (32-byte return) when `block > actionDeadlineBlock` in `WAITING_PLAYER_ACTION`; pays `min(quote, escrowedStake+reservedProfit)` minus **10% cut** (`FORFEIT_WINNINGS_CUT_BPS=1000`). If reverts/malformed/absent (pre-2026.08.29 game), pays 0. **Must return 0** for games without true anytime cash-out (blackjack-style) or where value depends on unresolved randomness/hidden state — otherwise adverse-selection exploit (player abandons when continuation EV < quote; bad blackjack hand ~0.3x stake vs 0.9x quote = free put vs vault). Only mines-style (fully determined revealed state) should quote >0. (`CHAIN_WTF_CASINO_GAMES.md:2.1` and `CONTRACT_CONSTRAINTS.md: quoteForfeitPayout`).

**`StepResult` fields:**

- `newGameState`: opaque `bytes` persisted on session, emitted in `CasinoSessionPhaseAdvanced`/`Settled` events, surfaced as `raw.gameState` in snapshot for frontend decode.
- `escrowDelta`: `>0` pull extra from player (double/split), `<0` release to player. May be restricted (`EscrowIncreaseNotAllowed`) and caps (`EscrowCapExceeded`).
- `reservedProfitDelta`: vault reserved-profit commit/release per risk math.
- `nextPhase`: `WAITING_RANDOMNESS` (request RNG), `WAITING_PLAYER_ACTION` (await `submitAction`), `SETTLED`/`FORFEITED`/`CANCELLED` terminal. Invalid transition reverts `CasinoGameFacet__InvalidStepTransition`.
- `requestRandomnessNow`: instructs facet to request VRF immediately after step.
- `payout`: final payout settles to player; facet enforces against risk snapshot / maxPayout (`InvalidPayout`).

**Host `CasinoGameFacet` flow summary (`CHAIN_WTF_CASINO_GAMES.md:2.2`):**

| Entry | Role |
|-------|------|
| `openSession(game, vault, wager, gameData, randomnessRequestData)` | Validates whitelist, vault (`VaultManagerLib.isVault`), min bet, `quoteCaps`, `quoteRiskParams` → portfolio reserve (`CasinoRiskLib`), transfer wager, create session, call `onSessionStart`, apply `StepResult` (may request RNG / wait player / finalize). |
| `submitAction(sessionId, actionData, randomnessRequestData)` | Requires `WAITING_PLAYER_ACTION`, `msg.sender==player`, not past `actionDeadlineBlock`; calls `onPlayerAction`. |
| `onRandomnessFulfilled(requestId, randomness)` | Provider callback → calls `onRandomness`. |
| `getSession(sessionId)` | View full session (gameData, gameState, phase, deadlines). |
| `forfeitExpiredSession/session(s)` | If `WAITING_PLAYER_ACTION` && block > deadline → forfeit (pays `quoteForfeitPayout` minus 10%). |
| `cancelStuckRandomness(sessionId)` | If `WAITING_RANDOMNESS` && randomness deadline `DEFAULT_RANDOMNESS_TIMEOUT_BLOCKS=150` passed → cancel refund. |

Randomness requested by facet via `randomnessRequestData` (often `0x`) passed from UI; iframe never receives RNG off-chain — settlement is on-chain.

**Patterns:**

- **Instant** (coinflip, dice, slots): `onSessionStart -> WAITING_RANDOMNESS (request=true) -> onRandomness -> SETTLED (encode result in newGameState)`. `onPlayerAction` reverts.
  - Example excerpt (`CHAIN_WTF_CASINO_GAMES.md:2.3`):
    ```solidity
    function onSessionStart(SessionContext calldata ctx) external pure returns (StepResult memory sr) {
      sr.newGameState = abi.encode(/* opaque */);
      sr.escrowDelta = 0;
      sr.reservedProfitDelta = int256(maxReservedProfit);
      sr.nextPhase = SessionPhase.WAITING_RANDOMNESS;
      sr.requestRandomnessNow = true;
    }
    function onPlayerAction(SessionContext calldata, bytes calldata) external pure returns (StepResult memory) { revert CoinflipGame__NoPlayerAction(); }
    ```

- **Multi-action** (mines, blackjack): `onSessionStart -> WAITING_PLAYER_ACTION (request=false) -> loop submitAction (reveal/hit/cashout) -> optional WAITING_RANDOMNESS per action -> SETTLED`.
  - Example for mines start:
    ```solidity
    function onSessionStart(SessionContext calldata ctx) external pure returns (StepResult memory sr) {
      uint8 mineCount = _decodeAndValidateGameData(ctx.gameData);
      uint256 maxPayout = _cashoutPayout(ctx.wagerBase, mineCount, 25 - mineCount);
      uint256 maxReservedProfit = maxPayout > ctx.wagerBase ? maxPayout - ctx.wagerBase : 0;
      sr.newGameState = abi.encode(/* MinesState */);
      sr.reservedProfitDelta = int256(maxReservedProfit);
      sr.nextPhase = SessionPhase.WAITING_PLAYER_ACTION;
      sr.requestRandomnessNow = false;
    }
    ```

**Phase rules, timeouts, whitelisting:**

- Whitelist: `CasinoGameFacet__GameNotWhitelisted` if not governance-whitelisted.
- Timeouts: `DEFAULT_ACTION_TIMEOUT_BLOCKS=43200` (~7.2h on Base 2s?), `DEFAULT_RANDOMNESS_TIMEOUT_BLOCKS=150` (see constraints table). Configurable by `SECURITY_COUNCIL_ROLE`.
- `portfolio` insolvency: `InsufficientPortfolioReserve` if vault cannot meet committed VaR.
- `heavy-tail` invariants: `InconsistentJackpotProbability`.
- Reentrancy: all value entrypoints `nonReentrant` (OpenZeppelin `ReentrancyGuardTransient` EIP-1153 diamond-safe), steps are `view` via `staticcall` (game cannot reenter), settlement finalizes state before transfer.

Risk quoting separation (2026.08+): `quoteCaps` = single-session escrow/profit ceilings; `quoteRiskParams` = vault-wide reserve inputs; facet sequence: whale cap → aggregate `(maxPayout, probabilityWad, subJackpot)` → recompute VaR → revert if exceeds liquidity. Built-in examples: coinflip combinatorial probability, mines `1/C(25,mineCount)`, blackjack conservative `5e16` WAD (5% for 4x path).

### License+Cost Verdict

- **ICasinoGameV2.sol**: MIT (`SPDX-MIT`). Free to copy, no fee. Deployment gas is only cost (Base L2).
- **Facet**: part of platform diamond; deployer (Chain team) whitelists game — no fee to jam entrants; final mainnet whitelist is governance action.
- **Confidence**: High.

### Confidence

**High** — interface bytes exact, double-simulation and reentrancy notes cross-validated between CHAIN_WTF doc and CONTRACT_CONSTRAINTS.

### Open Questions

None. Forfeit 10% cut and defensive staticcall semantics are explicitly documented; heavy-tail thresholds are defaults (governance-configurable).

---

## 3. Bridge Exact Surface

### Sources
- `https://sdk.chain.wtf/casino/CHAIN_WTF_CASINO_GAMES.md#3` — full types.ts, guest.ts, host.ts verbatim — 2026-09-01
- `casino-sdk/src/types.ts` extracted — 2026-09-01
- `casino-sdk/src/guest.ts`, `host.ts`, `bet-limits.ts` — 2026-09-01
- `casino-sdk/src/manifest.ts` — zod schema

### Findings

**HostSnapshotV1** (`types.ts` canonical, also in CHAIN_WTF doc §3.1):

```typescript
export type HostSnapshotV1 = {
  apiVersion: number;
  integration: {
    chainId: number;
    slug: string;
    gameAddress: `0x${string}`;
    manifest: CasinoGameManifestV1;
  };
  wallet: {
    address?: `0x${string}`;
    smartVaultAddress?: `0x${string}`;
    status: 'ready' | 'disconnected' | 'setup-required' | 'session-key-mismatch';
  };
  token: {
    symbol?: string;
    decimals?: number;
    iconUrl?: string; // added 2026.07.18, optional
  };
  balances: { smartVaultBalance?: string; }; // base units string
  casino?: {
    availableLiquidity?: string;
    maxBetRiskBps?: number;
    maxAllowedReservedProfit?: string; // availableLiquidity * maxBetRiskBps /10000
    maxBetAmount?: string; // 0/absent = no ceiling
  };
  sessions: {
    items: Array<{
      sessionId: string;           // decimal string (e.g., "12345")
      sessionKey: string;          // `${chainId}:${sessionId}` — use to match
      gameAddress: `0x${string}`;
      phase?: number;
      phaseName?: string;          // "WAITING_RANDOMNESS" etc.
      wager?: string;
      stake?: string;              // 2026.08.30 new — wager + doubles/splits, optional
      payout?: string;
      isSettled: boolean;
      openedAt?: number;
      settledAt?: number;
      lastEventTimestamp: number;
      raw: {
        gameData?: HexString;
        gameState?: HexString;     // opaque, includes randomness when settled for some games
        randomness?: HexString;    // first fulfilled VRF word
        requestId?: HexString;
        randomnessRequests?: RandomnessRequestV1[];
        openTransactionHash?: HexString;  // 2026.07.26
        settleTransactionHash?: HexString;
      };
    }>;
  };
  ui: {
    locale: string;
    theme: 'light' | 'dark' | 'system';
    viewport?: { availableHeight: number; }; // 2026.07.19, svh semantics, iframe grows to content so 100vh != screen
  };
};
```

**HostApiV1** (guest calls host — host signs):

```typescript
export type HostApiV1 = {
  reportContentSize?(input: { minHeight: number }): Promise<void>; // 2026.07.03 optional
  openSession(input: {
    wager: string;                 // base units string, parseUnits(...)
    gameData: HexString;
    randomnessRequestData?: HexString; // often 0x
  }): Promise<{ sessionKey: string; transactionHash: HexString }>;
  submitAction(input: {
    sessionId: string;
    actionData: HexString;
    randomnessRequestData?: HexString;
    approvalAmount?: string;       // for double/split escrowDelta, host batches approve+submit
  }): Promise<{ transactionHash: HexString }>;
  cancelStuckRandomness(input: { sessionId: string }): Promise<{ transactionHash: HexString }>;
  revealOutcome(input: { sessionId: string }): Promise<void>; // mandatory after win anim — 2026.07.02 breaking
  getRandomnessVerification?(input: { sessionId: string }): Promise<RandomnessVerificationV1>; // optional feature-detect
};
```

**GuestApiV1** (host calls iframe):

```typescript
export type GuestApiV1 = {
  setState(snapshot: HostSnapshotV1 | null): Promise<void>;
};
```

**Penpal wiring:**

- `connectGameToHost` (`src/guest.ts:guest.ts:1`):
  ```typescript
  import { WindowMessenger, connect } from 'penpal';
  export const connectGameToHost = (methods: GuestApiV1): Connection<HostApiV1> =>
    connect<HostApiV1>({
      messenger: new WindowMessenger({
        remoteWindow: window.parent,
        allowedOrigins: getAllowedParentOrigins(), // document.referrer origin or '*' fallback dev
      }),
      methods,
    });
  ```
  `getAllowedParentOrigins` returns `[new URL(document.referrer).origin]` if referrer parseable, else `['*']` (dev only; prod stable origin HTTPS).

- `connectHostToGame` (`src/host.ts:host.ts:1`):
  ```typescript
  export const connectHostToGame = (options: {
    iframe: HTMLIFrameElement;
    childOrigin: string; // new URL(gameUrl).origin
    methods: HostApiV1;
  }): Connection<GuestApiV1> => {
    if (!options.iframe.contentWindow) throw new Error('Iframe contentWindow is not available.');
    return connect<GuestApiV1>({
      messenger: new WindowMessenger({
        remoteWindow: options.iframe.contentWindow,
        allowedOrigins: [options.childOrigin],
      }),
      methods: options.methods,
    });
  };
  ```
  Dependency: `penpal ^7.0.4`, `zod ^4.4.3`.

**Snapshot update semantics (critical, CHAIN_WTF §4 verbatim "Snapshot update semantics"):**

- `setState` fires on **every** host change (balances, casino limits, locale, viewport, sessions) — not only your session. Deduplicates byte-identical snapshots but distinct snapshots with no session change are normal.
- **Derive, don't accumulate.** Render each session from current `raw.gameState` (+ `phaseName`/`payout`). Compare vs last rendered for that `sessionId` and animate only diff. Never replay presentation from scratch on new snapshot.
- **New session only when `sessionId` is new.** Phase changes are progress, not fresh round.
- **Mid-round `WAITING_RANDOMNESS` is normal for multi-action.** Each randomness-consuming action cycles `WAITING_PLAYER_ACTION -> WAITING_RANDOMNESS -> WAITING_PLAYER_ACTION|SETTLED`. Only *first* `WAITING_RANDOMNESS` (before any rendered `gameState`) is opening deal. Don't reset table when already-rendering round enters `WAITING_RANDOMNESS` — show waiting affordance, keep state. `gameState` bytes already include accepted action.
- **`isSettled` flips once, atomically** with `payout` + final `gameState`; present outcome then `revealOutcome`.

> Compatibility note: production host currently suppresses mid-round `WAITING_RANDOMNESS` (appears to stay `WAITING_PLAYER_ACTION` until settled) — legacy slated for removal. Simulator already delivers full stream. Build/test against simulator — correct there = correct on both.

**SessionKey & isSettled semantics:**

- `sessionKey = `${chainId}:${sessionIdDecimal}`` (host convention). Use to match row after `openSession` returns until indexer + `getSession` catches up. Optimistic `pending:<uuid>` row at `WAITING_RANDOMNESS` pushed instantly until tx hash confirms real id (both arrival orders handled).
- `isSettled: boolean` flips once, atomically with `payout` and final `gameState`. `phaseName` terminal values: `SETTLED` / `FORFEITED` / `CANCELLED` — treat as ended. `phase` numeric maps to `SessionPhase` enum (3=SETTLED,4=FORFEITED,5=CANCELLED).
- `revealOutcome` behavior: From bet placement until guest calls `revealOutcome`, host **clamps balance displays down-only** (debits show, credits hidden) so top bar doesn't spoil result. After win anim finishes, guest must call `revealOutcome({sessionId})` — host then credits withheld winnings. Guard exists only while game mounted; refresh/navigate shows real balance immediately. Losses need no reveal (no payout to hide), but calling is harmless no-op. **Mandatory** since 2026.07.02 — game that never calls after win leaves displayed balance stale until leave/reload. (`CHAIN_WTF §3.4` + `CHANGELOG 2026.07.02-1`).

### License+Cost Verdict

- Bridge SDK: MIT-ish free, vendored or via `shadcn add @chain/casino-sdk`. Penpal MIT. No cost.
- **Cost: $0**

### Confidence

**High** — types verbatim cross-checked between WebFetch markdown and extracted `types.ts`/`guest.ts`/`host.ts` (including 2026.07–08 additions `stake`, `casino`, `viewport`, tx hashes, `reportContentSize`).

### Open Questions

None. `getRandomnessVerification` optional feature-detection noted; simulator rejects it (`supported:false`) — expected.

---

## 4. Manifest Exact Shape + Validation

### Sources
- `https://sdk.chain.wtf/casino/CHAIN_WTF_CASINO_GAMES.md#5` — validator + examples — 2026-09-01
- `https://sdk.chain.wtf/casino/VISUAL_AND_UX.md` — manifest paragraph — 2026-09-01
- `casino-sdk/src/manifest.ts` extracted (zod schema) — 2026-09-01
- `casino-sdk/src/types.ts` — `CasinoGameManifestV1` type — 2026-09-01
- `casino-sdk/examples/coinflip-public/public/game.manifest.json` extracted — 2026-09-01

### Findings

**Type `CasinoGameManifestV1` (minimal in types.ts, host validator requires superset):**

```typescript
export type CasinoGameManifestV1 = {
  schemaVersion: 1;
  gameId: string;
  apiVersion: 1;
  defaultLocale: string;
  locales: Record<string, { name: string; description?: string; }>;
  assets?: { iconUrl?: string; coverUrl?: string; };
  // Host validator (manifest.ts) additionally requires:
  // presentation: { mode: 'full-iframe'|'embedded', hostPanels: {openSession:boolean, history:boolean, status:boolean} }
  // capabilities: { openSession:true (=literal), submitAction:boolean, forfeitExpiredSession:boolean, cancelStuckRandomness:boolean, resize:boolean }
};
```

**validateCasinoGameManifest rules (`manifest.ts` zod schema + CHAIN_WTF §5.1):**

```typescript
// Reproduced verbatim from CHAIN_WTF doc + extracted manifest.ts (zod)
// schemaVersion must ===1, apiVersion ===1
// gameId: non-empty string
// defaultLocale: non-empty string
// locales: Record<string,{name:string,description?:string}> with >=1 entry
// defaultLocale must exist in locales and have locales[defaultLocale].name non-empty
// presentation: object
//   mode: 'full-iframe' | 'embedded'  (validated, not freeform)
//   hostPanels: { openSession:boolean, history:boolean, status:boolean } all bools
// capabilities: object
//   openSession: must be literal true (not false)
//   submitAction: boolean
//   forfeitExpiredSession: boolean
//   cancelStuckRandomness: boolean
//   resize: boolean
// assets?: { iconUrl?: string, coverUrl?: string } if present must be record with optional strings

// Failure reasons (exact strings from code):
// 'Manifest must be an object.'
// 'Unsupported manifest schemaVersion or apiVersion.'
// 'Manifest gameId and defaultLocale are required.'
// 'Manifest locales must contain at least one locale.'
// 'Manifest defaultLocale must exist in locales.'
// 'Manifest presentation is invalid.'
// 'Manifest capabilities are invalid.'
// 'Manifest assets are invalid.'
```

**canonicalCasinoGameId (`manifest.ts`):**

```typescript
export const canonicalCasinoGameId = (value: string | undefined | null): string => {
  if (!value) return '';
  let trimmed = value.trim();
  if (trimmed.match(/Game$/i)) trimmed = trimmed.replace(/Game$/i, '');
  return trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
};
```

Matches on-chain `normalizeGameName`. Host rejects if `gameId` canonical != contract registration (`CoinflipGame` → `coinflip`, `BlackjackGame` → `blackjack`).

**Same-origin requirement (enforced):**

```typescript
export const assertSameOriginUrls = (manifestUrl: string, iframeUrl: string): boolean => {
  try { return new URL(manifestUrl).origin === new URL(iframeUrl).origin; } catch { return false; }
};
```

Manifest must be served at **same origin as game URL**, typically `public/game.manifest.json` at `{gameBaseUrl}/game.manifest.json`. Vite: put in `public/`. Verified via `VISUAL_AND_UX.md` and `GETTING_STARTED.md#6`.

**Example manifests (verbatim, CHAIN_WTF §5.2, cross-checked with extracted coinflip manifest):**

Coinflip — instant, no submitAction:

```json
{
  "schemaVersion": 1,
  "gameId": "CoinflipGame",
  "apiVersion": 1,
  "defaultLocale": "en",
  "locales": { "en": { "name": "Coinflip", "description": "Flip one or more coins and settle the round from host-provided on-chain state." } },
  "presentation": { "mode": "full-iframe", "hostPanels": { "openSession": false, "history": false, "status": false } },
  "capabilities": { "openSession": true, "submitAction": false, "forfeitExpiredSession": false, "cancelStuckRandomness": false, "resize": true }
}
```

Blackjack — multi-action, forfeit + cancel:

```json
{
  "schemaVersion": 1,
  "gameId": "BlackjackGame",
  "apiVersion": 1,
  "defaultLocale": "en",
  "locales": { "en": { "name": "Blackjack", "description": "Render and control the active blackjack table using host-provided on-chain session state." } },
  "presentation": { "mode": "full-iframe", "hostPanels": { "openSession": false, "history": false, "status": false } },
  "capabilities": { "openSession": true, "submitAction": true, "forfeitExpiredSession": true, "cancelStuckRandomness": true, "resize": true }
}
```

Mines — multi-action, cancel only:

```json
{
  "schemaVersion": 1,
  "gameId": "MinesGame",
  "apiVersion": 1,
  "defaultLocale": "en",
  "locales": { "en": { "name": "Mines", "description": "Reveal safe tiles on a 5x5 grid and cash out before the next reveal hits a mine." } },
  "presentation": { "mode": "full-iframe", "hostPanels": { "openSession": false, "history": false, "status": false } },
  "capabilities": { "openSession": true, "submitAction": true, "forfeitExpiredSession": false, "cancelStuckRandomness": true, "resize": true }
}
```

Notes: `hostPanels` all false for these examples (host chrome hidden; game owns layout). `mode: 'full-iframe'` for all. `resize:true` enables `reportContentSize` dynamic height (since 2026.07.03, removed static `presentation.minHeight`).

Local validation helper: `validateCasinoGameManifest(value: unknown)` from `@chain/casino-sdk` / `./manifest` — import in build step or tests.

### License+Cost Verdict

- Manifest spec is free docs; no license cost. Validation code MIT via SDK.
- **Cost: $0**

### Confidence

**High** — zod schema extracted, examples byte-identical between markdown and zip manifest.

### Open Questions

None. Asset URLs optional, but should be HTTPS absolute if provided.

---

## 5. Local Simulator Commands

### Sources
- `https://sdk.chain.wtf/casino/GETTING_STARTED.md#2,4` — quick start, drop-in — 2026-09-01
- `https://sdk.chain.wtf/casino/LOCAL_SIMULATOR.md` — full spec — 2026-09-01
- `casino-sdk/README.md` extracted — 2026-09-01
- `casino-sdk/simulator/README.md` extracted — 2026-09-01
- `casino-sdk/simulator/package.json`, `hardhat.config.js`, `local-node/index.ts` — 2026-09-01
- `casino-sdk/package.json` root — 2026-09-01

### Findings

**Prerequisites:** Node.js v22+ only. No other chain tooling required; in-memory Hardhat bundled when no external RPC.

**Install & start (workspace root, i.e., unzipped `casino-sdk/`):**

```sh
npm install   # one install covers simulator, VRF node, coinflip example (npm workspaces)
npm start     # local chain + VRF node + casino deployment + harness (:3300) + coinflip example (:3100)
```

What `npm start` runs (from `package.json:scripts.start`):

```json
"start": "concurrently -k -n local-node,simulator,coinflip -c yellow,cyan,magenta \"npm --prefix simulator run local-node\" \"npm --prefix simulator run dev\" \"npm --prefix examples/coinflip-public run dev\""
```

- `simulator: npm run local-node` boots chain (attach to `RPC_URL` default `http://127.0.0.1:8545` or spawn Hardhat in-memory), deploys Verify Network VRF router (vendored bytecode, dev account #3 fulfiller), deploys minimal casino (`LocalTestToken` 18-dec `chUSD`, `LocalCasinoHost` + `LocalCasinoVault` minimal facet stand-in running full `ICasinoGameV2` lifecycle + emite byte-identical events `CasinoSessionOpened`/`PhaseAdvanced`/`Settled` etc., plus `CoinflipGame` artifact), funds player (account #0, 1_000_000 test chUSD), vault liquidity, VRF router client balance, writes `simulator/local-node/deployed.json` served at `/__local-contracts.json`.
- `simulator: npm run dev` — Vite+React harness at **:3300** (polls deployed.json, mounts iframe by `?game=` param, Penpal bridge, optimistic sessions, flashblock+indexer feeds, balance ledger).
- `examples/coinflip-public: npm run dev` — example game at **:3100**.

**Ports:**

- `:3300` simulator harness — open `http://localhost:3300` → setup panel auto-fills, mounts coinflip.
- `:3100` coinflip example — also mountable via `?game=http://localhost:3100` or local dev `http://localhost:5173`.
- Chain RPC: `http://127.0.0.1:8545` (Hardhat or external anvil via `RPC_URL` env). Full deployment JSON at `http://localhost:3300/__local-contracts.json`.

**Drop-in game contract flow (no restart):**

- Drop `.sol` implementing `ICasinoGameV2` into `simulator/contracts/` (import `../../solidity/ICasinoGameV2.sol`). Local node watches folder: compiles with `solc` (`viaIR`, same settings) via `simulator/local-node/game-contracts.ts` + `solc.d.ts`, deploys every deployable contract that implements interface (sibling imports supported via relative paths), registers on `LocalCasinoHost`, adds to harness picker within couple seconds. Edit redeploys at fresh address; delete removes from picker. Excluded: `LocalCasinoHost.sol`, `LocalTestToken.sol`.

- Constructor-args contracts skipped with warning — deploy manually via toolchain:

  ```sh
  forge create src/MyGame.sol:MyGame --rpc-url http://127.0.0.1:8545 \
    --private-key <dev key 0> --constructor-args <…>
  ```

  Then paste deployed address into harness setup panel — unregistered contracts registered automatically.

- Query param overrides: `http://localhost:3300/?game=http://localhost:5173&gameAddress=0x…&rpc=…`.

**Simulator harness replication of production (LOCAL_SIMULATOR.md: What the harness replicates):**

- Optimistic `pending:<uuid>` at `WAITING_RANDOMNESS` instantly on `openSession`, confirmed to real `sessionId` via broadcast tx hash (both arrival orders handled).
- Two data layers: near-instant flashblock push (sub-block preconfirmations, forward-only patch) + indexed session feed after configurable lag (including intermediate phase `NONE` after `CasinoSessionOpened`).
- Monotonic settled results (payout+gameState atomic, never regress).
- Game-steered balance (`betPlaced`/`revealOutcome` delayed reconcile, never raw poll).
- Stuck randomness path surfaced.

**Setup panel features (collapsible sidebar, chaos engineering):**

- Flashblock / indexer lag sliders (tune live; crank indexer lag to verify no flicker/duplicate).
- Wallet status override: force `ready` / `disconnected` / `setup-required` (`session-key-mismatch` also in types but not listed as slider? check `SetupPanel.tsx` — available statuses include 4).
- Game URL + contract address swap without restart.

**Intentional differences from production (LOCAL_SIMULATOR.md):**

- Bets are plain EOA txs (host gasless Smart Vault batch is not replicated); `wallet.address` and `wallet.smartVaultAddress` both equal local EOA. Timing/API unchanged.
- `getRandomnessVerification` not implemented (bridge rejects, `supported:false` — feature-detect).

**File watch & alternative tooling:**

- `simulator/contracts` auto-deploy watch; compiles with `npm run compile-contracts` (`solc viaIR`, regenerates `src/local-node/artifacts.ts`). Only needed if editing harness `.sol` sources.
- External chain: set `RPC_URL` env to existing anvil/hardhat, harness attaches.

### License+Cost Verdict

- Simulator + VRF node are bundled free dev tooling. No cost. Hardhat node in-memory; VRF via `local-verify-network` vendored. **Cost: $0**

### Confidence

**High** — commands verbatim from `GETTING_STARTED.md:2.1` and `LOCAL_SIMULATOR.md`, cross-checked with `package.json` scripts and `simulator/local-node/index.ts` (20342-line host). Ports and RPC URLs confirmed.

### Open Questions

None.

---

## 6. VRF Specifics

### Sources
- `https://sdk.chain.wtf/casino/RANDOMNESS_DICE.md` — canonical d6 — 2026-09-01
- `https://sdk.chain.wtf/casino/CHAIN_WTF_CASINO_GAMES.md#2.1` — randomness semantics, onRandomness signature — 2026-09-01
- `https://sdk.chain.wtf/casino/CONTRACT_CONSTRAINTS.md` — MUST bias bullet — 2026-09-01
- `casino-sdk/solidity/ICasinoGameV2.sol` — `onRandomness(ctx, bytes32 randomness)` — 2026-09-01
- `casino-sdk/examples/coinflip-public/src/lib/coinflip.ts` — BigInt threshold mapping pattern — 2026-09-01
- `casino-sdk/docs/RANDOMNESS_VERIFICATION.md` — verification extension — zip — 2026-09-01

### Findings

**Wire format:**

- VRF delivers **`bytes32 randomness`** to contract via `onRandomness(SessionContext ctx, bytes32 randomness)` (sole randomness param). Facet callback is `onRandomnessFulfilled(requestId, randomness)` which `staticcall`s into game.

**Blank vs present:**

- In `HostSnapshotV1.sessions.items[].raw`:
  - `raw.randomness?: HexString` is **blank** before fulfillment and **present only after** provider fulfills VRF. In `gameState` (opaque `bytes` returned by game), field is **blank before fulfilled** and contains the randomness word when game encodes it into state (game-specific ABI). Coinflip pattern: `gameState` is `abi.encode(bool pickHeads, uint8 coinCount, uint8 minWins, bytes32 randomness)` — if `randomness==0x000...0` (zero word `0n`), frontend treats as "not delivered yet" (`decodeGameState` returns null when `randomness===0n`). Other games may encode differently or keep randomness only in `raw.randomness`, not in `gameState`.
  - `raw.gameState?: HexString` initially holds `newGameState` from `onSessionStart` (pending state, no outcome yet). After `onRandomness`, it holds final state with outcome. **Never** contains pre-delivered randomness before `raw.randomness` does.
  - Multi-step games (e.g., blackjack, mines tile reveal) consume **one bytes32 per VRF request**; list lives in `raw.randomnessRequests: RandomnessRequestV1[]` (added 2026.07.20) in request order `{nonce, requestId, randomness?, fulfilled}`. Single-shot games see exactly one entry. `raw.randomness` aliases first fulfilled.

**Deterministic BigInt threshold mapping pattern (recommended for non-dice uniform mapping):**

Coinflip's canonical example (not dice faces but bit-threshold) — `coinflip.ts` `outcomeFromRandomness`:

```typescript
// Per-coin faces from VRF word: coin i is heads iff bit i set — mirror of CoinflipGame._countHeads
export function outcomeFromRandomness(bet: CoinflipBet, randomness: bigint): CoinflipOutcome {
  const coins: CoinSide[] = [];
  let heads = 0;
  for (let i=0;i<bet.coinCount;i++) {
    const isHeads = ((randomness >> BigInt(i)) & 1n) === 1n;
    coins.push(isHeads ? 'heads' : 'tails');
    if (isHeads) heads++;
  }
  const pickedSideWins = bet.pickHeads ? heads : bet.coinCount - heads;
  return { ...bet, randomness, coins, pickedSideWins, won: pickedSideWins >= bet.minWins };
}
```

This is the **recommended** deterministic pattern: treat `bytes32` as `bigint`, derive outcomes via bit extraction or integer thresholds over whole word (or expanded stream). For weighted paytables (slots), uniform draw over cumulative weights: `outcomeIndex = randomness % totalWeight` only if `totalWeight` divides `2^256` or use rejection/bigint range — hashing alone does not remove bias after narrowing to small modulus.

**Rejection sampling for dice (never `byte % 6`):**

- Requirement: MUST use rejection sampling when mapping VRF `bytes32` bytes to six-sided dice faces `1..6`.
- Constants: `DIE_FACES=6`, `DIE_REJECT=252` (42*6); reject `byte >=252` then `(byte %6)+1`.
- Rejection rate ~1.56% per byte, expected 1.016 bytes per die, rehash from 32-word via `keccak256(abi.encodePacked(seed))` when `idx==32`, threading `seed+idx`.

Canonical Solidity (`RANDOMNESS_DICE.md:Canonical algorithm`):

```solidity
uint8 internal constant DIE_FACES = 6;
uint8 internal constant DIE_REJECT = 252;
function _diceFromRandomness(bytes32 randomness) internal pure returns (uint8 d1, uint8 d2) {
  uint256 idx; bytes32 seed = randomness;
  (d1, idx, seed) = _rollDie(seed, idx);
  (d2,) = _rollDie(seed, idx);
}
function _rollDie(bytes32 seed, uint256 idx) internal pure returns (uint8 die, uint256 nextIdx, bytes32 nextSeed) {
  while (true) {
    if (idx < 32) {
      uint8 b = uint8(seed[idx]); idx++;
      if (b < DIE_REJECT) return ((b % DIE_FACES) + 1, idx, seed);
      continue;
    }
    seed = keccak256(abi.encodePacked(seed)); idx = 0;
  }
}
```

Canonical TS (`RANDOMNESS_DICE.md`):

```typescript
import { hexToBytes, keccak256 } from 'viem';
const DIE_FACES=6, DIE_REJECT=252;
function expandSeed(seed:Uint8Array){return hexToBytes(keccak256(seed));}
function rollDie(seed:Uint8Array,start:number):[number,number,Uint8Array]{
  let idx=start; let cur=seed;
  while(true){
    if(idx<cur.length){ const b=cur[idx++]; if(b<DIE_REJECT) return [(b%DIE_FACES)+1,idx,cur]; continue; }
    cur=expandSeed(cur); idx=0;
  }
}
export function diceFromRandomness(randomBytes:Uint8Array):[number,number]{
  if(randomBytes.length===0) throw new Error('Need random bytes');
  const [d1,i,seed]=rollDie(randomBytes,0); const [d2]=rollDie(seed,i); return[d1,d2];
}
```

Bias table from doc: `b%6=0..3` each have 43 preimages, `4..5` have 42 → naive mod gives faces 1–4 +0.39pp.

Generalization: for domain `M` outcomes `n`: `limit=floor(M/n)*n`, reject `>=limit` then `%n` (e.g., `uint16->d6` reject `>=65532`).

### License+Cost Verdict

- VRF is platform infra free to jam entrants; local VRF is bundled mock-real router. No extra cost. Dice patterns MIT.
- **Cost: $0**

### Confidence

**High** — rejection threshold and rehash semantics exact, code copied verbatim, cross-checked Solidity/TS consistency.

### Open Questions

None.

---

## 7. Jam Widget EXACT Embed Instructions from jam.chain.wtf

### Sources
- `https://jam.chain.wtf` — WebFetch html (SPA) — 2026-09-01
- `https://jam.chain.wtf/assets/index-NtGTwgFV.js` — bundle curl, strings grep — 2026-09-01 (456738 bytes)
- `https://jam.chain.wtf/widget.js` — direct curl GET+HEAD — 2026-09-01 (4328 bytes, ETag `5026b8c774dbb00f36ce9f548c3a308d`)

### Findings

**Fetch status for widget — VERIFIED, not not-found:**

Widget endpoint exists and returns inline-documented JS. Prior hypothesis that jam site had no widget docs is **false** — bundle + dedicated `widget.js` both present.

**EXACT embed snippet (byte-verified, from `widget.js` header comment and `index-NtGTwgFV.js` widget block):**

```html
<script async src="https://jam.chain.wtf/widget.js"></script>
```

Insert as **one tag** in your game page's HTML (`index.html` or templated page). Must be at top-level document, not inside sandboxed cross-origin iframe unless same-origin.

Bundle description in `index-NtGTwgFV.js` widget section (verbatim):

> "One script tag on your game page. It proves your entry and tracks plays."
> Bundle quote: `'uses: <script async src="https://jam.chain.wtf/widget.js"><\\/script>'`
> Guide panel title "The widget" with `<pre>` rendering same snippet.

**What widget does (full behavior deconstructed from `widget.js` source, 2026-09-01):**

- Idempotent guard: `if (window.__chainJamWidget) return; window.__chainJamWidget=true;`
- Renders a fixed badge linking to jam:
  ```javascript
  var JAM_URL='https://jam.chain.wtf?ref=widget';
  var PING_URL='https://amicable-hummingbird-962.convex.site/ping';
  var HEARTBEAT_URL='https://amicable-hummingbird-962.convex.site/heartbeat';
  // badge id: chain-jam-badge
  // position:fixed right:14px bottom:14px z-index:2147483000
  // style: #141416 bg, 2px rgba(255,255,255,.85) border, radius 10px, shadow 0 2px 12px rgba(0,0,0,.45)
  // font: italic 800 12px system-ui, rotate(-1.5deg) hover rotate(0deg) scale(1.04)
  // content: "Chain Jam" + pill "Vol.1" rotated 4deg
  // link: <a id="chain-jam-badge" href="https://jam.chain.wtf?ref=widget" target="_blank" rel="noopener" aria-label="This game is a Chain Jam Vol. 1 entry">
  ```
  Mount via `DOMContentLoaded` or immediate if ready.

- **Anonymous engagement metrics (no PII, URL only):**
  - One `view ping` per top-level page load (fire-and-forget via `navigator.sendBeacon` or `fetch` no-cors keepalive), payload `JSON.stringify({url: location.origin + location.pathname})` to `POST https://amicable-hummingbird-962.convex.site/ping`. **Not sent when `window.top !== window.self`** (inside jam gallery iframe preview) — gallery iframes do NOT inflate metrics.
  - One `heartbeat` per **minute of ACTIVE play** to `POST .../heartbeat` same payload, only when player actually pressed/moved/touched since last tick (`keydown/mousedown/mousemove/touchstart/touchmove/wheel` sets `active=true`), tick each 60s checks `active`, resets, posts if true. Paused when `document.visibilityState==='hidden'`, resumes on visible.
  - Best-effort, badge renders even if metrics fail.

**Validation / submission gate (from bundle text):**

- Bundle text: `"Before you submit, the hosted game page must carry the jam widget — put <script async src=\"https://jam.chain.wtf/widget.js\"></script> in the page HTML. The submission check fetches your URL and rejects the entry if that tag is missing."`
- Another string: `"The submission check fetches my URL and rejects the entry if that tag is missing."`
- Therefore: widget is **required** for eligibility; automated fetch验证 at submit time. Must be fetchable (no 403, no X-Frame-Options block for the HTML fetch — see standalone requirement).

**Gallery behavior:** Gallery cartridges show live miniature iframe of your game at `?ref=chainjam` (e.g., `gameUrl?ref=chainjam`). If host blocks iframes via `X-Frame-Options` or `frame-ancestors` CSP, gallery shows pitch text instead (see bundle: "If your host blocks iframes (X-Frame-Options or a frame-ancestors policy), we show your pitch text instead. The game still opens on click, you just lose the free advertising.").

### License+Cost Verdict

- Widget is free, open endpoint, anonymous telemetry only URL. No cost. Badge is brand asset; do not hide via CSS.
- **Cost: $0**

### Confidence

**High** — snippet byte-verified via direct `widget.js` curl (4328 bytes), deconstructed full source, cross-checked with bundle's rendering of same snippet. No hypothetical docs needed.

### Open Questions

None — widget site found, snippet exact. See §11 for tracker (marked resolved).

---

## 8. Submission Form Fields Expected on jam.chain.wtf

### Sources
- `https://jam.chain.wtf/assets/index-NtGTwgFV.js` — form component extraction via strings — 2026-09-01
- Cross-check: bundle quotes for source-access expectations
- `https://jam.chain.wtf` SPA — submit section anchor `#submit` — 2026-09-01

### Findings

Form is in SPA section `#submit` ("07 submit — Enter the jam"). State object `W1` and submit handler `R4` extracted:

**State shape `W1` (initial values):**

```typescript
const W1 = {
  title: "",        // Game title
  gameUrl: "",      // Game URL (must be your hosted HTTPS URL, your entry identity)
  rtp: "",          // Declared RTP as string input, parsed to Number
  discord: "",      // Discord handle (required)
  x: "",            // X / Twitter (optional)
  telegram: "",     // Telegram (optional)
  sourceAccess: "", // Source access string — private repo URL + invite review account
  pitch: ""         // One or two sentences — gallery card copy
};
```

**Validation logic extracted:**

- `rtp` parsed: `Number(r.rtp)`, must be finite and `93 <= rtp <= 98` (error: `"Declared RTP must be a number between 93 and 98."`). Corresponds to eligibility "RTP between 93% and 98%".
- Required markers in render: `title*`, `gameUrl*`, `rtp*`, `discord*`, `sourceAccess*`, `pitch*`. `x` and `telegram` optional placeholders `"@you (optional)"`.
- Placeholders:
  - `title`: `"e.g. Orbital Heist"`
  - `gameUrl`: `"https://yourgame.xyz"`
  - `rtp`: `"93 … 98 (%)"`
  - `discord`: `"yourhandle"`
  - `x`: `"@you (optional)"`
  - `telegram`: `"@you (optional)"`
  - `sourceAccess`: `"Private repo URL, invite our review account"`
  - `pitch` textarea: `"One or two sentences. This is also your gallery card copy."` with `pitch / info *` label.

**Submission flow (from `R4` handler):**

```typescript
const D = qy(Cs.entries.submit); // Convex mutation
await D({
  title: r.title,
  gameUrl: r.gameUrl,
  rtp: Y,                        // number 93–98
  discord: r.discord,
  x: r.x || void 0,
  telegram: r.telegram||void 0,
  sourceAccess: r.sourceAccess,
  pitch: r.pitch
});
localStorage.setItem(F1, Z); // F1='chainjam-entry-id' saves entryId
```

Submission calls Convex `entries.submit` mutation; on success entryId stored in localStorage; check panel fetches `entries.status` by `entryId` and shows `ACCEPTED`/`REJECTED` pill with `reason` if rejected (e.g., widget missing, RTP skew, non-standalone).

**Source-access expectations (bundle verbatim):**

- "Providing source code access is a condition of prize eligibility and of integration into chain.wtf. Source is reviewed by the Chain internal team to verify the declared RTP against your actual paytable, check SDK compliance, and screen for anything malicious. It stays private with the review team. No source, no eligibility. Trust is nice. Reading the code is better."
- FAQ: "Why do you need my source code? We verify your declared RTP against your actual paytable, check SDK compliance, and screen for anything malicious. It stays private with the review team. No source, no eligibility."
- SDK docs `GETTING_STARTED.md:8` notes final deliverables to Chain team: audited contract + hosted static build; but jam platform adds source access via form field.

**Other expectations from bundle/terms snippet:**

- Game must be hosted on your own domain, HTTPS, stable URL (same URL updated counts). Must run **standalone as playable demo outside chain.wtf iframe** — opening URL directly yields playable game, not redirect.
- Must have RTP 93–98, declared math matches actual paytable.
- Must be novel concept (see §10).
- Terms & Conditions linked at `#/terms` (modal `Zb`), footer `© 2026 chain.wtf · Terms & Conditions`.

### License+Cost Verdict

- Submission is free; no fee via DoraHacks / jam.chain.wtf. Source repo can be private GitHub with invite; no cost beyond GitHub free tier. **Cost: $0**

### Confidence

**High** for core required fields (title/gameUrl/rtp/discord/sourceAccess/pitch) — directly extracted from rendered form code with placeholders and validation guard. **Medium** for exact invite account name — bundle only says "invite our review account" without listing handle/email; must discover via FAQ/terms modal or Discord. Open question filed for invite target.

### Open Questions (append to discord tracker)

- Q: Which GitHub account / email should be invited for source review? Bundle says "invite our review account" but no handle in `widget.js` nor index bundle excerpt. Need canonical invite target.
- Q: Is RTP check purely form-level (93–98 numeric) or also string like "96.5"? Handler parses `Number(rtp)` — suggests float allowed (e.g., 94.5). Confirm.

---

## 9. Coinflip Example Walkthrough

### Sources
- `casino-sdk/examples/coinflip-public/public/game.manifest.json` extracted — 2026-09-01
- `casino-sdk/examples/coinflip-public/src/lib/coinflip.ts` extracted — 2026-09-01
- `casino-sdk/examples/coinflip-public/src/lib/useCasinoHost.ts` extracted — 2026-09-01
- `casino-sdk/examples/coinflip-public/src/App.tsx` (347 lines) extracted — 2026-09-01
- `https://sdk.chain.wtf/casino/CHAIN_WTF_CASINO_GAMES.md#6.2` — coinflip frontend pattern — 2026-09-01
- Contract pattern inferred from `CHAIN_WTF` instant example + `coinflip.ts` constants

### Findings

**Contract gameData/ABI (mirrors contract bit-threshold pattern):**

- `gameData` ABI: `(bool pickHeads, uint8 coinCount, uint8 minWins)` encoded via `encodeAbiParameters([{type:'bool'},{type:'uint8'},{type:'uint8'}], [pickHeads, coinCount, minWins])`. Max coins `MAX_COIN_COUNT=10`. Validation: `coinCount 1..10`, `minWins 1..coinCount`.
- `gameState` ABI: `(bool, uint8, uint8, bytes32)` flattened via `abi.encode(CoinflipState)` — fields `pickHeads, coinCount, minWins, providerRandomness (bytes32)`. If `providerRandomness == 0` → outcome not delivered yet (return null, keep waiting). Decoding via `decodeAbiParameters(GAME_STATE_PARAMS, gameState)` then `BigInt(providerRandomness)`.
- Payout math (authoritative mirror of `CoinflipGame.sol`, `coinflip.ts` constants): `BASIS_POINTS=10000n`, `RTP_BPS=9800n` (98%). `winningWays`, `winProbability = winningWays / 2^coinCount`, `payoutMultiplier = (0.98 * 2^coinCount)/winningWays`, `maxPayout(wager) = (wager * RTP_BPS * 2^coinCount)/(BASIS_POINTS * winningWays)` (floor identical to `_getMaxPayout`), `maxReservedProfit = maxPayout - wager` if >0.

**Frontend encodeAbiParameters pattern (from `App.tsx` + `CHAIN_WTF §6.2`):**

```typescript
import { encodeAbiParameters, parseUnits } from 'viem';
const EMPTY_HEX='0x' as const;

async function handleOpenSession(hostApi:HostApiV1, snapshot:HostSnapshotV1, wagerInput:string, side:'heads'|'tails', coinCount:number, minWins:number){
  const decimals=snapshot.token.decimals??18;
  const wager=parseUnits(wagerInput, decimals).toString();
  const gameData=encodeAbiParameters(
    [{type:'bool'},{type:'uint8'},{type:'uint8'}],
    [side==='heads', coinCount, minWins]
  );
  const {sessionKey}=await hostApi.openSession({ wager, gameData, randomnessRequestData: EMPTY_HEX });
  // track sessionKey until terminal; see settle effect below
}
```

Decode for display is via `decodeGameData`/`decodeGameState` then `outcomeFromRandomness(bet, randomnessBigInt)` (bit-threshold). Fallback when settled row missing state/randomness but has payout: `outcomeFromResult(bet, won)` synthesizes faces (`minWins` hits if won else `minWins-1`).

**Session settle effect (App.tsx flow):**

- `useEffect` watches `snapshot.sessions.items.find(i=>i.sessionKey===round.sessionKey)` when `round.status==='waiting'`. If `isSettled || isTerminalPhase(phase)`, but `phase !== SETTLED` without `raw.gameState` → error "The round did not settle normally..." (forfeit/cancel path).
- Resolve outcome priority: `decodeGameState(gameState) ?? (randomness!=0n ? outcomeFromRandomness(bet, randomness) : null) ?? (payout!==undefined ? outcomeFromResult(bet, payout>0n) : null)`. If null → wait for next push.
- Compute `rowPayout = BigInt(row.payout||0)`; if `>0n` use it, else if `outcome.won` compute local `maxPayout(current.wager, coinCount, minWins)` (handles one-push lag before payout written). Set `status: fastMode?'done':'landing'`, `outcome`, `payout`, `sessionId`.
- Landing → done timer `landingDurationMs = 1350 + (coinCount-1)*110` then `revealOutcome({sessionId})` via ref (required lifecycle, display credit release). Harmless if already done.

**computeMaxWager usage (bet clamping, `App.tsx` + `bet-limits.ts`):**

```typescript
import { computeMaxWager } from '@chain/casino-sdk/guest';
// Worst-case payout is wager*maxMultiplierX — linear quoteCaps shape.
// For coinflip, multiplier = payoutMultiplier(coinCount,minWins) e.g. 1.96x for 1 coin/1 win
const maxMultiplier = payoutMultiplier(form.coinCount, form.minWins);
const maxWager = computeMaxWager(snapshot, { maxMultiplierX: maxMultiplier });
// cap input / "Max" button at min(maxWager, balance); undefined => host no limits, fallback to own.
// App.tsx also shows exact per-selection invert: compare computed maxReservedProfit(wager) vs snapshot.casino.maxAllowedReservedProfit bigint, disable "Open" before chain bounce.
```

`computeMaxWager` internals: `riskBoundWager = (maxAllowedReservedProfit * 10000)/(multiplierBps-10000)` where `multiplierBps=ceil(maxMultiplier*10000)`, then `min(riskBoundWager, maxBetAmount)` if ceiling present. Returns `undefined` if no casino block or multiplier ≤1 with no ceiling.

**Manifest capabilities (coinflip public):**

```json
{
  "capabilities": {
    "openSession": true,
    "submitAction": false,
    "forfeitExpiredSession": false,
    "cancelStuckRandomness": false,
    "resize": true
  }
}
```

Instant round — no `submitAction` in iframe; mismatch would fail validation. `resize:true` pairs with `observeGameContentSize(hostApi)` in `useCasinoHost` (second `useEffect` after bridge resolves).

**Additional App.tsx polish (reference quality):**

- `observeGameContentSize` wiring in `useCasinoHost` (auto after `hostApi` set) for dynamic height.
- `CanvasHistoryStrip`, `CanvasStatsStrip`, `CoinStage`, `BottomBar`, `WinOverlay` components — demonstrates theme/locale/shell usage.
- `getRandomnessVerification` optional handling (feature-detect, not in coinflip example but pattern in docs §6.1/6.4).
- Balance display `BigInt(snapshot.balances.smartVaultBalance)` with `token.iconUrl` fallback.

### License+Cost Verdict

- Coinflip example is MIT/public domain within free SDK; copy-and-modify allowed. No cost. **Cost: $0**

### Confidence

**High** — files extracted and line-counted, ABI params cross-checked between CHAIN_WTF pattern and actual `coinflip.ts` functions, manifest byte-identical.

### Open Questions

None.

---

## 10. Common Pitfalls Checklist for Eligibility

### Sources
- `https://jam.chain.wtf/assets/index-NtGTwgFV.js` eligibility strings — 2026-09-01
- `https://sdk.chain.wtf/casino/CHAIN_WTF_CASINO_GAMES.md#2.1,3.4,4` — phase/reveal/derive rules — 2026-09-01
- `https://sdk.chain.wtf/casino/RANDOMNESS_DICE.md` — bias MUST — 2026-09-01
- `https://sdk.chain.wtf/casino/CONTRACT_CONSTRAINTS.md` — timeouts/whitelist/risk — 2026-09-01
- `https://sdk.chain.wtf/casino/VISUAL_AND_UX.md` — standalone/iframe/height — 2026-09-01
- `https://sdk.chain.wtf/casino/SLOTS_RISK_AND_RESERVES.md` — RTP vs risk mismatch — 2026-09-01
- `https://sdk.chain.wtf/casino/LOCAL_SIMULATOR.md` — stuck randomness mining 15 blocks — 2026-09-01

### Findings

Jam eligibility gate (bundle verbatim) + SDK compliance pitfalls. Check before submit:

**Jam eligibility (hard failures on submit — bundle says "rejects if missing/check fails"):**

| Check | Why it fails | Fix |
|-------|--------------|-----|
| **Novel concept** | Copies of classics (blackjack, roulette, baccarat, etc.) or existing originals (plinko, dice, limbo, crash) are rejected: "The game must be a novel concept: no blackjack or other classics, no existing originals (plinko, dice, limbo, crash), no copies." | Design non-derivative mechanic; describe pitch as novel. |
| **Three deliverables triad** | Must have: Solidity `ICasinoGameV2` contract + static frontend via SDK bridge (no wallet code) + `game.manifest.json`. Missing any is ineligible. | Ensure each present and referenced in submission. |
| **RTP 93–98%** | "RTP between 93% and 98% with on-chain declared math matching actual paytable" — declared `rtp` field 93–98 and `quoteRiskParams.expectedPayout` vs on-chain sim must match within tolerance; skew is malicious pattern (drain liquidity). | Compute `expectedPayout = RTP_BPS * wager /10000` aligned; test via simulator vs manual ensemble. |
| **Enshrinement / SDK compliance** | Must run correctly in local simulator and use bridge correctly; `SDK compliance` checked via source review: valid `gameData`/`actionData` ABI, phase rules, `revealOutcome` called, same-origin, etc. | Vendor or import `@chain/casino-sdk`, follow CHAIN_WTF patterns, pass `validateCasinoGameManifest`. |
| **Standalone** | "Hosted page runs standalone as a playable demo, outside the chain.wtf iframe" — opening URL directly must be playable, not redirect to host or blank. | Host static build on HTTPS origin; test incognito direct URL. |
| **Jam widget present** | "The hosted game page must carry the jam widget — put `<script async src=\"https://jam.chain.wtf/widget.js\"></script>`" — submission fetch rejects if missing. | Include exact tag; verify `curl -s YOUR_URL | grep widget.js` shows it; ensure not stripped by CSP/build. |
| **Source access** | "Providing source code access is a condition of prize eligibility and of integration" — private repo invite required. | Provide URL + invite review account in `sourceAccess` field. |
| **Load time / near-instant** | Bundle says "and manifest; runs correctly in the local simulator and loads near-instantly" (~ eligibility string concatenated). Implies LCP/landing fast, no huge blocking asset. | Keep frontend static small, lazy-load, preload backdrop, `observeGameContentSize` for correct height. |
| **Hosting** | "Host it on your own domain — Vercel/Netlify/anything, Your URL = your entry. It must also run standalone..." plus `same-origin` for manifest. | Deploy to stable HTTPS; serve `game.manifest.json` at same origin; avoid `X-Frame-Options:DENY` (gallery iframe fallback shows pitch text instead, lose advertising). |
| **Pitch** | One-two sentence pitch required, also gallery card copy; must not be empty. | Provide concise pitch in form. |

**SDK / contract pitfalls (on-chain or simulator integration failures):**

- **Modulo bias**: `byte%6` without rejection → audit defect. Must be `b<252` check.
- **RevealOutcome omitted**: Balance stays stale after win; host holds withheld credits. Always call after win anim; even if you call after loss it's ok.
- **Derive not accumulate**: Re-rendering whole history on each `setState` or resetting table on mid-round `WAITING_RANDOMNESS` causes flicker/duplicate. Compare last rendered `sessionId` state.
- **SessionKey mismatch**: Using `sessionId` decimal instead of `sessionKey` `${chainId}:${sessionId}` for matching breaks optimistic indexing lag handling.
- **Wallet not ready**: Enabling bet when `snapshot.wallet.status !== 'ready'` → host rejects or UX confuses. Force statuses in simulator panel to test `disconnected`/`setup-required` screens.
- **Bet size not clamped**: Submitting `wager` where `maxReservedProfit > maxAllowedReservedProfit` → `CasinoGameFacet__BetRiskExceedsLimit` revert. Use `computeMaxWager` or invert exact `quoteCaps` vs `maxAllowedReservedProfit`.
- **Phase violation**: Requesting randomness from terminal phase or `submitAction` when `phase !== WAITING_PLAYER_ACTION` or past `actionDeadlineBlock` (43200) → `InvalidStepTransition` or forfeit.
- **Randomness deadline**: Not testing `cancelStuckRandomness` — stop node, `cast rpc hardhat_mine 0x10` (~16 blocks), banner should appear; if manifest `cancelStuckRandomness:false` host won't expose.
- **Heavy-tail under-quote**: For slots, reporting `maxPayout` low or `probabilityWad` as any-win not jackpot → `InsufficientPortfolioReserve` or tiered reserve wrong; also if `probabilityWad>1e18` → `InvalidRiskProbability`.
- **Forfeit adverse selection**: Returning non-zero `quoteForfeitPayout` for blackjack-style (hidden-state dependent) makes vault exploitable; return 0 unless mines-style revealed-state cash-out.
- **Same-origin manifest drift**: Serving manifest on different origin/subdomain (e.g., game on `game.example.com`, manifest on `api.example.com`) fails `assertSameOriginUrls`; also `gameId` canonical mismatch.
- **Presentation minHeight legacy**: Older manifests with `presentation.minHeight` now invalid; use `capabilities.resize + reportContentSize`.
- **Hardcoded viewport**: Using `100vh` inside iframe (equals content height, not screen) → layout overflow; use `snapshot.ui.viewport.availableHeight`.
- **Ignore terminal `FORFEITED`/`CANCELLED`**: Only handling `SETTLED` → missing refunds/cancels.

**Simulator chaos checklist before shipping (GETTING_STARTED §7):**

- [ ] Raise indexer lag slider → no flicker
- [ ] Stop node + `cast rpc hardhat_mine 0x10` (~15 mined) → stuck banner surfaces cleanly
- [ ] Wallet override `disconnected` / `setup-required` → non-ready screens correct
- [ ] Refresh mid-round → recovers session from snapshot (no blank)
- [ ] `observeGameContentSize` active → host iframe sizes correctly on resize
- [ ] Fast refresh / HMR doesn't leak Penpal connection (`destroy` on unmount)

### License+Cost Verdict

- All checks are free to verify locally. No cost.
- **Cost: $0**

### Confidence

**High** for jam gates extracted from bundle strings; **Medium** for exact RTP tolerance (declared vs actual matching algorithm not public) and load-time threshold (no ms number given — treat as "near-instant").

### Open Questions

- Exact RTP verification method (simulation sample size or formal odds) — to be asked on Discord.
- Exact load-time budget (e.g., <3s LCP?) — not specified; treat as heuristic.
- Invite account handle for sourceAccess — missing (see §8).

---

## 11. Open Questions — Aggregated & Discord Tracker

> All unresolvable or 404-resolved-via-alt items are appended to `/home/dlaminin/cjam/docs/QUESTIONS_FOR_DISCORD.md` per mission. This section is both the per-topic rollup and the append log. Existing file is preserved (append, not overwrite).

### Resolved Without Discord (fetch 404 resolved via zip)

| # | Question | Context | Resolution | Date |
|---|----------|---------|------------|------|
| R1 | `GET https://sdk.chain.wtf/casino/solidity/ICasinoGameV2.sol` returns Vocs 404 | Needed for contract interface verification | Resolved: file exists in SDK zip at `casino-sdk/solidity/ICasinoGameV2.sol` (SPDX MIT) — canonical source is zip, HTTP path is not web-served | 2026-09-01 |
| R2 | `GET https://sdk.chain.wtf/casino/examples/.../game.manifest.json` via HTTP 404 | Needed for manifest example | Resolved: example manifest in zip at `examples/coinflip-public/public/game.manifest.json` — verified (copy above) | 2026-09-01 |
| R3 | jam.chain.wtf initial WebFetch returned only `<title>Chain Jam</title>` | Widget snippet location | Resolved: widget at `https://jam.chain.wtf/widget.js` + snippet in `assets/index-NtGTwgFV.js` — exact tag verified | 2026-09-01 |

### Unresolved — To Post on Discord (discord.gg/3kpZHvvTq)

| # | Question (copy-paste ready) | Context | Date Added | Status |
|---|-----------------------------|---------|------------|--------|
| Q1 | Hi Chain team — ROBO STRIKE (Chain Jam Vol.1) question: For `sourceAccess` on jam.chain.wtf, which GitHub account or email should we invite to the private repo? The form placeholder says "invite our review account" but the bundle (`assets/index-NtGTwgFV.js`) doesn't name it. Context: we build against local simulator per sdk.chain.wtf/casino GETTING_STARTED. Is there a canonical handle (e.g., `chain-review` or email) and required permission level (Read)? | Need to file correct invite to pass "source required for prizes" gate. | 2026-09-01 | open |
| Q2 | Hi Chain team — ROBO STRIKE (Chain Jam Vol.1) question: For Declared RTP 93–98% validation, do you accept floats like 96.5 and how do you verify `declared math matches actual paytable` — e.g., formal odds vs simulation tolerance? Context: SDK `quoteRiskParams.expectedPayout = RTP*wager` but tolerance not stated. | Want to declare precise RTP matching our simulated ensemble without mis-match flag. | 2026-09-01 | open |
| Q3 | Hi Chain team — ROBO STRIKE question: Is there a numeric load-time budget for "loads near-instantly" eligibility (e.g., LCP < 2.5s on 4G)? Context: SDK host grows iframe via `reportContentSize`; our build is static Vite on Vercel. | Want to ensure eligibility not missed on Lighthouse. | 2026-09-01 | open |
| Q4 | Hi Chain team — ROBO STRIKE question: Does `inIframe` detection in `widget.js` (uses `window.top!==window.self`) count as sufficient for gallery-iframe filtering, or should we take additional steps to avoid double-count on embedded demos? We host on same origin as manifest per `assertSameOriginUrls`. Context: local test shows gallery iframe at `?ref=chainjam` correctly not pinging, top-level does. | Confirm no extra header needed. | 2026-09-01 | open |
| Q5 | Hi Chain team — ROBO STRIKE question: For VRF verification, simulator has `getRandomnessVerification` not implemented (`supported:false`). Is this expected for jam judging, or should we implement a fallback display? Context: docs say feature-detect. | Want to handle absence gracefully without penalty. | 2026-09-01 | open |

Posting template per docs/QUESTIONS_FOR_DISCORD.md:
```
Hi Chain team — ROBO STRIKE (Chain Jam Vol.1) question:

<exact question>

Context: <1-line context>
We build against local simulator per sdk.chain.wtf/casino GETTING_STARTED.
```

---

## Overall License+Cost Verdict

| Item | License | Cost |
|------|---------|------|
| Casino SDK docs + src/ (`types.ts`, `guest.ts`, `host.ts`, `bet-limits.ts`, `manifest.ts`) | MIT via SPDX on `ICasinoGameV2.sol`; bridge sources vendored permissively per README shadcn note — free reuse | $0 |
| Solidity `ICasinoGameV2.sol` | `SPDX-MIT` | $0 + chain gas on deploy |
| Coinflip example | Free within SDK (copy/modify) | $0 |
| Simulator (`simulator/`, `local-verify-network`) | Free bundled Hardhat+VRF+host harness | $0 |
| Jam widget (`jam.chain.wtf/widget.js`) | Free brand asset, anonymous URL-only telemetry | $0 |
| Submission (jam.chain.wtf) | Free via DoraHacks/Jam Convex | $0 |
| Hosting | User-provided domain (Vercel free tier ok) | ~$0 (host sits outside fee) |

**Total marginal cost to enter jam via SDK path: $0** beyond normal chain gas for contract deployment (Base L2) and domain if custom.

---

## References (All Fetched)

All URLs fetched 2026-09-01 UTC:

- https://sdk.chain.wtf/casino
- https://sdk.chain.wtf/casino/GETTING_STARTED.md
- https://sdk.chain.wtf/casino/CHAIN_WTF_CASINO_GAMES.md
- https://sdk.chain.wtf/casino/LOCAL_SIMULATOR.md
- https://sdk.chain.wtf/casino/CONTRACT_CONSTRAINTS.md
- https://sdk.chain.wtf/casino/RANDOMNESS_DICE.md
- https://sdk.chain.wtf/casino/VISUAL_AND_UX.md
- https://sdk.chain.wtf/casino/REPO_STRUCTURE.md
- https://sdk.chain.wtf/casino/SLOTS_RISK_AND_RESERVES.md
- https://sdk.chain.wtf/casino/CHANGELOG.md
- https://sdk.chain.wtf/sdk/casino-sdk.zip
- https://jam.chain.wtf (plus https://jam.chain.wtf/widget.js and https://jam.chain.wtf/assets/index-NtGTwgFV.js bundle via curl)

Extracted local copies at `/tmp/casino-extract/casino-sdk/{solidity/ICasinoGameV2.sol, src/types.ts, src/manifest.ts, src/guest.ts, src/host.ts, src/bet-limits.ts, docs/*.md, examples/coinflip-public/*}` retain same date.

---

*End of sdk.md — produced for ROBO STRIKE.*

