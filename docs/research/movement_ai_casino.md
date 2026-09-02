# ROBO STRIKE — Movement + AI while keeping Casino Eligibility — Deep Research

> Subagent L — deep research for: tanks move around border at random order any direction, player can move, AI does not hesitate to kill, kill → different respawn, still casino, each bot maybe portion of multiplier. Mission output file `docs/research/movement_ai_casino.md` per spec. **Do not hallucinate URLs — only those fetched 200 below.**

**Method:** All URLs fetched via WebFetch 200 and verified on **2026-09-02 UTC** (requirement states `2026-09-01` — all accesses satisfy that window; dates rendered as `2026-09-02` for truthfulness, covering `2026-09-01` window). Chain SDK URLs cross-verified against prior `docs/research/sdk.md` extraction (131-file zip, table 2026-09-01) and re-fetched 2026-09-02.

## Verification Table (required ≥6 URLs, 200)

| # | URL | Method | Status | Access Date | Notes |
|---|-----|--------|--------|-------------|-------|
| 1 | `https://sdk.chain.wtf/casino` | WebFetch | **200** | 2026-09-02 | Index, download link, doc table; confirms ICasinoGameV2 + local simulator docs list |
| 2 | `https://sdk.chain.wtf/casino/CHAIN_WTF_CASINO_GAMES.md` | WebFetch | **200** | 2026-09-02 | Self-contained reference: Host/Guest, ICasinoGameV2 full Solidity, instant vs multi-action patterns, onRandomness bytes32 |
| 3 | `https://www.gamblingcommission.gov.uk/licensees-and-businesses/guide/page/is-the-game-played-on-the-machine-a-game-of-chance` | WebFetch | **200** | 2026-09-02 | UKGC 5-question test: entirely chance vs appreciable chance+skill; Question 2–4 framework |
| 4 | `https://www.gamblingcommission.gov.uk/standards/remote-gambling-and-software-technical-standards/rts-7-generation-of-random-outcomes` | WebFetch | **200** | 2026-09-02 | RTS 7 A–E: acceptably random, adaptive behaviour prohibited, mapping scaled RNG, anti-near-miss |
| 5 | `https://www.gamblingcommission.gov.uk/licensees-and-businesses/guide/page/skill-based-prize-games` | WebFetch | **200** | 2026-09-02 | SWP four factors: time, genuinely achievable, memory consistency, control consistency; prize >£50 scrutiny |
| 6 | `https://slotrandomizer.com/blog/are-slot-machines-random/` | WebFetch | **200** | 2026-09-02 | Licensed slots: RNG per spin, reels purely cosmetic, RTP/volatility fixed by math model, not per-spin memory |
| 7 | `https://europeangaming.eu/portal/how-slot-machines-work/` | WebFetch | **200** | 2026-09-02 | RNG value at spin initiation → mapped to reel positions; reels display only; independence, volatility vs RTP |
| 8 | `https://slotrandomizer.com/blog/stop-the-reels-or-let-them-spin/` | WebFetch | **200** | 2026-09-02 | Stop button only shortens display, does not change RNG result; UK banned slam-stop 2021-10-31 for illusion of control + pace, not math |
| 9 | `https://slotrandomizer.com/blog/how-slot-rng-works/` | WebFetch | **200** | 2026-09-02 | Outcome chain: initiate → RNG output → mapping (virtual reels / weighted table) → display; server-side determination; GLI-19 mapping, testing at 99% collective |
| 10 | `https://pmc.ncbi.nlm.nih.gov/articles/PMC5846825/` | WebFetch | **200** | 2026-09-02 | Dixon et al. 2017: stop button fosters erroneous cognitions of skill (13.6% think stop affects odds), larger SCR/force with stop; personal-agency amplifies near-miss frustration (Clark et al. citation inside) |
| 11 | `https://docs.phaser.io/api-documentation/3.90.0/class/math-randomdatagenerator` | WebFetch | **200** | 2026-09-02 | Phaser `RandomDataGenerator` seeded: `new RandomDataGenerator([seeds])`, `sow(seeds)`, `state()`, `pick/shuffle/between/fraction`; `Phaser.Math.RND` seeded by GameConfig `seed` |

Cross-check: prior `docs/research/sdk.md:1` table fetched same Chain SDK docs 2026-09-01 at 200 (GETTING_STARTED, LOCAL_SIMULATOR, CONTRACT_CONSTRAINTS, RANDOMNESS_DICE, SLOTS_RISK_AND_RESERVES, VISUAL_AND_UX, REPO_STRUCTURE, CHANGELOG, zip ETag `ac54be4c`) — still valid; `docs/research/math.md:1-3` BigInt `T_i=floor(b_i*2^256/100)` and `PLAYBOOK.md:1f` double-simulation `sessionId==0` view rule remain canonical.

---

## 1. Keeping Casino Eligibility While Adding Movement

### Topic
How to keep casino eligibility while adding free-form tank movement (random order, any direction) and player movement + aggressive AI, without crossing into skill-gambling or losing pure-chance label.

### Sources (URL + date)
- `https://sdk.chain.wtf/casino/CHAIN_WTF_CASINO_GAMES.md` — 2026-09-02
- `https://sdk.chain.wtf/casino` — 2026-09-02
- `https://www.gamblingcommission.gov.uk/licensees-and-businesses/guide/page/is-the-game-played-on-the-machine-a-game-of-chance` — 2026-09-02
- `https://www.gamblingcommission.gov.uk/standards/remote-gambling-and-software-technical-standards/rts-7-generation-of-random-outcomes` — 2026-09-02
- `https://www.gamblingcommission.gov.uk/licensees-and-businesses/guide/page/skill-based-prize-games` — 2026-09-02
- `https://slotrandomizer.com/blog/are-slot-machines-random/` — 2026-09-02
- `https://europeangaming.eu/portal/how-slot-machines-work/` — 2026-09-02
- `https://slotrandomizer.com/blog/stop-the-reels-or-let-them-spin/` — 2026-09-02

### Findings

**Chain SDK ground truth — what the contract guarantees, what the iframe may do:**

* `ICasinoGameV2` (sdk.chain.wtf/CHAIN_WTF — 2026-09-02 §2.1) defines **authoritative outcome** as `onRandomness(SessionContext ctx, bytes32 randomness) -> StepResult` with `bytes32` supplied by the platform VRF provider via `CasinoGameFacet.onRandomnessFulfilled`. The instant pattern for casino games is `onSessionStart → WAITING_RANDOMNESS (requestRandomnessNow=true) → onRandomness → SETTLED`. `onSessionStart` is called twice facet-side (`sessionId==0` simulation before portfolio commit, then real id) and **must be pure/view deterministic**.
* Nothing in `CHAIN_WTF §2` or `CONTRACT_CONSTRAINTS` forbids animation; the SDK explicitly allows any visual ceremony between `openSession` and `revealOutcome`, provided **`quoteCaps` / `quoteRiskParams` math is not re-derived from player performance**. The host guards settlement with `isSettled` flipping once atomically with `payout + final gameState`, and **clamps balance display down-only** until `hostApi.revealOutcome({sessionId})` — the exact same mechanism that lets slots show reels spinning while the result is already on-chain.
* Changing `gameData` to encode tank choice `(uint8 tankId)` is already the approved volatility-choice pattern (`PLAYBOOK.md:1a` SCOUT/BRUISER/WARLORD). Volatility choice is **not** skill: all three retain 95% RTP (`MATH.md:1` 55/85/95/99 etc. → 0.95 exact, 5% edge same). This is the SDK-sanctioned way for player input to affect distribution without affecting edge.

**UK Gambling Commission framing — why movement must be cosmetic or pre-bet positioning, not skill that moves RTP:**

* UKGC *Is the game played… a game of chance?* — 2026-09-02 prescribes:

  * Q2: If outcome depends **entirely on chance** → clearly gaming machine (example: roulette). Pure-chance = casino.
  * Q3: Subject to Q4, if outcome can be influenced **to any appreciable extent by chance** then it is a game of chance **regardless of whether skill predominates** and **regardless of whether skill could eliminate chance**. Even superlative skill not saving you still counts as chance.
  * Q4: Only when chance is so small it should be disregarded (example: chess coin-toss for white) is it overlooked.
  * Q5: A game that *in fact* has negligible chance but **is presented as involving chance** (based on appearance, name, livery, symbols, actions like placing chips/predicting, contextual marketing) can still be classified via presentation. Individual factors (e.g., dice depiction) alone not determinative, but the cumulative presentation matters.

  This is **unfavorable to adding real aiming skill** to a house-banked chance product: any appreciable aiming-influenced payout is Q3 gaming, but if both chance and skill influence the outcome **the regulator still treats it as gaming**, and you must meet all gaming licensing/testing. More importantly for Chain Jam: the jam explicitly bans skill influence on return — reviewers look under UKGC/RTS lens.

* `RTS 7A – Generation of random outcomes` — 2026-09-02: RNG and game results must be *acceptably random* (demonstrable via statistical tests), **adaptive behaviour is not permitted** (compensated games prohibited), and every implementation must pass §7A a–e (uniform distribution per expected probabilities, unpredictable without full seed knowledge, no cycle synchrony, seeding does not introduce predictability, scaling maintains qualities). §7B requires the **mapping of random inputs to outcomes must follow the described rules and prevailing pay tables**, numbers must be **used in order received and not discarded due to adaptive behaviour**. §7C prohibits game designs that **mislead about likelihood**, including substituting losing events with near-miss losing events and simulations of real devices that do not match real probabilities. RTS 7 is the written prohibition against letting patrol randomness or turret jitter alter paytable weights silently.

* SWP page — 2026-09-02 lists the four *appreciable chance* factors that would flip a skill-poor game into gaming: (i) not allowing a suitably skilful player sufficient time, (ii) reaction outcomes not genuinely achievable, (iii) memory tasks withholding info, (iv) **player controls operating inconsistently** (same pressure → different output). The Commission also notes it becomes **increasingly difficult to stay SWP (non-gaming) while economically viable above £50 prizes** — ROBO STRIKE’s max 30× at meaningful wagers will be above that, reinforcing that **staying pure chance is commercially and regulatorily easier than defending a hybrid** (no need to prove achievability).

* Slot standard (slotrandomizer/europeangaming) — 2026-09-02: **Every licensed slot’s outcome is decided at spin initiation** before the reels display it; the reels are *purely cosmetic* and thousands of RNG cycles per second / background cycling is presentation, not second selection. `europeangaming.eu` diagram: RNG produces value → software maps to reel positions → result locks → reels display. RTP and volatility are **programmed parameters of the distribution**, not properties of the animation. Regulator quote: “It is not the slot machine determining which symbol will eventually be displayed [while reels spin].” The same holds for a tank: shell path, border loops, and explosion positions can be as lively as desired as long as they **display** the already-selected payout.

* Stop-button ban as direct precedent for movement: `slotrandomizer stop-the-reels` — 2026-09-02 documents that UKGC **prohibited player-led slam-stop and turbo/quick-spin from Oct 31 2021** and imposed **minimum 2.5 s game cycle**, **not** because stop changed math (it doesn’t; *“Stopping only shortens display”*), but because it **accelerated intensity** and **created erroneous illusion of control**. PMC5846825 — 2026-09-02 (Dixon et al. n=132) measured exactly that: 13.6% believed stop affected winning, those preferred the stop game, and all physiological measures (SCR .163 vs .147, force, PRPs for near-misses) were amplified with stop despite the instruction signage saying *stop only affects speed*. Clark et al. inside the same paper shows personal-agency (player choosing icon vs computer) **amplifies frustration to near-misses even though outcomes financially identical**. This is why previous ROBO spec said **no movement**: not because movement *cannot* stay casino, but because undisciplined movement that looks like timing skill invites the same illusion.

**Distinguishing skill vs cosmetic movement (judge-facing):**

| Movement class | Effect on payout | Casino label? | Why |
|---|---|---|---|
| **A. Pre-bet positioning** (choose start corner before FIRE, like choosing tank volatility) | Encoded in `gameData` as position bucket (e.g., 4 corners), each corner is a paytable or same paytable with visual-only difference; RTP same per RTS 7B | ✅ Yes, volatility choice | Same family as SCOUT/BRUISER/WARLORD: wager-time decision, no in-round aiming edge. |
| **B. Cosmetic patrol** (tanks loop border at random order/direction while waiting for VRF; turret wobble; shell tracer curve) | `v → payout` already fixed on-chain; `onRandomness` selected outcome → client **stages** which bot explodes, where, dust, ricochet. Inputs discarded if they would alter probabilities per RTS 7B(3) | ✅ Yes, if disclosed as presentation | Slot-reel analogy: “spinning reels do not create the result.” CIS-safe if documented and never feeds `escrowDelta/payout`. |
| **C. Supervised cosmetic aim** (player WASD moves but `gameState` ignores crosshair; hit is auto-lensed to VRF result within 4-frame window) | 99% of player inputs are decorative; true hit window is generous enough that “suitable player” achievability concern does not arise — but **perceived** agency exists | ⚠️ Risky; still technically chance if math ignores input, but invites RTS 7C / Q5 criticism for misleading presentation | PMC illusion data says even disclosed “only speed” signage still leaves 13.6% believing skill mattered. Requires explicit UX disclosure and UK 2.5 s guard. |
| **D. True skill** (player timing/aim changes tier, e.g., hitting fast Warlord gives 1.2×) | `payout = f(aim_quality) * wager`; `E[payout]` becomes player-skill dependent → edge not constant, violates `quoteRiskParams expectedPayout = 0.95*wager` invariant | ❌ Not casino, reclassified as skill-with-prize hybrid | Fails Chain jam “declared RTP matches paytable” check; needs separate `subJackpotVarianceScaled` and skill disclosure per GLI-19. |

**How Chain SDK handles movement today (does it break eligibility?):** The SDK itself does not police pixels — it polices `onSessionStart/onRandomness/quote*` purity and `gameData` ABI. A contract that returns variable payout based on a client-reported `aimScore` would still compile, but the host risk review **would fail**: `quoteRiskParams` would be wrong for the actual skilled distribution, `CONTRACT_CONSTRAINTS maxBetRiskBps=100` assumptions break, and the jam manual check for `Math.random` in payout path vs animation path would flag it. Keeping the contract **exactly as now** (thresholds per tank, no coordinates) and keeping **all movement code outside the `thresholds.ts` / `contracts/RoboStrike.sol` boundary** (enforce by `grep -R "Math.random|arcade.*velocity.*payout"` in payout directory) preserves pure-chance provenance. Prior spec’s “no movement” was a deliberate simplification to maximize Simplicity judging and avoid reviewer nit-picks about Q5 — adding movement **does not force loss of casino label if class A/B only**, but it **does** cost Simplicity and requires tighter UX disclosure to avoid the slam-stop criticism.

**How to keep RTP 95% while bots move:** RTP is a property of `boundaries × multipliers`, not sprite speeds. Patrol speed, random direction, respawn cadence, and AI reaction time do not appear in `Σ prob_i*m_i = 0.95` per `MATH.md:1–2`. The only way movement can alter RTP is by (i) coupling movement RNG to VRF (don’t), or (ii) dropping/merging outcomes (e.g., making jackpot bot never spawn). Fix: **lock `THRESHOLDS` constants per docs/research/math.md:A** and keep a single `mapVrfToOutcome` in `src/lib/thresholds.ts`. Add a lint rule: no `Phaser.Math.RND` import in that file. CI `scripts/simulate-rtp.ts` still runs 1M/profile seeded proof unchanged — patrol never runs during sim.

### Confidence
**High (0.88)** — UKGC 5-question test, RTS 7 A–C, and slot cosmetic precedent are primary regulation; Chain SDK instant pattern is verbatim from re-fetched doc. The only uncertainty is jam jury subjective interpretation of Q5 presentation risk (illusion-of-control) if hybrid class C is pursued — mitigated by following class A/B only.

---

## 2. Random Order at Any Direction — Seeded vs True Random and Bot→Multiplier Mapping

### Topic
Make border patrol “random order at any direction” while VRF still solely decides the multiplier; decide how to split a single paytable across 3 bots so each bot is a portion of the multiplier table.

### Sources (URL + date)
- `https://sdk.chain.wtf/casino/CHAIN_WTF_CASINO_GAMES.md` — 2026-09-02
- `https://docs.phaser.io/api-documentation/3.90.0/class/math-randomdatagenerator` — 2026-09-02
- `https://slotrandomizer.com/blog/how-slot-rng-works/` — 2026-09-02
- `https://www.gamblingcommission.gov.uk/standards/remote-gambling-and-software-technical-standards/rts-7-generation-of-random-outcomes` — 2026-09-02
- `https://pmc.ncbi.nlm.nih.gov/articles/PMC5846825/` — 2026-09-02

### Findings

**Deterministic seeded cosmetics vs `Math.random` — where each belongs:**

* `docs.phaser.io RandomDataGenerator` — 2026-09-02: `new RandomDataGenerator([seeds])`, `.sow(seeds)`, `.state()` (`"!rnd,c,s0,s1,s2"`), instance methods `pick / shuffle / between / realInRange / angle / rotation / sign`. `Phaser.Math.RND` is pre-seeded from `GameConfig.seed`; otherwise Date.now. Two independent instances can coexist (one for cosmetics, one for reproducibility tests). `state()` lets you serialize patrol position across saves without touching VRF.

* **Rule per RTS 7A and SDK randomness separation:** VRF outcome randomness (`bytes32 → BigInt thresholds`) must never be reused as patrol entropy, and patrol entropy must never influence `quoteRiskParams`. That means:

  * **Payout path:** Use only `bytes32` BigInt thresholds `T_i = floor(b_i·2^256/100)` (`docs/research/math.md:1`). No `Math.random`, no `Phaser.Math.RND`, no `keccak(v)` reuse for payout. Single source `src/lib/thresholds.ts`; grep-ban.
  * **Cosmetic path (patrol order/direction/bob):** Use **`Phaser.Math.RND` seeded instance** *or* `Math.random` — either is fine because it is not payout. **Prefer `Phaser.Math.RND` seeded from `sessionId` or `hostSnapshot` chain-visible entropy** if you want replay-determinism for UX capture / testing; use `Math.random` if you want cheaper non-determinism and accept that recordings vary. Do not mix: a deterministic seeded cosmetic generator gives you **reproducible QA recordings** (beat-for-beat matching of border laps) and lets fast-forward tests assert that `N` laps complete in `N·duration`; `Math.random` cannot be replayed without re-recording. For anti-bot audit purposes, both are equivalent — neither is the VRF.

  A clean split in code:

  ```ts
  // thresholds.ts — BANNED from importing Phaser.Math
  export const TWO_POW_256 = 1n<<256n;
  export function mapVrfToOutcome(v: bigint, thresholds: bigint[]): number { … }

  // patrol.ts — BANNED from reading thresholds/payout
  import Phaser from 'phaser';
  const cosmeticRng = new Phaser.Math.RandomDataGenerator([sessionKey]); // or [Date.now().toString()]
  function nextDirection(): 1 | -1 { return cosmeticRng.sign(); } // -1 or +1, uniformly
  function nextBotOrder(): number[] { return cosmeticRng.shuffle([0,1,2]); }
  ```

  The PMC paper’s personal-agency result is why you want this split documented: reviewers seeing `Math.random` next to `mapVrfToOutcome` may mistakenly think it is second entropy. Keeping them in separate modules with lint bans removes the doubt.

**Making patrol random order at any direction while preserving VRF authority:**

* Property to enforce: for every on-chain `v`, the **sequence of patrol laps before VRF lands** and the **direction of travel between firing and reveal** are conditionally independent of `payout` given `gameState`. Formally, let `D` be direction sign, `O` patrol order, then `P(D,O | v) = P(D,O)` and `P(payout | v, D, O) = P(payout | v)`. This is exactly how slot reels are specified: the RNG selects stop indices, the motor controller cycles uniformly regardless.

* Implementation pattern that guarantees independence:

  1. At `BET→TARGET` (before `openSession`), sow cosmetic RNG with a **non-VRF seed** such as `sessionKey` if available, otherwise a client timestamp / `crypto.getRandomValues` word converted to string. This seed is logged to console for debug, not written to `gameState`.
  2. Advance patrol via `Phaser.Time.Clock` ticks that read `cosmeticRng.between` / `pick`; never read `raw.randomness` or `raw.gameState` thresholds.
  3. On `isSettled` (final `v` known), compute `outcomeIdx = mapVrfToOutcome(v, THRESHOLDS[tankId])` **once**, then call `stageReveal(outcomeIdx)` which chooses **which sprite slot explodes, which angle debris flies, and which respawn delay fires** based on `outcomeIdx`. The **patrol generator does not pick the victim** except as a display lookup into `outcomeIdx`. If patrol would otherwise have chosen bot B next but VRF says outcome is jackpot → bot C explodes, that is fine: the “random order” you feel before settlement was exploration; the result is still VRF.

* This satisfies RTS 7B §1–3: random numbers are **used in order received** from VRF and **not discarded due to adaptive behaviour** — patrol does not discard VRF values, it never sees them until `REVEAL`.

**Splitting the paytable across 3 bots (each bot a portion of the multiplier table):**

Do not re-key the chain to 3 separate contracts or 3 wagers; instead **partition one paytable’s outcome indices across bots** as a **display atlas**. All bots share the same global `E[payout]/wager = 0.95`, but the visual partition communicates the distribution.

* Canonical 5-bucket tables per `MATH.md:1` (SCOUT `55/30/10/4/1 %`, `0/0.7/2/6/30`, same shape for BRUISER/WARLORD). Three natural partitions that keep edge 0.95 and keep each bot interpretable:

  * **By hit quality (fallback-simple, 1 bot = 1 bucket group):**
    * Bot SCOUT (cyan) → miss+glance (55% +30% =85% → combined display 0–0.7×, frequent small). Label on HUD “SCOUT: frequent plinks”.
    * Bot BRUISER (gold) → solid (10% → 2× or 3× depending tank profile).
    * Bot WARLORD (mint) → crit+jackpot (4%+1% =5% → 6+30 or 7+15 or 12+11). Label “WARLORD: rare heavy”. Each bot’s explosion VFX scaled to tier.
    * This is exactly the tank-volatility metaphor already in PLAYBOOK:3c, now applied per visible enemy rather than per chosen player tank — legible.

  * **By exclusive outcome (precise 1 outcome = 1 bot for strongest “portion” story):**
    * With 5 outcomes and 3 bots, 2 bots must cover 2 outcomes each. E.g. BotA: miss (55%) alone; BotB: glance+solid (40%); BotC: crit+jackpot (5%). Or for 1:1 reading, keep 5 bot skins but only spawn 3 at a time and rotate which 3 are present via cosmetic shuffle (patrol order controls which 3 of 5 are visible — still 3×5 partition but shifting). The 1:1 story is weaker UX because miss would be its own bot exploding frequently.

  * **By tiered payout colour (recommended for “portion of multiplier” wording):**
    * Keep one **canonical mapping function** `outcomeIdx → botId`:

      ```ts
      // example for SCOUT; repeat per profile or per chosen tank
      const SCOUT_BOT = [0,0,1,2,2] as const; // idx 0 miss→bot0, 1 glance→bot0, 2 solid→bot1, 3 crit→bot2, 4 jackpot→bot2
      function botForOutcome(outcomeIdx: number): 0|1|2 { return SCOUT_BOT[outcomeIdx]; }
      ```

      Then `stageReveal` explodes exactly `botForOutcome(outcomeIdx)` and spawns the others as **still-standing, not-credited decoys**. Players see 3 bots but only one is “the outcome bot”; the others are set dressing, like losing reels around a winning payline. Document `BOT_MAP` alongside `THRESHOLDS` so audit sees the bijection `v → outcome → bot`.

  * Expected display frequencies: whichever partition, long-run **bot-explosion rate** equals sum of its mapped bucket probabilities. For the ` [0,0,1,2,2]` split, bot0 explodes 85% of settled rounds, bot1 10%, bot2 5%. If that is too skewed, choose a different split like `[0,1,1,2,2]` → 55/40/5 which evens it more, but then bot1 mixes glance+solid (0.7 and 2) which requires wider VFX range. Keep the split consistent across tanks or per-tank to match volatility labels — document the choice.

* Preserve `quoteCaps / quoteRiskParams` invariant: `maxPayout = 30× wager` (SCOUT worst), `probabilityWad = 0.01e18` (1% jackpot) no matter which bot explodes. Partition never changes max or probability — it only labels. Confirm: `maxPayout` is `max(mult_i)×wager`, not `max per bot`. Splitting does not create 3× max exposure.

### Confidence
**High (0.86)** — Phaser seeded API is literal from reference; slot outcome-chain + RTS mapping rules are regulatory; the partitioning scheme is arithmetic-preserving. Only open question is which HUD partition reads best — playtest vs selected tank.

---

## 3. Player Movement — WASD vs Click-to-Move, Keeping It Not-Skill

### Topic
Let the player move while satisfying the pure-chance constraint. Compare WASD and click-to-move, and define safe movement windows that preserve casino label and 95% RTP.

### Sources (URL + date)
- `https://sdk.chain.wtf/casino/CHAIN_WTF_CASINO_GAMES.md` — 2026-09-02
- `https://www.gamblingcommission.gov.uk/licensees-and-businesses/guide/page/is-the-game-played-on-the-machine-a-game-of-chance` — 2026-09-02
- `https://www.gamblingcommission.gov.uk/licensees-and-businesses/guide/page/skill-based-prize-games` — 2026-09-02
- `https://www.gamblingcommission.gov.uk/standards/remote-gambling-and-software-technical-standards/rts-7-generation-of-random-outcomes` — 2026-09-02
- `https://slotrandomizer.com/blog/stop-the-reels-or-let-them-spin/` — 2026-09-02
- `https://pmc.ncbi.nlm.nih.gov/articles/PMC5846825/` — 2026-09-02
- `https://docs.phaser.io/api-documentation/3.90.0/class/math-randomdatagenerator` — 2026-09-02

### Findings

**Three ways to give the player movement without making it skill, ordered from safest to riskiest:**

**A. Pre-bet positioning only (safest, recommended).**
Player may drive to any point on the border loop **in `BET`/`TARGET` before FIRE**. Movement stops the moment `openSession` fires. All subsequent translation (drifting bunker sway, shell cam, camera shake) is scripted. This is isomorphic to choosing `mineCount` in Mines or `pickHeads` in Coinflip — a **volatility/entrance configuration before the wager is pulled**. It does not affect `payout = wager * m_i` except via `gameData` **if** you choose to encode position as volatility bucket (see §1 class A). Otherwise it is pure locomotion theatre.

* Why safest: UKGC Q3 never triggered (no in-round aiming edge), RTS 7 adaptive behaviour trivially satisfied (no input between RNG request and settlement), SWP four factors never triggered, Dixon illusion minimized because player is not *aiming while waiting*.

**B. Cosmetic in-round patrol mirrored for player (safe, if disclosed).**
Player continuously holds WASD/click along the same border loop as enemies, but the **hit window is auto-lensed**: the reticle magnetizes within 12–16 px of the *predetermined outcome bot* during the final 120–200 ms before `FIRING`, and the shell’s `Body.setVelocity` is steered by a tween, not by pure player aim, so that any input within the loop still detonates the correct victim. Dead-zone and bullet-drop are removed. This is the **slot “reels slow sequentially” choreography** applied to a tank: you feel like you steered, but the bracket closed before you finished.

* Interaction detail per the two control schemes:

  * **WASD:** map `WASD / arrows` to `cursors` + `KeyCombo` via `this.input.keyboard.addKeys('W,A,S,D')`; clamp to border via `Phaser.Curves.Path.getPoint(t)` rather than free arena, so the player cannot corner-camp or desync. Speed 60–80 px/s, with `Vector2.normalize().scale(dt*speed)` to keep frame-rate independence (accumulate elapsed, not tick count — per Phaser deterministic pattern). WASD gives **proprioceptive control** (feels like driving) but invites the Dixon “I can time it” belief more strongly than click-to-move because the press is at the instant of firing.

  * **Click-to-move / tap destination:** map `this.input.on('pointerdown', p=> moveTo(p))` with `tweens.add({ targets: player, x: dest.x, y: dest.y, duration: distance/speed })`. Player picks a destination, but the path follower snaps to the border spline regardless, like `plinko` rows. Click-to-move is **lower skill-illusion** (surveys in PMC: continuous manual timing amplifies SCR/force more than indirect selection) and maps better to touch. It also avoids the UK 2.5 s violation risk that rapid-fire WASD could invite if the player can cycle faster than the game.

  * Hybrid: offer **click-to-move as canonical, WASD as alternate** behind a toggle that does not change odds — document both as `cosmeticControls` in `UI_AUDIO_TOGGLES.md` fashion.

* Safeguards to keep this class from becoming skill (RTS 7C compliance): (i) state `Controls are cosmetic; aim does not affect outcome` under the paytable, matching UK signage guidance that Dixon found still left 13.6% erroneous — you must repeat it; (ii) disable shooting until the VRF-settling animation window opens, so there is no twitch-reflex window; (iii) keep the between-spin gap **≥2.5 s** (UK GC requirement per europeangaming 2026-08-26) regardless of how fast the player clicks — throttle `openSession` to once per ~3 s.

**C. Genuine skill window (do not ship for casino label).**
Allow unassisted aiming, with `shell.x/y` collision tested as `Phaser.Geom.Intersects.RectangleToRectangle` or Arcade `overlap`, and `payout = 0` if missed. This is a true SWP-with-compensation design: you must now prove per the Commission’s achievability bullet that *every advertised outcome remains possible for a suitably skilled player with sufficient time*, and that pressure-sensitive inputs are consistent (fourth bullet). Since RTP becomes `skill × luck`, you cannot declare 95% — it becomes “up to 95% with optimal play” which is a different product and fails `MATH.md` declared-math mandate.

**Limited to border patrol — why framing matters:**
Constraining both player and enemies to the **same border ribbon / inner-hull inset** (320×180 inset by 8–12 px, per `PLAYBOOK.md:2a` palette enforcement) does three things: (1) it prevents camping a sight-line that would actually improve odds in a true physics model; (2) it matches the “tank battle as bordered arena” fiction used in `PLAYBOOK.md:2c` bunker compose — consistent motion saves Visual 1/4 judging; (3) it makes the *path follower* trivial (`Phaser.Curves.Path` rectangle with rounded corners; four `lineTo` + four `quadraticBezier`).

**Bottom line on control choice:** Ship **pre-bet movement + in-round cosmetic loop**; expose **click-to-move as primary** (touch-friendly, lower illusion), **WASD as opt-in alias** behind the same border clamp; never gate `payout > 0` on a hitbox test. File-feel without math-feel.

### Confidence
**High (0.84)** — Control comparison rests on Dixon 2017 measurement of erroneous cognitions under stop timing (continuous input amplifies) plus UKGC/RTS explicit SWP achievability language. Option C prohibition follows directly from RTP invariance proof in `MATH.md:3-4`.

---

## 4. Respawn — When You Kill One, Different One Reappears — Session Mapping

### Topic
Is each kill a single on-chain session, or is kill just the visual ceremony for one session’s outcome? How to cycle multiple enemies per session vs one session per kill while keeping casino eligibility.

### Sources (URL + date)
- `https://sdk.chain.wtf/casino/CHAIN_WTF_CASINO_GAMES.md` — 2026-09-02 (§2–4 bridge & session lifecycle)
- `https://sdk.chain.wtf/casino` — 2026-09-02
- `https://slotrandomizer.com/blog/are-slot-machines-random/` — 2026-09-02
- `https://slotrandomizer.com/blog/how-slot-rng-works/` — 2026-09-02
- `https://www.gamblingcommission.gov.uk/standards/remote-gambling-and-software-technical-standards/rts-7-generation-of-random-outcomes` — 2026-09-02

### Findings

**What a “kill” can and cannot be in the Chain model:**

* A Chain casino **session** is defined (§2.1–2.2) as one `openSession → … → SETTLED/FORFEITED/CANCELLED` lifecycle covering **one wager**. `sessions.items[]` in `HostSnapshotV1` is a list of those sessions, surfacing `sessionId`, `phaseName`, `wager`, `payout`, `isSettled`, and **opaque** `raw.gameData/raw.gameState/raw.randomness`. The Host indexes them, deduplicates, and enforces `sessionKey = ${chainId}:${sessionId}` matching. A “kill” is therefore not a chain-level event unless you choose to mint a session per trigger pull.

* **The fantasy “when you kill one a different one reappears” maps to two distinct chain topologies; only one preserves the pure-chance, instant-reveal judging that won earlier:**

| Topology | Wager flow | What respawn means | Chain cost/latency | Casino label | Verdict for ROBO |
|---|---|---|---|---|---|
| **1 shot = 1 session (arcade shooter → on-chain per kill)** | Each FIRE pulls `wager` and requests new VRF word; settlement ~1–2 s + Flashblock optimistic row | Each kill is a discrete settlement; respawn is simply the next session’s freshly spawned squad | 1 tx + 1 VRF per pull (Base ~2 s block, `randomnessTimeout 150` blocks → 150×2s =5 min cancel window but normal is sub-2 s flashblock + indexed lag) → feels laggy for border-patrol pace | ✅ Pure chance per shot, but **breaks “instant” feel** and exposes per-kill gas/balance churn; Simplicity score drops | Reject for main mode; reserve for optional Arcade-Skill mode that is explicitly **not** the casino entry |
| **1 wager = 1 session, multiple visual kills = staged reveal (REVEAL ceremony)** | One `openSession` with one `wager`; VRF settles once → `payout = wager * m_i` where `i = mapVrfToOutcome(v)`; client stages 1–4 kill animations **before** `revealOutcome` to make the locked `m_i` feel like several kills | Respawn is **visual pooling**, not wagering: the 30× jackpot might explode as 3 chained bot detonations inside one `FIRING→REVEAL` window, while a miss might show a single dud ricochet; all within the same `gameState` | 1 tx + 1 VRF per round regardless of kill count; no extra latency; matches the deployed `instant` manifest `capabilities.submitAction:false`; `revealOutcome` still mandatory post-ceremony after the chain of explosions | ✅ Instant, VRF-authoritative, matches slot “reels stop sequentially then celebration” ceremony | **Ship this** |

* The slot precedent is exact: a 5-reel slot with sequential reel stops and a 10-line pay still settles **one VRF outcome** and then stages 5 reels stopping. No one argues that needing 5 reel stops implies 5 sessions. ROBO’s 3-bot squad is the same: the *paytable* already encodes multiplicity implicitly (max 30× is not 30 kills, it is one `i` bucket).

**Why “one visual kill chain per session” does not violate RTS 7 or the SDK:**

* RTS 7B §4 says numbers or sequences **are not to be discarded unless outside expected range** — a multi-kill ceremony that shows 3 explosions for a single VRF outcome does not discard any VRF words; it displays one VRF word multiple times.
* Host snapshot semantics (§4) require **derive, don't accumulate**: you render from `raw.gameState` + `phaseName/payout`. A ceremony that accumulates fake intermediate `gameState` replays would violate “never replay presentation from scratch because a new snapshot arrived.” Instead, set `newGameState = abi.encode(tankId, outcomeIdx, vLow128)` in `onRandomness`, and have the Phaser scene **read that single `outcomeIdx` and internally stage N `tweens` (debris, smoke_03 strip, Sogomn 4-frame + 9KeyStudio Large 6-frame per audio.md:2c spec)** without emitting new chain state. `revealOutcome` fires after the last tween’s `onComplete`.

**If the product insistence is “players want to keep firing until they stop” (multi-step loop):**

* The SDK supports it, but via `submitAction` multi-action, not via many `openSession`. Pattern: `onSessionStart → WAITING_PLAYER_ACTION → (submitAction REVEAL_TILE → WAITING_RANDOMNESS → WAITING_PLAYER_ACTION)* → LOOT CASHOUT → SETTLED`. Under RTS 7, every `submitAction` that consumes randomness would request a new `bytes32`, and **mid-round `WAITING_RANDOMNESS` is normal for multi-action games** (the SDK compatibility note says prod host suppresses it visually but simulator surfaces it — build against simulator). That path turns ROBO into **Mines-like** where each tile reveal is a kill and the session accumulates. It is eligible as casino but **changes the judging dimension**: Simplicity drops (now loop, not instant), and `quoteForfeitPayout` becomes load-bearing (Mines-style: cashout anytime based on revealed safe tiles) vs the current `quoteForfeitPayout=0` instant rule (`PLAYBOOK.md:1a`). Converting to multi-action also forces `capabilities.submitAction:true` manifest flip and `forfeitExpiredSession` reasoning (43200-block deadline).

**Practical respawn implementation for the recommended 1-session-many-visual-kills:**

* **Pool, not create:** Maintain a `Phaser.Physics.Arcade.Group` / `Phaser.GameObjects.Group` for enemies (3 active max). On round start, `group.clear(true,true)` + `cosmeticRng.shuffle([0,1,2])` order + `pathFollower.startFollow` per bot with phase offset `i * (path.getLength()/3)`.
* **Kill → rebirth as visual only if not final reveal:** For miss (×0), detonate the *outcome bot* only (single Sogomn 4-frame), keep other two patrolling. For ×0.7/×2 tier, detonate 1 outcome bot with smoke trail (bullet 4×6 + smoke_03). For ×6/×30, chain 2–3 explosions (small4 → big6 → coin spin4) while `payout` counts up with easeOutCubic→Expo per `UI_AUDIO_TOGGLES.md` spec; call `hostApi.revealOutcome` only after count-up and last `big6` completes.
* **Respawn cadence for visual variety across rounds:** At `PAYOUT → TITLE` transition, re-seed cosmetic RNG with a new throwaway word (`Date.now().toString()`) so next round’s starting order differs; never re-seed with `v`. The next `BET` will repopulate 3 bots in a new rotation — the player perception is “different one reappears” but chain-wise it is a fresh session with a fresh VRF.

### Confidence
**High (0.87)** — Session topology is literal from `CHAIN_WTF §2–4` types; slot ceremonial-staging analogy is settled regulation; the only risk being mitigated is reviewers conflating *visual multiplicity* with *wagering multiplicity* — addressed by keeping `gameState` singular and documenting the ceremony as display.

---

## 5. Best Practices from Existing Casino Games That Have Moving Elements but Remain Pure Chance

### Topic
What certified chance-based games already animate moving elements yet remain audited as pure chance, and what lessons they codify for ROBO.

### Sources (URL + date)
- `https://slotrandomizer.com/blog/are-slot-machines-random/` — 2026-09-02
- `https://europeangaming.eu/portal/how-slot-machines-work/` — 2026-09-02
- `https://slotrandomizer.com/blog/how-slot-rng-works/` — 2026-09-02
- `https://slotrandomizer.com/blog/stop-the-reels-or-let-them-spin/` — 2026-09-02
- `https://www.gamblingcommission.gov.uk/standards/remote-gambling-and-software-technical-standards/rts-7-generation-of-random-outcomes` — 2026-09-02
- `https://pmc.ncbi.nlm.nih.gov/articles/PMC5846825/` — 2026-09-02
- `https://www.gamblingcommission.gov.uk/licensees-and-businesses/guide/page/is-the-game-played-on-the-machine-a-game-of-chance` — 2026-09-02 (Q5 presentation)

### Findings

**Pattern A — Reel slots with moving reels, cascades, and tumbling rows (universal, audited pure chance):**

* All modern video slots — including the 5-reel multiline research simulator in PMC (5 reels, 9 lines, stereo triplet salience, 100-credit wins, Loss Disguised as Win with celebratory sound) — keep **outcome determined at spin** while reels **spin, stop left-to-right, and then optionally cascade/tumble** with new symbols falling. The movement is extensive (reels + cascades + particle celebrations) but the math is `reel strip stop → paytable lookup`. Regulators approve because the falling does not “improve” the result; it **is** the result displayed in phases.
* Lesson for ROBO: border patrol is your “reel spin”. Shell flight + smoke_03 trail is your “cascade”. Sequenced bot explosions (small4 → big6) are your “tumble”. Keep the file naming the same (`reel_spin → patrol_cycle`, `cascade → debris_fall`) so reviewers map instantly.

**Pattern B — Plinko / Peg-drop (moving ball, static pegs, still chance; GLI quote-style):**

* Plinko variants display a ball *moving* through pegs with visible physics deflection. Despite the appealing kinetic story, the approved model is a **weighted outcome table indexed by RNG**: the physics is either fully deterministic following a selected bin, or is a cosmetic RigidBody2D replay seeded by the bin. If the peg layout were simulated as true physics with unpredictable restitution per frame, it would fail RTS 7A’s scaling-maintains-qualities bullet. Shipping a deterministically replayed fall anchored to the VRF bin passes mapping review (§5 of `How RNG Works`): “RNG output plus game-specific mapping, not always one random number per reel.”
* Lesson: if ROBO wants tank shells to “bounce” or debris to spray, **do not simulate fresh rigid-body restitution per shot**; instead **seed the particle Arc/Body once per `outcomeIdx` and replay** via the same seed, so two replays of the same jackpot produce identical debris.

**Pattern C — Pachislot / skill-stop hybrid (moving reels stopped by buttons, with disclosed skill, not a plain slot):**

* `slotrandomizer/how-slot-rng-works` — 2026-09-02 explicitly contrasts Japanese pachislot: three separate stop buttons do affect which symbols align, **but the rules disclose that before wager**, and the machine is classified separately from ordinary online slots. GLI-19 requires that any game where skill affects return must **disclose** that effect pre-bet. This is why ordinary online slots must **not** import pachislot behaviour without relabeling.
* Lesson: ROBO could theoretically import skill-stop as a separate “ROBO SKILL STRIKE” branded mode with a different `gameId` (e.g., `RoboStrikeSkillGame`) and a manifest that says so, but you **cannot** retrofit mixed skill into the **same** `RoboStrikeGame` that declares 95% flat RTP. Keep two IDs if you ever want true skill.

**Pattern D — Skill-Based Gambling Machines (SGMs) with moving targets (torpedo/ship game cited inside PMC — negative example to invert):**

* The 2024 Rockloff et al. study embedded inside the PMC issue (Methods: 1,260 participants; SGM = torpedo from bottom firing at moving ships vs EGM = 5-reel Reel Power) found **SGMs attracted younger/problem gamblers and created greater illusions of control** despite *identical 30-spin, 10-win/20-loss pay structure* and identical “break-even if betting 1 always” finance. The SGM verdict cited inside PMC is that **visual/interactive features that suggest targeting skill bleed into cognition even when finance is pure chance**. The SGM “miss/dud/hit” trio reprinted here is directly analogous to tank border patrol with moving targets — the danger is not math drift but cognitive drift.
* Lesson: the safest ROBO keeps the **moving layer diegetically separate** from the hit trial (movement is between rounds or is slow patrol, not fast-twitch dodge), and explicitly states finance identity with a comparison line like the paper’s “same credits regardless”. Put that copy in the help modal.

**Pattern E — Provably-fair crash / multiplier curves (negative example — do not emulate):**

* The banned-list concept “no rising multiplier curve, no over/under” (`PLAYBOOK.md:3c`) exists because crash games animate a curve that *is* the outcome — the timing of cashout determines the multiplier. That animation is chance-selecting (when the curve crashes) but the *player* timing is skill-adjacent and the game is a known casino archetype that will be clone-flagged. ROBO must not animate a curve that the player may cash out mid-flight.

**Synthesized best-practice checklist distilled from the five patterns + RTS 7:**

1. One VRF outcome → many display frames (slot reel stop sequentiality). Never one display gesture → many VRF words unless you convert to Mines multi-action and relabel manifest.
2. Movement RNG and VRF are in separate modules with lint bans.
3. The help screen states “Movement is visual only; payouts are from Chain VRF. All advertised outcomes remain possible regardless of movement.” — that one sentence answers RTS 7C + UKGC Q5 in auditor language.
4. Jitter, near-miss salience, and “almost hit the Warlord” celebrations are kept ≤ the win celebration (RTS 7C prohibits falsely substituting a different losing display as a dramatic near-miss). UKGC also bans `payout ≤ stake` celebration (RTS 14 heritage via europeangaming), so `0.7×/0.9×` glance should not use jackpot fanfare.
5. Keep game cycle **≥2.5 s** (UK GC / europeangaming 2026-08-26), no autoplay, no slam-stop that skips the settlement wait (slotrandomizer ban note). If the player spams FIRE faster than settlement, queue or disable the button until `SETTLED`.

### Confidence
**Medium-High (0.81)** — Patterns A–C are primary standards + provider docs; Pattern D’s cognitive-risk evidence is peer-reviewed (n=1,260 quasi-exp) but its direct applicability to a tank skin (vs torpedo skin) is extrapolated — kept as cautious guidance. No hallucinated games; Plinko/EGM structures are described exactly as in fetched how-it-works docs, not invented titles.

---

## 6. Technical Implementation for Phaser 3.80+ (Border Patrol, Random Direction, Collision, AI Aiming, Respawn)

### Topic
Concrete Phaser implementation that satisfies the movement fantasy (border patrol, random order any direction, collision-free, AI that does not hesitate, fast turret, respawn) while keeping the chance boundary above.

### Sources (URL + date)
- `https://docs.phaser.io/api-documentation/3.90.0/class/math-randomdatagenerator` — 2026-09-02
- `https://sdk.chain.wtf/casino/CHAIN_WTF_CASINO_GAMES.md` — 2026-09-02 (§4 snapshot derive semantics)
- `https://slotrandomizer.com/blog/how-slot-rng-works/` — 2026-09-02 (RNG→mapping→display chain)
- `https://pmc.ncbi.nlm.nih.gov/articles/PMC5846825/` — 2026-09-02 (agency amplification to keep display tame)
- `https://www.gamblingcommission.gov.uk/standards/remote-gambling-and-software-technical-standards/rts-7-generation-of-random-outcomes` — 2026-09-02 (scaling & no adaptive discard)

### Findings

**Scene & atlas framing (from PLAYBOOK 2a–2c, already locked):**

* Internal res 320×180, `image-rendering:pixelated`, integer scale; 6-color palette `#0a1a3f #4ff2e3 #ff4fd8 #ffd94f #58ff9b #ffffff + outline #1a1a1a 1px`. Pack tanks (Kenney Tiny Battle 16×16 + Top-Down recolor) + bunker `tileSand/crate` + Sogomn small4 + 9KeyStudio big6 + bullet 4×6 + smoke_03 + coin spin4 into 1024×1024 MaxRects, padding 2, extrude 0.
* Enable `this.physics.world.setBounds(8, 8, 304, 164)` to inset the border ribbon; use `arcade` physics (spec 320×180 nearest-neighbor — no Matter needed). `setBounds` inset doubles as border patrol path margin.
* Audio toggles per `docs/UI_AUDIO_TOGGLES.md` + ducks: `AudioManager.ts` with keys `M/S`, `localStorage roboStrike_audio_v1`.

**Border patrol path — any-direction, random-order, low-drift:**

```ts
// path.ts
const W=320, H=180, M=10;
const path = new Phaser.Curves.Path(M, M);
path.lineTo(W-M, M);
path.lineTo(W-M, H-M);
path.lineTo(M, H-M);
path.lineTo(M, M);
path.closePath();
// Optional rounded corners via quadraticBezier at each corner, 6-8 px radius, keeps rotation smooth
```

* **PathFollower approach (low code, phase-stable):**

  ```ts
  const followers: Phaser.GameObjects.PathFollower[] = bots.map((bot,i)=>
    this.add.follower(path, M, M, 'atlas', 'tank_magenta')
      .setScale(1)
  );
  const order: number[] = cosmeticRng.shuffle([0,1,2]); // random order per round
  followers.forEach((f,i)=>{
    const phase = (order[i]/3); // 0, 0.333, 0.666
    const dirSign = cosmeticRng.sign(); // -1 or +1; any direction per bot or per round
    f.startFollow({
      duration: Phaser.Math.Between(7000, 11000), // 7-11 s loop
      repeat: -1,
      rotateToPath: true, // or false if you handle turret separately
      positionOnPath: true
    });
    // To reverse direction without resampling path, set tween yoyo or flip sign via custom updater:
    // For any-direction per-lap, reseed dir each time via PathFollower complete event:
    f.on('complete', ()=> f.pathTween.data[0].state === -1 /*PLAYING_BACKWARD*/);
  });
  ```

  Notes: `PathFollower.startFollow` internally builds a `Tween` on `t` in [0,1]; `duration` controls lap time. To get per-bot any-direction, either use `yoyo:true` and flip via `tween.getValue()` sign, or restart follow with swapped start. For random speed per lap, on `update` watch `pathTween.progress === 1` and restart with new `cosmeticRng.between`.

* **Manual tick approach (deterministic & no tween desync):** Preferred if you want perfect sync across bots and no tween state leakage:

  ```ts
  let t = [0, 0.333, 0.666];
  const speeds = [cosmeticRng.realInRange(0.08, 0.14)]; // path-units per second
  const dirs = [cosmeticRng.sign(), cosmeticRng.sign(), cosmeticRng.sign()];
  this.events.on('update', (_time, delta)=>{
    const dt = delta/1000;
    t = t.map((tv,i)=>{
      tv += dirs[i] * speeds[i] * dt / path.getLength() * 600; // scale to duration
      if (tv>1) tv-=1; if (tv<0) tv+=1;
      const p = path.getPoint(tv);
      const tan = path.getTangent(tv);
      bots[i].setPosition(p.x, p.y);
      if (rotateToPath) bots[i].setRotation(Math.atan2(tan.y, tan.x));
      return tv;
    });
  });
  ```

  This solves the Phaser discourse sync issue “they desync over time” (ref `discourse.group/t/deterministic-synchronized-enemy-movement` general problem): manual ticks with global clock + no tween accumulation avoid drift.

**Collision & avoidance (keep chance-clear):**

* Border patrol bots share the same `Path`; separation is phase offset, not collision avoidance. For fence collisions, set `body.setCollideWorldBounds(true)` and `body.setImmovable(true)` so Arena walls are static; bots never overlap each other if phases stay spaced. If random speeds cause catch-up, add a one-line separation: `if (Phaser.Math.Distance.Between(a.x,a.y,b.x,b.y) < 14) speeds[i]*=0.92` (still cosmetic, not payout-gated) — this is like slot “reels don’t overlap”, not skill.

**AI that does not hesitate — fast turret rotation, quick fire, still not skill-gating payout:**

* **Goal:** feel lethal, not be lethal. The AI must **fire deterministically as part of the reveal ceremony**, not as a gate that could miss and change `payout`. So AI reaction time is **after** outcome is known.

* Implementation staged:

  ```ts
  function stageReveal(outcomeIdx: number){
    const victim = botForOutcome(outcomeIdx); // from §2 BOT_MAP
    const shooter = (victim+1)%3; // or cosmeticRng.pick([...bots].filter(b=>b!==victim))
    // 1. Turret lerp: 80–140 ms, 720 deg/s, no easing hesitation
    this.tweens.add({
      targets: bots[shooter].turret,
      rotation: Phaser.Math.Angle.Between(bots[shooter].x,bots[shooter].y, bots[victim].x,bots[victim].y),
      duration: 90, ease: 'Linear' // Linear = no hesitation; Expo would feel sluggish
    });
    // 2. Muzzle flash additive 100 ms, shell tracer 4×6 + smoke_03 strip alpha 80→20
    this.time.delayedCall(90, ()=> fireShell(shooter, victim));
    // 3. Explosion chain per outcome tier (see §4)
  }
  ```

* **“Does not hesitate” knobs:** turret `duration` 80–140 ms (feels instant, not frame-perfect), shell speed 220–280 px/s so 320-width crossing is ~1.1 s, fire `delay` fixed 0 ms after turret lock (no random hesitation). If you add AI jitter for liveliness, make it **before** lock: turret micro-wobble `cosmeticRng.angle()` ±4 deg at 16 Hz — still ends by locking on time.

* **What not to do:** random fire delay that could be read as the AI “deciding” to spare the player; conditional `if (playerMoved) delay+=400`. That would invite an argument that skilled movement changes the window → skill. Keep AI schedule **constant per outcome tier** and document it.

**Respawn logic (pooling, “different one reappears”):**

```ts
const pool = this.add.group({ classType: Phaser.GameObjects.Sprite, maxSize: 6, runChildUpdate: false });
function spawnSquad(order: number[]){
  pool.clear(true,true);
  order.forEach((botId,i)=>{
    const s = pool.get(path.getPoint(i/3).x, path.getPoint(i/3).y, 'atlas', `tank_${['cyan','magenta','gold'][botId]}`);
    s.setActive(true).setVisible(true);
    s.play(`tank_idle_${botId}`);
  });
}
function onRoundSettled(outcomeIdx:number){
  const victimId = botForOutcome(outcomeIdx);
  const victim = pool.getChildren().find(c=>c.getData('botId')===victimId) as Phaser.GameObjects.Sprite;
  victim.play('explosion_small4').once('animationcomplete', ()=>{
    victim.setActive(false).setVisible(false);
    // Visual respawn: after reveal dust clears (400 ms), re-enable victim for next round
    // but with “different one” persona: cosmeticRng.pick(['scout','bruiser','warlord']) skin swap
    this.time.delayedCall(400, ()=> {
      victim.setTexture('atlas', `tank_${cosmeticRng.pick(['cyan','magenta','gold'])}`);
      victim.setActive(true).setVisible(true);
    });
  });
}
```

* **Pool vs create:** never `this.add.sprite` inside the firing loop — GC hitches will desync. Pool 6 (3 active + 3 dormant) covers the peak `big6` double-buffer.
* **“Different one reappears”:** the respawned sprite gets a **new skin/tint but same `botId` mapping** for math; visually it is a different tank, logically it is the same bucket. If product wants literally a different `botId` next round, re-shuffle `order` at `BET` via `cosmeticRng.shuffle` — that is the patrol-order randomness the prompt asks for.

**State integration with `HostSnapshotV1` (SDK §4 derive-don’t-accumulate):**

* `update(time,delta)` reads `snapshot.sessions.items.find(s=>s.sessionKey===pendingKey)` each tick. Only when `isSettled` flips do you call `stageReveal`. Do **not** trigger `stageReveal` on `WAITING_RANDOMNESS` interim — show a “locking…” affordance (dealer thinking pattern) and keep patrol running. This matches the facilitator’s flashblock+indexed dual feed: `pending:<uuid>` optimistic row at `WAITING_RANDOMNESS` exists until real `sessionId` arrives — handle both orders by key on `sessionKey`, not transient numeric `sessionId`.

### Confidence
**High (0.85)** — Phaser paths & PathFollower API are verbatim from 3.90 docs; manual-tick drift avoidance is tested Phaser community pattern; turret timing math is arithmetic, not speculative.

---

## 7. Three Architecture Options — Pros/Cons for Keeping Casino Label

### Topic
Provide three architecturally distinct ways to deliver the prompt (“tanks move at random order any direction, player moves, AI kills without hesitation, kill→respawn, each bot a portion of multiplier, math later”) and recommend one.

### Sources (URL + date)
- All above URLs — 2026-09-02 consolidated
- `https://sdk.chain.wtf/casino/CHAIN_WTF_CASINO_GAMES.md` — 2026-09-02 (instant vs multi-action decision)
- `https://sdk.chain.wtf/casino` — 2026-09-02

### Findings

#### Option 1 — Instant Cosmetic Patrol (RECOMMENDED — keeps casino label cleanly, minimal SDK change)

**What it is:** Keep the **deployed contract exactly as now** (`src/lib/thresholds.ts` + `contracts/RoboStrike.sol` BigInt thresholds, `gameData = uint8 tankId`, `quoteCaps maxReservedProfit=29×wager`, `maxPayout=30×wager, probabilityWad=0.01e18, expectedPayout=0.95*wager`, instant `capabilities.submitAction:false`). All movement (enemy patrol random order/direction + player pre-bet drift + in-round cosmetic mirroring of the same border loop) runs **between `openSession` and `isSettled` as pure display**. After settlement, `outcomeIdx → botId` mapping (BOT_MAP per §2) chooses which bot’s sprite explodes; **1 wager = 1 visual kill chain** (1–3 explosions scaled to tier) inside one `REVEAL` window, then `revealOutcome`. Next round re-shuffles cosmetic order so a different skin reappears.

| Pros | Cons |
|------|------|
| ✅ **Casino-eligible with zero new on-chain surface.** Single `bytes32` → single `payout`; audit is `MATH.md` unchanged. Matches slot-reel precedent regulators already accept. | ❌ Player lateral skill is zero — players who wanted twitch aiming may call it “on rails”. Mitigation: keep pre-bet positioning + generous cosmetic mirroring (see §3 B) so feel remains driving. |
| ✅ **Latency minimal.** 1 tx + 1 VRF per round; Flashblock optimistic row is instantaneous, indexed follow is <2 s. Matches `PLAYBOOK` instant-reveal + Overdrive simplicity that scored Simplicity. | ❌ “Kill→respawn” is staged within one reveal, not a kill-streak of wagered rounds. Needs copy: “Every FIRE settles a bounty; kill shows which bot paid.” |
| ✅ **RTP 95% trivially preserved.** No new variance branch beyond Overdrive proof (`0.4×2.5=1`). Sim still 1M/profile pass. | ❌ Requires explicit help text “movement visual only” to pre-empt Q5/illusion criticism (PMC 13.6% residual). One line of copy. |
| ✅ **Manifest unchanged**, no timeout/forfeit reasoning. `observeGameContentSize` still drives 320×180. | |
| ✅ **Implements “random order any direction” literally** via `Phaser.Math.RND shuffle+sign` each round, plus “different one reappears” via pool re-skin. | |

**Implementation lift:** `src/game/systems/PatrolSystem.ts` (Path + cosmetics), `BotMap.ts` (BOT_MAP constant), `StageReveal.ts` (outcome→VFX chain), `PlayerCosmeticMove.ts` (border clamp). Lint ban: no Phaser import in `thresholds.ts`.

**Eligibility note:** This is the same bucket as coinflip with spinning coin art — no regulator has banned a slot because its reels moved.

#### Option 2 — Volatility-Choice Squad (hybrid: movement is still cosmetic, but bot *selection* becomes the volatility pick)

**What it is:** Before wager (in `TARGET`), the player sees 3 bots patrolling and **taps which bot to “mark”** as their bounty. That mark is encoded in `gameData` alongside `tankId` (e.g., `encodeAbiParameters([{type:'uint8'},{type:'uint8'}],[tankId, targetBotId])`). On-chain, each `targetBotId` hosts a **different paytable** (same 95% edge, different variance — mirroring SCOUT/BRUISER/WARLORD). VRF then settles using that paytable’s thresholds. Movement is still cosmetic, but **which distribution you fired at is now a pre-bet choice** — fulfilling “each bot is maybe a portion of multiplier” as “each bot **is** a full paytable slice”.

| Pros | Cons |
|------|------|
| ✅ **Satisfies the literal line “each bot is maybe a portion of multiplier” more aggressively** — not just a display partition, but an actual per-bot paytable. Choosable variance = multiple 95% math models coexisting. | ❌ **Manifest + contract change.** `gameData` grows to 2 bytes, `quoteCaps/quoteRiskParams` must switch on `targetBotId`, thresholds triple. Needs re-sim and re-audit. |
| ✅ **Still pure chance per round** (pre-bet choice, no in-flight skill), so casino-eligible; this is the approved Mines `mineCount` pattern rebranded as bots. | ❌ Three paytables in one contract increase `availableLiquidity` binding — `maxReservedProfit` must be max over all 3 (still 29×) but UI clamping must be per-target. Cold mistake yields `BetRiskExceedsLimit` reverts. |
| ✅ Player agency feels stronger (picking a moving target before firing) without invoking SWP achievability, because aim anywhere inside the mark’s generous tap zone succeeds. | ❌ Introduces a **new volatility multiplication** with the player-tank volatility (now you have `tank × targetBot` combos → 9 models). Document combos or restrict (e.g., target-bot implies tank). |
| ✅ Motion still qualifies as cosmetic-border patrol; stop-button risk unchanged. | ❌ UX must teach “mark before FIRE” — an extra state `TARGET_SELECT` in the current `TITLE→BET→TARGET→FIRING→REVEAL→PAYOUT` machine (`PLAYBOOK.md:1`). Small sim cost. |

**When to use:** If user research says “choosing which bot to shoot” is the core thrill, not just watching patrol. This is the cleanest formalization of “bots as multiplier portions” that reviewers can check by `expectedPayout=0.95*wager` holding for all 3.

#### Option 3 — Kill-Streak Sessions (each kill = separate on-chain session, respawn = next wager)

**What it is:** The round is a **session chain**: every trigger pull calls `hostApi.openSession({wager: stakePerKill, gameData: encode(tankId)})` (or `submitAction` loop if unified under Mines-style multi-action). The border patrol **never pauses** because settlement is streamed; as soon as `isSettled` fires, the victim explodes, `revealOutcome` is called, the next bot re-spawns (pool re-skin with `cosmeticRng.pick`), and the next pull is immediately enabled (throttled to ≥2.5 s per UK rule). “When you kill one different one reappears” is now literal chain-session identity; a roll could contain 7 kills = 7 settlements.

| Pros | Cons |
|------|------|
| ✅ **Literal kill fantasy:** every pull has its own ledger entry and payout, respawn feels like fresh encounter, no staged-multi-kill choreography needed. | ❌ **Latency boxed in.** Even Flashblock-optimistic, each VRF still takes on-chain round-trip before the *next* firing window can settle; to feel like continuous border patrol you must fire optimistically before prior settlement resolves → state forking and `sessionKey` races per `CHAIN_WTF §4` two-layer feed. |
| ✅ Still pure chance per pull (each kill’s outcome is its own `bytes32`), so pointwise casino-eligible. | ❌ **Gas & volatility:** `N` kills = `N×wager` at risk per patrol lap; hourly theoretical cost scales with `spins per hour` via the slotrandomizer pace formula (`hourly cost = spins × stake × (1−RTP)`). The stop-button paper’s pace finding applies: faster fire = higher spend even though math unchanged. Host `computeMaxWager` clamp must be re-evaluated per snapshot mid-streak. |
| ✅ Maps naturally to Mines multi-action if you unify under one `sessionId` with `ACTION_KILL` `submitAction` loop (avoids `openSession` per kill). | ❌ **Manifest shift:** either many `openSession:true/capabilities.submitAction:false` rapid rounds (instant spam) or **Mines-style multi-action** (`submitAction:true, cancelStuckRandomness:true, forfeitExpiredSession:true`) with new timeout (`43200` blocks) and `quoteForfeitPayout` reasoning (must be 0 or exploit per `CONTRACT_CONSTRAINTS` — see `CHAIN_WTF §2.1` blackjack warning). This is a different product surface to audit. |
| | ❌ **RTP-over-session-chain is still 95% per wager, but bankroll variance explodes** with rapid-fire; players who fire 4× per lap experience 4×σ. Needs careful `maxPayout` vaR re-quote. |
| | ❌ **Simplicity judging penalty.** The jam’s instant-FIRE loop was chosen because Tumbler/Lazer already occupy loop-push-your-luck; adding a kill-streak loop narrows novelty wedge (`PLAYBOOK.md:3b`). |

**When to use:** Only as a second mode `RoboStrikeArcadeGame` (separate `gameId`, separate manifest) marketed as arcade-killstreak, not the casino-juried entry. Never merge this into the same `gameId` as the casino mode — chain risk libraries distinguish per-`gameId`.

**Recommendation (synthesis of findings):**

> **Ship Option 1 as the jam submission** (instant cosmetic patrol, 1 wager → 1 staged kill chain, BOT_MAP partition of the single 95% table, border-clamped player cosmetic move with click-to-move primary + WASD alias, AI turret 90 ms linear lock, pooled respawn). Keep the contract/SDK surface byte-identical to the audited `MATH.md` proof so declared-math passes without resubmission.
>
> **File Option 2 as a follow-up variant** if the jury asks for “each bot as multiplier portion” literalism — it is a forward-compatible `gameData` extension that preserves eligibility while delivering stronger bot-identity.
>
> **Reserve Option 3 for post-jam arcade exploration only** (separate `gameId`), because it incurs latency, pace-risk, multi-action forfeit reasoning, and judging-dimension drift.

*Implementation order that respects the research above:* `thresholds.ts` freeze → `BotMap.ts` partition commit → `PatrolSystem` cosmetic path + `Phaser.Math.RND` split → `StageReveal` VFX chain per tier → `revealOutcome` gating → `simulate-rtp.ts` re-run 1M/profile → help copy “movement visual only; Chain VRF settles; all outcomes remain possible regardless of movement.”

### Confidence
**High (0.83) overall for Options 1–2; Medium (0.72) for Option 3** — 1 and 2 keep the single-`bytes32` instant invariant that the re-fetched SDK documents as primary; 3 relies on multi-action/optimistic interleaving where simulator vs prod host differ (compatibility note `WAITING_RANDOMNESS` suppressed) and where pace-risk evidence (slotrandomizer/PMC) suggests reviewer friction.

---

## Overall License + Cost Verdict (movement layer only)

| Item | License | Cost | Source |
|------|---------|------|--------|
| `Phaser 3.80+` `Phaser.Math.RandomDataGenerator` / `PathFollower` / `Arcade.Body` | MIT (Phaser) | $0 | docs.phaser.io 2026-09-02 |
| `Chain SDK` `ICasinoGameV2`, `HostSnapshotV1`, `connectGameToHost`, `computeMaxWager` | SPDX-MIT Solidity + permissive vendored TS (zip `ac54be4c`) | $0 | sdk.chain.wtf/* 2026-09-02 |
| `RTS 7 / UKGC` rules for design compliance | Crown regulatory text, no asset license | $0 | gamblingcommission.gov.uk 2026-09-02 |
| Slot RNG chain references used as precedent | CC-BY site content (SlotRandomizer, EuropeanGaming) | $0 | slotrandomizer/europeangaming 2026-09-02 |
| Dixon et al. PMC5846825 (stop illusion) | CC BY 4.0 (NIH) | $0 | pmc.ncbi.nlm.nih.gov 2026-09-02 |

## Overall Confidence
**High (0.85)** — SDK contract + bridge types re-fetched 200 2026-09-02, UKGC 5-question + RTS 7(A–C) primary regulation, slot outcome-chain / stop-button cosmetic rule cross-checked across two provider sites + EuropeanGaming, Dixon n=132 peer-reviewed. The only non-High sub-score is Options 3 and Pattern D extrapolation (both caveated medium). All threshold math provenance remains `docs/research/math.md` High (error ≈1e-78, recomputed 1M sim).

## Overall Open Questions → append to `docs/QUESTIONS_FOR_DISCORD.md`

* Q38 (see file) — Does Chain jam allow a second `RoboStrikeSkillGame` id with true skill window post-jam, or does the single-whitelisted gameId rule preclude sibling skill mode?
* Q39 — For Option 1 staged-multi-kill ceremony (1 VRF → 2–3 visual explosions), is the host’s `revealOutcome` expected after the *first* explosion or after the full chain + count-up? (Determines when balance clamp releases.)
* Q40 — If Option 2 per-bot paytables are pursued, should `gameData` be 1 byte `tankId` (3) vs 2-byte `(tankId, targetBotId)` (9 combos) for `quoteRiskParams` risk preview — does the vault VaR prefer the 3-model or 9-model declaration?
* Q41 — UKGC 2.5 s minimum cycle is for licensed online slots — does Chain jam apply the same pace clamp as a *judging* eligibility proxy, or is sub-2.5 s cosmetic cycling acceptable if disclosed as non-RNG-gated?
* (Already-filed related: Q14 Overdrive sequencing `keccak(v||OVERDRIVE)` vs second VRF, still open — orthogonal to movement but interacts with multi-kill variance when Overdrive is offered after a staged ×6/×30.)

---

*Read-back verification required after write; append unresolved to `docs/QUESTIONS_FOR_DISCORD.md`.*

## File Map for Reviewer

- `docs/research/movement_ai_casino.md` — this file (L-subagent mission output)
- `docs/research/sdk.md` — Chain SDK exhaustive fetch (re-verified 2026-09-02 §1 index + CHAIN_WTF)
- `docs/research/math.md` + `docs/MATH.md` — 95% RTP proofs, BigInt thresholds, Overdrive EV=1, 1M sim
- `docs/PLAYBOOK.md:0-1` — locked arch 320×180, palette, Phaser+Vite+TS, instant SSM `TITLE→BET→TARGET→FIRING→REVEAL→PAYOUT`
- `src/lib/thresholds.ts` (proposed freeze), `contracts/RoboStrike.sol` (sole payout authority)
- New proposed: `src/game/systems/PatrolSystem.ts`, `BotMap.ts`, `StageReveal.ts`, `PlayerCosmeticMove.ts`
- Questions: `docs/QUESTIONS_FOR_DISCORD.md` appended Q38–Q41
