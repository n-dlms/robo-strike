// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./ICasinoGameV2.sol";

/// @title RoboStrikeGame, retro tank casino (Chain Jam Vol. 1)
/// @notice Instant game: pick 1 of 3 WW2 tanks (volatility choice, NOT skill),
///         FIRE once, Chain VRF decides. RTP = 95% on every tank.
///         SCOUT   [55,85,95,99,100]% → ×0, ×0.7, ×2,  ×6,  ×30  (Σ = 0.95 exactly)
///         BRUISER [65,85,94,99,100]% → ×0, ×0.9, ×3,  ×7,  ×15  (Σ = 0.95 exactly)
///         WARLORD [78,90,96,99,100]% → ×0, ×1,   ×6,  ×12, ×11  (Σ = 0.95 exactly)
///         Overdrive (post-win ≥2×, committed in gameData before VRF): 40% → ×2.5,
///         else forfeit win. E = 0.4·2.5 = 1.0 exactly, EV-neutral, RTP unchanged
///         for any strategy (linearity of expectation; martingale side-bet).
/// @dev Outcome mapping is unbiased BigInt thresholds: T_i = floor(b_i·2^256/100),
///      outcome = first i where v < T_i. No floats, no modulo bias (2^256 domain
///      is partitioned exactly; floor error ≤ 1/2^256 per threshold, see
///      scripts/simulate-rtp.ts 1M-round gate + tests/paytables.test.ts).
///      Overdrive sub-roll derives from the SAME VRF word:
///      v_od = uint256(keccak256(abi.encode(randomness, "ROBO_OVERDRIVE")))
///      (single-VRF instant pattern: only this function would change if a
///      second VRF step were ever needed).
contract RoboStrikeGame is ICasinoGameV2 {
    // ---- gameData: 32-byte ABI word of a single uint8 (same as the SDK coinflip
    // ---- example's encodeAbiParameters output): byte 31 = tankId (0=SCOUT,
    // ---- 1=BRUISER, 2=WARLORD), bit 7 = player pre-commits to Overdrive on
    // ---- qualifying wins (≥2×).
    uint8 internal constant TANK_SCOUT = 0;
    uint8 internal constant TANK_BRUISER = 1;
    uint8 internal constant TANK_WARLORD = 2;
    uint8 internal constant MAX_TANK = 2;
    uint8 internal constant OVERDRIVE_FLAG = 0x80;

    string internal constant OD_SALT = "ROBO_OVERDRIVE";

    // ---- Paytable thresholds: floor(b·2^256/100) as literals (audit copy-paste,
    // ---- identical to src/config/paytables.ts THRESHOLDS, CI-asserted). ----
    // 2^256 overflows uint256: the last threshold is the sentinel
    // type(uint256).max handled with an INCLUSIVE check on the final bucket.
    // JS domain [0, 2^256) with T_last=2^256 exclusive ≡ Sol domain
    // [0, 2^256-1] with sentinel inclusive, no value maps differently.
    uint256 internal constant SCOUT_T0 =
        63685649080523907482964041754778349319298491566102310221701671204352221301964;
    uint256 internal constant SCOUT_T1 =
        98423275851718766110035337257384721675279486965794479433538946406726160193945;
    uint256 internal constant SCOUT_T2 =
        110002484775450385652392435758253512460606485432358535837484704807517473157939;
    uint256 internal constant SCOUT_T3 =
        114634168344943033469335275158601028774737284818984158399063008167833998343536;

    uint256 internal constant BRUISER_T0 =
        75264858004255527025321140255647140104625490032666366625647429605143534265958;
    uint256 internal constant BRUISER_T1 =
        98423275851718766110035337257384721675279486965794479433538946406726160193945;
    uint256 internal constant BRUISER_T2 =
        108844563883077223698156725908166633382073785585702130197090128967438341861539;
    uint256 internal constant BRUISER_T3 =
        114634168344943033469335275158601028774737284818984158399063008167833998343536;

    uint256 internal constant WARLORD_T0 =
        90317829605106632430385368306776568125550588039199639950776915526172241119150;
    uint256 internal constant WARLORD_T1 =
        104212880313584575881213886507819117067942986199076507635511825607121816675942;
    uint256 internal constant WARLORD_T2 =
        111160405667823547606628145608340391539139185279014941477879280647596604454338;
    uint256 internal constant WARLORD_T3 =
        114634168344943033469335275158601028774737284818984158399063008167833998343536;

    // ---- Multipliers in basis points of the wager (×0.7 = 7000 bps) ----
    uint256 internal constant MULT_MISS = 0;
    uint256 internal constant MULT_SCOUT_GLANCE = 7000;
    uint256 internal constant MULT_SCOUT_SOLID = 20000;
    uint256 internal constant MULT_SCOUT_CRIT = 60000;
    uint256 internal constant MULT_SCOUT_JACKPOT = 300000;
    uint256 internal constant MULT_BRUISER_GLANCE = 9000;
    uint256 internal constant MULT_BRUISER_SOLID = 30000;
    uint256 internal constant MULT_BRUISER_CRIT = 70000;
    uint256 internal constant MULT_BRUISER_JACKPOT = 150000;
    uint256 internal constant MULT_WARLORD_GLANCE = 10000;
    uint256 internal constant MULT_WARLORD_SOLID = 60000;
    uint256 internal constant MULT_WARLORD_CRIT = 120000;
    uint256 internal constant MULT_WARLORD_JACKPOT = 110000;
    uint256 internal constant BPS_DEN = 10000;
    uint256 internal constant RTP_BPS = 9500; // declared 95%

    // ---- Overdrive: 40% → ×2.5 (E = 0.4·2.5 = 1.0 exactly) ----
    uint256 internal constant OVERDRIVE_T =
        46316835694926478169428394003475163141307993866256225615783033603165251855974; // floor(40·2^256/100)
    uint256 internal constant OVERDRIVE_MULT_NUM = 5;
    uint256 internal constant OVERDRIVE_MULT_DEN = 2;

    error RoboStrikeGame__InvalidGameData();
    error RoboStrikeGame__NoPlayerAction();

    /// @notice Resolve tankId from gameData (low 7 bits; bit 7 = Overdrive commit).
    function _decodeTank(uint8 raw) internal pure returns (uint8 tank, bool wantsOverdrive) {
        tank = raw & ~OVERDRIVE_FLAG;
        wantsOverdrive = (raw & OVERDRIVE_FLAG) != 0;
        if (tank > MAX_TANK) revert RoboStrikeGame__InvalidGameData();
    }

    /// @notice Unbiased threshold mapping, mirrors mapVrfToOutcome in TS exactly.
    function _mapOutcome(uint256 v, uint8 tank) internal pure returns (uint8 outcome) {
        if (tank == TANK_SCOUT) {
            if (v < SCOUT_T0) return 0;
            if (v < SCOUT_T1) return 1;
            if (v < SCOUT_T2) return 2;
            if (v < SCOUT_T3) return 3;
            return 4; // sentinel bucket: v in [SCOUT_T3, 2^256), inclusive top
        }
        if (tank == TANK_BRUISER) {
            if (v < BRUISER_T0) return 0;
            if (v < BRUISER_T1) return 1;
            if (v < BRUISER_T2) return 2;
            if (v < BRUISER_T3) return 3;
            return 4;
        }
        // TANK_WARLORD
        if (v < WARLORD_T0) return 0;
        if (v < WARLORD_T1) return 1;
        if (v < WARLORD_T2) return 2;
        if (v < WARLORD_T3) return 3;
        return 4;
    }

    /// @notice Base multiplier bps per (tank, outcome), paytable single source.
    function _multBps(uint8 tank, uint8 outcome) internal pure returns (uint256) {
        if (tank == TANK_SCOUT) {
            if (outcome == 1) return MULT_SCOUT_GLANCE;
            if (outcome == 2) return MULT_SCOUT_SOLID;
            if (outcome == 3) return MULT_SCOUT_CRIT;
            if (outcome == 4) return MULT_SCOUT_JACKPOT;
            return MULT_MISS;
        }
        if (tank == TANK_BRUISER) {
            if (outcome == 1) return MULT_BRUISER_GLANCE;
            if (outcome == 2) return MULT_BRUISER_SOLID;
            if (outcome == 3) return MULT_BRUISER_CRIT;
            if (outcome == 4) return MULT_BRUISER_JACKPOT;
            return MULT_MISS;
        }
        if (outcome == 1) return MULT_WARLORD_GLANCE;
        if (outcome == 2) return MULT_WARLORD_SOLID;
        if (outcome == 3) return MULT_WARLORD_CRIT;
        if (outcome == 4) return MULT_WARLORD_JACKPOT;
        return MULT_MISS;
    }

    /// @notice Worst-case payout for a tank = jackpot multiplier × wager.
    function _maxMultBps(uint8 tank) internal pure returns (uint256) {
        if (tank == TANK_SCOUT) return MULT_SCOUT_JACKPOT; // 30×
        if (tank == TANK_BRUISER) return MULT_BRUISER_JACKPOT; // 15×
        return MULT_WARLORD_CRIT > MULT_WARLORD_JACKPOT ? MULT_WARLORD_CRIT : MULT_WARLORD_JACKPOT; // 12×
    }

    function quoteCaps(uint256 wager, bytes calldata gameData)
        external
        view
        returns (uint256 maxEscrowStake, uint256 maxReservedProfit)
    {
        if (gameData.length != 32) revert RoboStrikeGame__InvalidGameData();
        (uint8 tank, ) = _decodeTank(uint8(gameData[0]));
        uint256 maxPayout = (wager * _maxMultBps(tank)) / BPS_DEN;
        // Instant game: vault escrows the wager, reserves the worst-case profit.
        maxEscrowStake = wager;
        maxReservedProfit = maxPayout > wager ? maxPayout - wager : 0;
    }

    function quoteRiskParams(uint256 wager, bytes calldata gameData)
        external
        view
        returns (
            uint256 maxPayout,
            uint256 probabilityWad,
            uint256 expectedPayout,
            uint256 subJackpotVarianceScaled
        )
    {
        if (gameData.length != 32) revert RoboStrikeGame__InvalidGameData();
        (uint8 tank, ) = _decodeTank(uint8(gameData[0]));
        maxPayout = (wager * _maxMultBps(tank)) / BPS_DEN;
        // Top tier (jackpot) probability only: 1% = 0.01e18 WAD on every tank.
        probabilityWad = 1e16;
        expectedPayout = (wager * RTP_BPS) / BPS_DEN; // 0.95 × wager
        // Max payout 30× < 100× heavy-tail threshold, no tiered reserve.
        subJackpotVarianceScaled = 0;
    }

    /// @notice Instant pattern: validate, reserve worst-case profit, request VRF.
    /// @dev Called twice by the facet (sessionId==0 simulation, then real id).
    ///      Pure function of ctx fields, no state, consistent across both calls.
    function onSessionStart(SessionContext calldata ctx) external view returns (StepResult memory sr) {
        if (ctx.gameData.length != 32) revert RoboStrikeGame__InvalidGameData();
        uint8 raw = uint8(ctx.gameData[31]);
        (uint8 tank, ) = _decodeTank(raw);
        uint256 maxPayout = (ctx.wagerBase * _maxMultBps(tank)) / BPS_DEN;
        uint256 maxReservedProfit = maxPayout > ctx.wagerBase ? maxPayout - ctx.wagerBase : 0;
        // gameState: tankId | outcome=0 placeholder | od flags | randomness=0
        // (not delivered yet). Layout matches src/config/paytables.ts
        // encodeGameState (5 ABI words); randomness==0 → frontend keeps waiting.
        sr.newGameState = abi.encode(tank, uint8(0), false, false, bytes32(0));
        sr.escrowDelta = 0;
        sr.reservedProfitDelta = int256(maxReservedProfit);
        sr.nextPhase = SessionPhase.WAITING_RANDOMNESS;
        sr.requestRandomnessNow = true;
    }

    /// @notice Pure instant game, no mid-round player action exists.
    function onPlayerAction(SessionContext calldata, bytes calldata) external pure returns (StepResult memory) {
        revert RoboStrikeGame__NoPlayerAction();
    }

    /// @notice Sole outcome authority: consume the VRF word, map via thresholds,
    ///         optionally run the committed Overdrive sub-roll, settle instantly.
    function onRandomness(SessionContext calldata ctx, bytes32 randomness)
        external
        view
        returns (StepResult memory sr)
    {
        if (ctx.gameData.length != 32) revert RoboStrikeGame__InvalidGameData();
        uint8 raw = uint8(ctx.gameData[31]);
        (uint8 tank, bool wantsOverdrive) = _decodeTank(raw);

        uint256 v = uint256(randomness);
        uint8 outcome = _mapOutcome(v, tank);
        uint256 multBps = _multBps(tank, outcome);

        // Overdrive: player committed at openSession, applies only to wins ≥2×.
        // Sub-roll derived from the same VRF word (deterministic, judge-auditable).
        bool odTaken = false;
        bool odWon = false;
        if (wantsOverdrive && multBps >= 20000) {
            odTaken = true;
            uint256 vOd = uint256(keccak256(abi.encode(randomness, OD_SALT)));
            if (vOd < OVERDRIVE_T) {
                odWon = true;
                multBps = (multBps * OVERDRIVE_MULT_NUM) / OVERDRIVE_MULT_DEN;
            } else {
                multBps = 0;
            }
        }

        uint256 payout = (ctx.wagerBase * multBps) / BPS_DEN;

        sr.newGameState = abi.encode(tank, outcome, odTaken, odWon, randomness);
        sr.escrowDelta = 0;
        sr.reservedProfitDelta = -int256(ctx.reservedProfit); // release full reserve
        sr.nextPhase = SessionPhase.SETTLED;
        sr.requestRandomnessNow = false;
        sr.payout = payout;
    }

    /// @notice No anytime cash-out exists: outcome depends on unresolved
    ///         randomness. Returning non-zero here would be an adverse-selection
    ///         exploit against the vault (CONTRACT_CONSTRAINTS.md).
    function quoteForfeitPayout(SessionContext calldata) external pure returns (uint256) {
        return 0;
    }
}
