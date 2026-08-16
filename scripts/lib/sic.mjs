/**
 * SIC → sector classification for US filers.
 *
 * ── Why this file exists ────────────────────────────────────────────────────
 *
 * refresh-us.mjs used to carry this comment:
 *
 *   "SEC gives SIC codes, not GICS, and mapping SIC→GICS well is a project in
 *    itself; sector ETFs give a usable, free sector composite."
 *
 * The ETF composites are the right call for the sector *return series*. But
 * skipping the per-stock mapping entirely meant every US row carried
 * `sector: null`, and three things downstream failed silently:
 *
 *   1. The diversification cap buckets by sector. With one bucket the cap
 *      truncated every US board at 4 names instead of 10. That was the visible
 *      symptom, and it took a live deploy to surface it.
 *   2. Fundamental factors are documented as sector-neutral (METHODOLOGY §2.4).
 *      With one sector, sector-neutral z-scoring degenerates to plain
 *      cross-sectional z — a published methodology claim that was not true of
 *      the running code.
 *   3. `sectorStrength` (METHODOLOGY §4.3) resolves the composite by sector
 *      name, so it was null for every US name — a mid-term factor missing
 *      outright rather than merely noisy.
 *
 * ── What this mapping is, and is not ────────────────────────────────────────
 *
 * SIC is a 1930s-lineage industrial taxonomy; GICS is a modern investment
 * taxonomy. They do not agree, and no mapping between them is canonical. This
 * one is a deliberate approximation, built to match the eleven SPDR sector
 * buckets already used for the composites so that a stock's sector and its
 * sector's return series always refer to the same thing.
 *
 * Two rules govern the disagreements:
 *
 *   • Where SIC groups by *what is manufactured* and GICS groups by *who buys
 *     it*, follow GICS. SIC 3711 (motor vehicles) is Consumer Discretionary,
 *     not Industrials.
 *   • Where a range is genuinely mixed, prefer the more specific narrower rule
 *     and let the broad range catch the rest. Ranges are evaluated in order,
 *     most specific first.
 *
 * An unmapped code returns `null` — NOT a catch-all bucket. That is the same
 * principle the rest of the codebase follows for missing factors: a missing
 * sector is missing, and code downstream must treat it as an absence rather
 * than as membership in a large fictional sector. Lumping unclassified names
 * together is precisely the bug this file was written to fix.
 */

/** The eleven buckets, matching SECTOR_ETFS in refresh-us.mjs exactly. */
export const SECTORS = [
  'Information Technology',
  'Health Care',
  'Financials',
  'Consumer Discretionary',
  'Consumer Staples',
  'Energy',
  'Industrials',
  'Materials',
  'Utilities',
  'Real Estate',
  'Communication Services',
];

const IT = 'Information Technology';
const HC = 'Health Care';
const FIN = 'Financials';
const CD = 'Consumer Discretionary';
const CS = 'Consumer Staples';
const EN = 'Energy';
const IND = 'Industrials';
const MAT = 'Materials';
const UTL = 'Utilities';
const RE = 'Real Estate';
const COM = 'Communication Services';

/**
 * [lo, hi, sector] inclusive ranges, evaluated in order. Single codes are
 * written as [n, n, …]. Order matters: narrow overrides precede the broad
 * range they sit inside.
 */
const RANGES = [
  // ── Agriculture, forestry, fishing ────────────────────────────────────────
  [100, 299, CS], // crops, livestock
  [700, 799, CS], // agricultural services
  [800, 899, MAT], // forestry
  [900, 999, CS], // fishing, hunting

  // ── Mining and extraction ─────────────────────────────────────────────────
  [1000, 1119, MAT], // metal mining
  [1120, 1299, EN], // coal
  [1300, 1389, EN], // oil and gas extraction, field services
  [1390, 1499, MAT], // nonmetallic minerals

  // ── Construction ──────────────────────────────────────────────────────────
  [1520, 1549, CD], // homebuilders — GICS puts these in Consumer Discretionary
  [1500, 1519, IND],
  [1550, 1799, IND], // heavy and special-trade construction

  // ── Food, beverage, tobacco ───────────────────────────────────────────────
  [2000, 2199, CS],

  // ── Textiles, apparel, leather ────────────────────────────────────────────
  [2200, 2399, CD],

  // ── Wood, furniture, paper, printing ──────────────────────────────────────
  [2400, 2499, MAT], // lumber and wood products
  [2500, 2599, CD], // furniture and fixtures
  [2600, 2699, MAT], // paper
  [2700, 2799, COM], // publishing and printing

  // ── Chemicals and pharma ──────────────────────────────────────────────────
  [2830, 2836, HC], // drugs, biologicals, diagnostics
  [2800, 2829, MAT],
  [2840, 2899, MAT],

  // ── Petroleum refining ────────────────────────────────────────────────────
  [2900, 2999, EN],

  // ── Rubber, plastics, leather, stone, metals ──────────────────────────────
  [3011, 3011, CD], // tires
  [3000, 3010, MAT],
  [3012, 3099, MAT],
  [3100, 3199, CD], // leather and footwear
  [3200, 3399, MAT], // stone, clay, glass, primary metals
  [3400, 3499, IND], // fabricated metal products

  // ── Machinery, computers, electronics ─────────────────────────────────────
  [3570, 3579, IT], // computer and office equipment
  [3500, 3569, IND],
  [3580, 3599, IND],
  [3600, 3639, IND], // electrical industrial apparatus
  [3640, 3651, CD], // lighting, household audio and video
  [3652, 3652, COM], // prerecorded records and tapes
  [3653, 3659, CD],
  [3660, 3669, IT], // communications equipment
  [3670, 3699, IT], // semiconductors, electronic components

  // ── Transportation equipment ──────────────────────────────────────────────
  [3700, 3719, CD], // motor vehicles and parts
  [3720, 3729, IND], // aircraft and parts
  [3730, 3743, IND], // shipbuilding, railroad equipment
  [3750, 3751, CD], // motorcycles, bicycles
  [3760, 3799, IND], // guided missiles, space vehicles

  // ── Instruments ───────────────────────────────────────────────────────────
  [3826, 3826, HC], // laboratory analytical instruments
  [3841, 3851, HC], // surgical, medical, dental, ophthalmic
  [3800, 3825, IT],
  [3827, 3840, IT],
  [3852, 3859, IT],
  [3860, 3879, CD], // photographic equipment, watches
  [3880, 3899, IT],

  // ── Miscellaneous manufacturing ───────────────────────────────────────────
  [3900, 3999, CD],

  // ── Transportation and pipelines ──────────────────────────────────────────
  [4600, 4699, EN], // pipelines — GICS classifies midstream as Energy
  [4000, 4599, IND], // rail, transit, trucking, water, air
  [4700, 4799, IND], // transportation services

  // ── Communications ────────────────────────────────────────────────────────
  [4800, 4899, COM],

  // ── Utilities ─────────────────────────────────────────────────────────────
  [4950, 4959, IND], // sanitary services — waste management is Industrials
  [4900, 4949, UTL],
  [4960, 4999, UTL],

  // ── Wholesale ─────────────────────────────────────────────────────────────
  [5122, 5122, HC], // drugs and druggists' sundries
  [5140, 5149, CS], // groceries
  [5000, 5099, IND], // durable goods distributors
  [5100, 5121, IND],
  [5123, 5139, IND],
  [5150, 5199, IND],

  // ── Retail ────────────────────────────────────────────────────────────────
  [5400, 5499, CS], // food stores
  [5912, 5912, CS], // drug stores and proprietary stores
  [5200, 5399, CD],
  [5500, 5911, CD],
  [5913, 5999, CD],

  // ── Finance and insurance ─────────────────────────────────────────────────
  [6500, 6599, RE], // real estate
  [6798, 6798, RE], // REITs
  [6000, 6499, FIN], // banks, brokers, exchanges, insurance
  [6600, 6797, FIN],
  [6799, 6999, FIN], // investors, blank checks

  // ── Services ──────────────────────────────────────────────────────────────
  [7000, 7099, CD], // hotels and lodging
  [7200, 7299, CD], // personal services
  [7310, 7319, COM], // advertising
  [7370, 7379, IT], // computer programming, software, data processing
  [7300, 7309, IND],
  [7320, 7369, IND],
  [7380, 7399, IND],
  [7500, 7599, CD], // auto services and rental
  [7600, 7699, CD], // repair services
  [7800, 7841, COM], // motion pictures
  [7900, 7929, COM], // entertainment producers
  [7930, 7999, CD], // bowling, casinos, recreation

  // ── Health, education, social ─────────────────────────────────────────────
  [8000, 8099, HC], // health services
  [8200, 8299, CD], // educational services
  [8100, 8199, IND], // legal services
  [8300, 8399, HC], // social services
  [8400, 8499, COM], // museums, galleries

  // ── Professional services ─────────────────────────────────────────────────
  [8731, 8734, HC], // commercial physical and biological research
  [8700, 8730, IND],
  [8735, 8799, IND],
  [8900, 8999, IND],
];

/**
 * Map a SEC SIC code to one of SECTORS.
 *
 * @param {number|string|null|undefined} sic
 * @returns {string|null} sector name, or null when unmapped/unclassifiable.
 *   9995 ("non-classifiable establishments") and 6770-style shells that SEC
 *   leaves blank both land here, and callers must treat null as an absence.
 */
export function sectorForSic(sic) {
  const n = typeof sic === 'string' ? Number.parseInt(sic, 10) : sic;
  if (!Number.isFinite(n) || n <= 0) return null;
  for (const [lo, hi, sector] of RANGES) {
    if (n >= lo && n <= hi) return sector;
  }
  return null;
}

/** True when `s` is one of the eleven recognised buckets. */
export function isKnownSector(s) {
  return typeof s === 'string' && SECTORS.includes(s);
}
