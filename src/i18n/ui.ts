/**
 * All user-facing copy lives here.
 *
 * `ko` is typed as `typeof en`, so adding an English string without a Korean
 * one is a type error. That plus the shared view components in src/views/pages
 * is what stops the two languages drifting apart.
 *
 * Note what that constraint does and does not require. It forces both languages
 * to have the same SHAPE — the same keys, the same nesting. It does not force
 * the same content, and `sections` is an array precisely so a page can have a
 * different number of sections in each language. The Korean privacy policy uses
 * that: it is a 개인정보처리방침 written to PIPA's disclosure list, not a
 * translation of the English one, because the two legal regimes ask for
 * different things.
 */

/**
 * One section of a legal/policy page: a heading, body paragraphs, and outbound
 * links that belong to that section rather than to a link dump at the bottom.
 * Annotated explicitly so `links` stays optional per section without the
 * inferred element type becoming a union that `ko` cannot satisfy.
 */
export type LegalSection = {
  h: string;
  p: string[];
  links?: { label: string; url: string }[];
};

const en = {
  /* chrome */
  skipToContent: 'Skip to content',
  nav: {
    home: 'Leaderboard',
    methodology: 'Methodology',
    performance: 'Performance',
    news: 'News',
    simulator: 'Simulator',
    sectors: 'Sectors',
    blog: 'Research',
    alerts: 'Alerts',
    about: 'About',
    disclaimer: 'Disclaimer',
    privacy: 'Privacy',
    terms: 'Terms',
    editorial: 'Editorial policy',
    contact: 'Contact',
  },
  theme: { label: 'Theme', light: 'Light', dark: 'Dark', system: 'System', toggle: 'Switch colour theme' },
  langSwitch: 'View in Korean',
  langSwitchShort: '한국어',
  langSwitchFallback: 'This page has no Korean version — go to the Korean site',
  menu: 'Menu',
  footerLegal: 'Legal',
  /* Re-opens the consent dialog. Rendered only when a CMP is actually loaded. */
  cookieSettings: 'Cookie settings',

  /* compliance — legally load-bearing, do not paraphrase */
  compliance:
    'All content is market research and educational information, not personalized financial advice. StockPulse is not a registered investment adviser. Rankings are the mechanical output of a published rule set, not predictions. You may lose money. Do your own research.',
  complianceHeading: 'Important notice',
  footerDisclaimer:
    'Market research and education only. Not investment advice, not a registered investment adviser, and not a prediction.',
  dataAsOf: 'Data as of',
  builtOn: 'Rule set version',

  /* placeholder */
  placeholderTitle: 'Placeholder data in use',
  placeholderSome: 'Synthetic sample data on this page — not real market data, and nothing in it describes any real security:',
  placeholderReal: 'Real pipeline output on this page:',
  placeholderFlagNote:
    'Each data file carries its own placeholder flag and this notice reads those flags, so it is accurate per dataset rather than for the page as a whole.',
  datasetName: {
    rankings: 'Rankings',
    news: 'News',
    performance: 'Performance',
    sectors: 'Sectors',
    health: 'Source health',
  },

  /* home */
  home: {
    title: 'Daily leaderboards',
    intro:
      'Four rule-based equity screens, recomputed every session. Each board is the mechanical top 10 of a published scoring formula — not a prediction, and not a recommendation to buy anything.',
    market: 'Market',
    horizon: 'Horizon',
    asOf: 'Close of',
    turnover: '30-day turnover',
    turnoverHelp: 'Share of the board replaced over the last 30 days. High is expected on short horizons.',
    eodNote:
      'All data is end-of-day. A board published after the close is actionable at the next session’s open at the earliest, and the performance audit fills at that session’s (open + close) ÷ 2.',
    sampleWarning:
      'This horizon has fewer than 30 closed positions in the audit. Treat its statistics as illustrative, not evidence.',
    emptyBoard: 'This board is not published yet.',
    emptyBoardHeading: 'Nothing published for this board',
    emptyBoardWhy: 'Why',
    emptyBoardCode: 'Reason code',
    emptyBoardFooter:
      'This is the intended behaviour, not an outage. The other boards on this market are unaffected.',
    columns: {
      rank: 'Rank',
      stock: 'Stock',
      price: 'Price',
      trend: '30d',
      score: 'Score',
      levels: 'Entry / Stop',
      targets: 'Targets',
      risk: 'Risk',
      catalyst: 'Catalyst',
      detail: 'Factors',
    },
    movementNew: 'NEW',
    movementNewLabel: 'New entry to this board',
    movementUp: 'Up {n} places',
    movementDown: 'Down {n} places',
    movementFlat: 'Unchanged',
    entryZone: 'Entry zone',
    stop: 'Stop',
    noStop: 'No price stop',
    noStopExplain:
      'Long-horizon positions are not managed with a price stop. A 15% drawdown is noise over five years; a broken thesis is not. The position closes when one of these becomes true:',
    invalidation: 'Thesis invalidation',
    targetBand: 'Target band',
    targetConservative: 'Conservative',
    targetBase: 'Base',
    targetBull: 'Bull',
    noTargets: 'No price targets — a 5–10 year price target is a fiction. Judged on the compounding thesis instead.',
    targetBasisLabel: {
      atr: 'ATR-multiple targets',
      fair_value_band: 'Two-year fair-value band',
      compounding_scenarios: 'Seven-year compounding scenarios',
    },
    targetBasisHelp: {
      atr: 'Each tier is a multiple of the stock’s own average true range added to the close — 1.0×, 1.8×, 3.0×. Volatility-scaled, so a utility and a biotech get different bands from the same rule. These are levels the exit logic acts on, not a view about where the stock is going.',
      fair_value_band:
        'A discounted fair-value range over one to two years, computed under conservative, base and optimistic assumptions for growth, margin and exit multiple. It is a range produced by stated assumptions, not a price call, and the position exits on the thesis rather than on any of these numbers.',
      compounding_scenarios:
        'Not a price target. Three scenarios for what the business compounds to over five to ten years under stated assumptions for revenue growth, margin and exit multiple. A 5–10 year price target is a fiction; the scenario band is what the methodology publishes instead, and it says "if these assumptions hold, this is the arithmetic" — nothing about whether they will hold.',
    },
    targetBasisShort: {
      atr: 'ATR multiples',
      fair_value_band: 'Fair value, 2y',
      compounding_scenarios: 'Scenario, not a forecast',
    },
    targetBasisWhat: 'What these numbers are',
    maxHold: 'Max hold',
    sessions: 'sessions',
    riskGauge: 'Risk gauge',
    riskGaugeHelp: 'Quintile of ATR ÷ price within the universe. 1 = calmest, 5 = most volatile.',
    completeness: 'Data completeness',
    completenessBadge: '{used} of {total} factors',
    completenessHelp:
      'Some factor inputs were missing for this name. Missing inputs are never filled with the mean — the score is computed on what exists and flagged here.',
    factorBreakdown: 'Factor breakdown',
    factorZ: 'z-score',
    factorRaw: 'raw',
    showFactors: 'Show factors',
    hideFactors: 'Hide factors',
    factorsShort: 'Factors',
    scrollHint: 'The table scrolls sideways — some columns are off screen.',
    scrollRegion: 'Leaderboard table, scrollable horizontally',
    scrollRegionTable: 'Table, scrollable horizontally',
    newsCount: 'headlines (7d)',
    sentiment: 'Headline sentiment',
    cluster: 'Catalyst cluster',
    flags: 'Flags',
    flagLabel: {
      partial_data: 'Partial data',
      price_limit: 'Price limit',
      stopped_out: 'Stopped out',
    },
    flagHelp: {
      partial_data:
        'Some factors were unavailable for this name, so the weights were renormalized over the ones that remained. Missing inputs are never filled with the mean — the score is computed from what exists and flagged here.',
      price_limit:
        'The stock closed at or near the KRX ±30% daily price limit, so the closing price is censored: it is where trading was halted, not where the market cleared. Anything derived from it — the change, the entry zone, the targets — is understated in the direction of the move.',
      stopped_out:
        'The published stop was breached. The position is closed in the ledger at the stop, a loss is recorded, and the name cannot re-enter for five sessions.',
    },
    evidenceLabel: 'Sentiment evidence',
    evidenceHelp: 'The lexicon terms that produced the sentiment score. Shown so you can see what it actually keyed on.',
    justMissed: 'Just missed the cut',
    justMissedIntro:
      'These names scored high enough for the top 10 but were removed by a diversification rule. The rule that removed each one is stated, so you can see the constraints working rather than take the list on trust.',
    displacedBy: {
      sector_cap: 'Sector cap — already 3 names from this sector',
      correlation_cap: 'Correlation cap — already 2 names correlated above 0.85',
      catalyst_cluster_cap: 'Catalyst cap — already 4 names on this news cluster',
    },
    heldShort: '{n} sess.',
    heldSessionsLabel: 'Sessions held',
    heldSessionsHelp:
      'On this board for {n} consecutive sessions. Fast turnover is expected on the short horizons — the setup expires. On the long horizons a low number means the list is churning when it should be stable.',
    stoppedOut: 'Left the board on their stops',
    stoppedOutIntro:
      'These names were published here, carried a stop, and had it breached. They left the board the same session and cannot re-enter for five sessions. They are shown because a site that publishes stop levels and then quietly drops the names that hit them is hiding the only outcome that matters.',
    stoppedOutFell: 'Fell from',
    stoppedOutRank: 'rank {n}',
    stoppedOutStopHit: 'Stop hit',
    stoppedOutPublished: 'Published',
    stoppedOutLast: 'Last close',
    stoppedOutCooldown: 'Locked out {n} sessions',
    stoppedOutCooldownHelp:
      'A stopped-out name records the loss and cannot return to this board for {n} sessions, so a stop-out cannot be undone by the next day’s score (METHODOLOGY §7).',
    stoppedOutLedger: 'Every one of these appears in the trade ledger',
    newsPanel: 'Related headlines',
    newsFilterOn: 'Filtered to {ticker}',
    clearFilter: 'Clear filter',
    filterHint: 'Select a ticker in the table to filter these headlines.',
    noNewsForTicker: 'No headlines matched this ticker in the current window.',
    viewAllNews: 'All news',
    refreshed: 'Live figures refreshed',
    newPublish: 'A newer ranking has been published. Reload for the full board.',
    reload: 'Reload',
    openBoard: 'Open this board',
    allBoards: 'All boards',
    boardPermalink: 'This board, full page',
  },

  /* regime banner */
  regime: {
    heading: 'Market regime',
    breadth: 'Breadth above 200DMA',
    indexAbove: 'Index above its 200-day average',
    yes: 'Yes',
    no: 'No',
    unknown: 'Unknown',
    multiplier: 'Score multiplier',
    state: {
      risk_on: 'Risk on',
      narrowing: 'Narrowing',
      caution: 'Caution',
      risk_off: 'Risk off',
      unknown: 'Unknown',
    },
    body: {
      risk_on: 'The index is above its 200-day average and more than half the universe is participating. Normal conditions.',
      narrowing:
        'The index is holding above its 200-day average, but fewer than half its members are. Leadership is narrowing, which historically precedes drawdowns more often than it precedes advances. Scores are scaled to 0.85.',
      caution:
        'The index is below its 200-day average. This board is being published into a hostile tape. The indicated response is reduced position size — not a different stock. Scores are scaled to 0.70.',
      risk_off:
        'The index is below its 200-day average and breadth has collapsed. This board is being published into a hostile tape. The indicated response is zero new risk. A screen output is not a reason to buy in this regime; "nothing" is a position, and no short side exists here to express the alternative. Scores are scaled to 0.50.',
      unknown: 'Not enough index history to classify the regime today. Scores are unscaled.',
    },
    sizing: 'Indicated position sizing',
    sizingValue: {
      risk_on: 'Normal',
      narrowing: 'Reduced',
      caution: 'Substantially reduced',
      risk_off: 'None — no new entries indicated',
      unknown: 'Unclassified',
    },
  },

  /* methodology */
  methodology: {
    title: 'Methodology',
    intro:
      'The complete rule set, published in advance so that every number on this site can be traced to a rule rather than an opinion. This is the document the pipeline implements, reproduced verbatim.',
    version: 'Version',
    summaryHeading: 'Summary in Korean',
    tocHeading: 'Contents',
    fullHeading: 'The rule set in full',
  },

  /* performance */
  perf: {
    title: 'Performance audit',
    intro:
      'Every published entry is written to an append-only ledger at publication time and closed on its published rules. Nothing is removed retroactively. An entry published in error is marked void with a reason and still shown.',
    winRate: 'Win rate',
    controlWinRate: 'Random-selection control',
    controlHelp:
      'The same number of entries drawn at random from the same universe on the same dates. A win rate only means something next to this.',
    meanReturn: 'Mean return',
    benchmarkReturn: 'Benchmark',
    benchmarkHelp: 'Same-period buy-and-hold of SPY (US) / KOSPI (KR). In a rising market a monkey posts a good win rate.',
    medianReturn: 'Median return',
    excessReturn: 'Excess vs benchmark',
    maxDrawdown: 'Max drawdown',
    avgHold: 'Avg hold',
    days: 'days',
    picks: 'Entries',
    filled: 'Filled',
    noFill: 'Never filled',
    noFillHelp:
      'Entries whose entry zone was never touched at the next session’s fill price. They earn nothing and are excluded from returns — this is how much of the theoretical performance was unreachable.',
    equityCurve: 'Equity curve',
    equityHelp:
      'Equal-weight portfolio of all filled entries, net of costs, indexed to 100. Benchmark overlaid on the same scale.',
    strategy: 'StockPulse',
    benchmark: 'Benchmark',
    byHorizon: 'By horizon',
    ledger: 'Trade ledger',
    ledgerIntro: 'Every entry, including the ones that lost and the ones that never filled.',
    filterMarket: 'Market',
    filterHorizon: 'Horizon',
    filterStatus: 'Status',
    all: 'All',
    sortBy: 'Sort by',
    noResults: 'No trades match these filters.',
    showing: 'Showing {n} of {total} rows',
    cols: {
      date: 'Published',
      market: 'Market',
      horizon: 'Horizon',
      ticker: 'Ticker',
      rank: 'Rank',
      entry: 'Entry',
      exit: 'Exit',
      exitDate: 'Exit date',
      reason: 'Exit reason',
      ret: 'Return',
      net: 'Net',
      bench: 'Benchmark',
      hold: 'Hold',
      status: 'Status',
    },
    exitReason: {
      stop: 'Stop hit',
      target: 'Target hit',
      max_hold: 'Max hold',
      forced: 'Forced exit',
      open: 'Open',
    },
    status: { closed: 'Closed', open: 'Open', no_fill: 'No fill', void: 'Void' },
    sampleWarnTitle: 'Fewer than 30 closed positions',
    sampleWarnAffected: 'Affected horizons:',
    sampleWarnCount: '{n} closed',
    sampleWarnBody:
      'Below 30 closed positions these statistics are not statistically meaningful — a single outcome moves the win rate by several points. The long-horizon boards will carry this warning for years, which is the honest state of affairs, not a defect.',
    openPositions: 'Open positions',
    voidNote: 'Void',
    antiGaming: 'Anti-gaming commitments',
    antiGamingItems: [
      'The ledger is append-only and lives in git. Every historical version is publicly diffable.',
      'Nothing is removed retroactively. An entry published in error is marked void with a reason, and still shown.',
      'The methodology version that produced each entry is recorded with it, so a formula change cannot silently rewrite past results.',
      'Sample-size warnings stay up until a horizon has at least 30 closed positions.',
    ],
  },

  /* news */
  news: {
    title: 'News',
    intro:
      'Headlines matched to the ranked universe. Sentiment is a lexicon score, not a language model, and it is weakly predictive at best — it is one input among many, shown here so you can judge it yourself.',
    feedHeading: 'All headlines',
    topStories: 'Top stories',
    topStoriesHelp: 'Stories carried by two or more outlets, which is a rough filter for what actually mattered.',
    outlets: 'outlets',
    stories: 'stories',
    filterTicker: 'Ticker',
    filterLang: 'Language',
    filterSentiment: 'Sentiment',
    all: 'All',
    english: 'English',
    korean: 'Korean',
    sentimentLabel: { bullish: 'Bullish', neutral: 'Neutral', bearish: 'Bearish', unknown: 'Unscored' },
    feedHealth: 'Feed health',
    feedHealthHelp: 'Which sources responded on the last pipeline run. A failing feed removes its contribution rather than being imputed.',
    feedStatus: { ok: 'OK', degraded: 'Degraded', failing: 'Failing' },
    items: 'items',
    newest: 'newest',
    hoursAgo: 'h ago',
    noResults: 'No headlines match these filters.',
    showing: 'Showing {n} of {total} headlines',
    clear: 'Clear filters',
  },

  /* simulator */
  sim: {
    title: 'Position simulator',
    intro:
      'Allocate a hypothetical amount equally across a board’s top 10 and see the position sizes, the aggregate stop-loss exposure, and what a set of outcome assumptions would produce. It is arithmetic on published levels, not a forecast.',
    amount: 'Amount to allocate',
    market: 'Market',
    horizon: 'Horizon',
    commission: 'Commission (bps per side)',
    recalc: 'Recalculate',
    inputsHeading: 'Scenario inputs',
    positions: 'Positions',
    perPosition: 'Per position',
    shares: 'Shares',
    cost: 'Cost',
    cash: 'Uninvested cash',
    cashHelp: 'Whole shares only, so a remainder is left uninvested.',
    stopExposure: 'Aggregate stop-loss exposure',
    stopExposureHelp:
      'Sum of (entry − stop) × shares across positions that have a price stop. It is what you lose if every stop triggers, before slippage and gaps. Long-horizon positions have no price stop and contribute nothing here, which does not mean they cannot fall.',
    noStopPositions: '{n} of these positions have no price stop and are excluded from that figure.',
    outcome: 'Outcome assumption',
    outcomes: { stop: 'Stop', conservative: 'Conservative', base: 'Base', bull: 'Bull', flat: 'Unchanged' },
    outcomeUnavailable: 'not published for this horizon',
    needsJs: 'The simulator is interactive and needs JavaScript. Everything else on this site works without it.',
    applyAll: 'Apply to all',
    projected: 'Projected value',
    projectedPnl: 'Projected P&L',
    commissionCost: 'Commission (round trip)',
    netPnl: 'Net P&L',
    exportJson: 'Export as JSON',
    noStorage:
      'Nothing you type here is stored. There is no database, no cookie and no browser storage — the whole scenario lives in this page’s memory and is gone when you close the tab. Use the export button to keep a copy.',
    hypothetical:
      'Hypothetical. It assumes you fill at the midpoint of the published entry zone, that every position reaches its assumed outcome, and that nothing gaps through a stop. It excludes taxes, spread, slippage, borrowing costs and currency movement. Only the commission input below is modelled.',
    emptyBoard: 'That board has no published positions to allocate across.',
    total: 'Total',
    invested: 'Invested',
    exportedAt: 'Exported',
  },

  /* sectors */
  sectors: {
    title: 'Sector capital flow',
    intro:
      'Where market value sits and how it moved. Tile area is market capitalisation; colour is the return over the selected window. This is a description of the tape, not a signal.',
    window: 'Return window',
    w1d: '1 day',
    w5d: '5 days',
    w20d: '20 days',
    legend: 'Return',
    tableFallback: 'Sector table',
    tableHelp: 'The same data as the treemap, in a form that reads correctly with a screen reader or without colour.',
    cols: {
      sector: 'Sector',
      cap: 'Market cap',
      weight: 'Weight',
      r1d: '1d',
      r5d: '5d',
      r20d: '20d',
      breadth: 'Breadth',
      adv: 'Adv / Dec',
    },
    breadthHelp: 'Share of the sector’s members that advanced.',
  },

  /* alerts */
  alerts: {
    title: 'Alerts',
    intro: 'Email and push alerts are not live yet. Here is what exists today and what is planned.',
    todayHeading: 'What you can use today',
    todayBody:
      'Every board is published as machine-readable JSON at a stable URL and as an RSS feed. Poll them, diff them, pipe them into whatever you already run. No key, no account, no rate limit beyond what GitHub Pages imposes.',
    jsonLink: 'Rankings JSON',
    newsLink: 'News JSON',
    perfLink: 'Performance JSON',
    rssLink: 'RSS feed',
    plannedHeading: 'What is planned',
    plannedBody:
      'A daily digest when a board changes, and a same-session notice when a published entry hits its stop. Both need a mail provider and an unsubscribe mechanism that actually works, neither of which is wired up.',
    formHeading: 'Register interest',
    formNote:
      'This form is not connected to anything. The button is disabled on purpose — a form that pretends to submit and quietly drops your address is worse than no form. When it is live it will store the address only to send the digest, with one-click unsubscribe.',
    emailLabel: 'Email address',
    emailPlaceholder: 'not connected yet',
    submit: 'Not yet available',
    contact: 'Until then, the feeds above are the supported way to follow the boards.',
  },

  /* about */
  about: {
    title: 'About',
    whatHeading: 'What this is',
    whatBody:
      'StockPulse computes four stock rankings a day for the US and Korean markets, using a scoring rule set that is published in full before it is applied. Every name it has ever published on a board is tracked to its exit and reported, including the ones that lost.',
    whatNotHeading: 'What this is not',
    whatNotBody:
      'It is not advice, it is not a tip service, and it does not know what a stock will do. A screen output says "these ranked highest on this rule set today", which is a much smaller claim than it looks like at a glance and is deliberately the only claim made.',
    howHeading: 'How it works',
    howBody:
      'Every factor is converted to a cross-sectional z-score within the day’s universe before any weighting, because raw indicators in different units cannot be added. Data is point-in-time — a score for a given date may only use data published on or before it. Exit rules are written before entry and the audit closes positions on those rules with no discretion.',
    dataHeading: 'Data and sources',
    dataBody:
      'Prices, fundamentals and news come from public sources. Coverage is uneven, especially for Korean fundamentals, and the site says so rather than papering over it. Source reliability for the most recent run is published below.',
    sourceHealth: 'Source health (last run)',
    successRate: 'Success rate',
    notes: 'Notes',
    openHeading: 'Open by construction',
    openBody:
      'The rule set, the ledger and the site source live in the same repository. If a number here is wrong, the code that produced it is readable and the history is diffable.',
    limitsHeading: 'Known limitations',
    contactHeading: 'Contact',
  },

  /* disclaimer */
  disclaimer: {
    title: 'Disclaimer',
    lead:
      'Read this before you act on anything here. It is written in plain language because a disclaimer nobody can read protects nobody.',
    sections: [
      {
        h: 'This is not investment advice',
        p: [
          'Everything on this site is market research and educational information published to the general public. It is not personalized financial advice and it is not a recommendation to buy, sell or hold any security.',
          'Nothing here accounts for your income, your tax position, your existing holdings, your time horizon, your liquidity needs or your tolerance for loss. A ranking that ignores all of that cannot be advice to you specifically, and it is not offered as such.',
        ],
      },
      {
        h: 'No adviser registration',
        p: [
          'StockPulse is not a registered investment adviser, broker-dealer, or financial planner in any jurisdiction. Its operator is not licensed to give investment advice and does not give it.',
          'US readers: the Investment Advisers Act contains a publisher’s exclusion for bona fide publications of general and regular circulation that do not give advice tailored to individual clients. This site is built to sit inside that exclusion — impersonal, published on a regular schedule, identical for every reader. That is a description of intent, not a legal opinion, and the exclusion is narrower than people assume.',
          'Korean readers: 유사투자자문업 rules apply to businesses that provide investment information to unspecified persons for a fee, and carry reporting obligations to the Financial Supervisory Service. This site is free and impersonal. If it ever charges for access or provides individualized responses, those rules would need to be addressed first.',
        ],
      },
      {
        h: 'Rankings are mechanical output, not predictions',
        p: [
          'The boards are the output of a scoring formula published in advance. A stock at rank 1 is the stock that scored highest on that formula today. That is the entire claim.',
          'The formula was reasoned from published research, not optimized against this data. That avoids one failure mode (overfitting) and accepts another (the weights are not tuned). Four horizons across dozens of factors and two markets is a large search space, and some of what looks like signal in any such exercise is chance.',
        ],
      },
      {
        h: 'Past performance does not predict future results',
        p: [
          'The performance page is a record of what the published rules produced on past dates under a specific fill convention, net of modelled costs. It is not a projection and it does not compound into a promise.',
          'Sample sizes are small, especially on the long horizons, where a meaningful record takes years to accumulate. Where a horizon has fewer than 30 closed positions the site says so on the page.',
        ],
      },
      {
        h: 'Positions and conflicts',
        p: [
          'The operator may or may not hold positions in securities that appear on these boards, and makes no representation either way. Assume a conflict of interest may exist and weigh the content accordingly.',
          'The site takes no payment from any issuer, fund, broker or promoter to include, exclude, or rank any security. If that ever changes it will be disclosed on this page before it takes effect, not after.',
        ],
      },
      {
        h: 'The data may be delayed, wrong, or missing',
        p: [
          'Data comes from public sources that go down, rate-limit, change format, and occasionally publish errors. Corporate actions, ticker changes, delistings and restatements can all land late or not at all.',
          'When a source fails, the affected factor is dropped rather than filled with an average, and the affected name is flagged as having partial data. This is the honest handling, but it means scores are not always computed from identical inputs.',
          'No warranty of accuracy, completeness or fitness for any purpose is given. Verify anything you intend to act on against a primary source.',
        ],
      },
      {
        h: 'Everything here is end-of-day',
        p: [
          'There is no intraday or pre-market data anywhere in this system. A board computed from a session’s closing prices and published after the close cannot be acted on before the next session opens.',
          'The performance audit reflects this: a position is only filled if the next session’s (open + close) ÷ 2 falls inside the published entry zone, and is otherwise recorded as never filled. Prices you see quoted here are historical by construction, not live quotes.',
        ],
      },
      {
        h: 'You can lose money',
        p: [
          'Equities can fall to zero. Stop levels are not guarantees — a gap through a stop fills below it, and in a fast market well below it. Long-horizon positions carry no price stop at all by design.',
          'Do not commit money you cannot afford to lose. If you need advice for your own situation, get it from a licensed professional who is accountable to you.',
        ],
      },
      {
        h: 'A note to whoever operates this site',
        p: [
          'If you monetize this — subscriptions, sponsorship, affiliate links, a paid tier, anything — the regulatory analysis changes materially in both the US and Korea, and the publisher’s exclusion reasoning above may stop applying. Consult a securities lawyer in each jurisdiction you serve before you take the first payment, not after.',
          'The same applies before adding anything that responds to an individual reader’s circumstances, including a chatbot, a questionnaire that outputs a portfolio, or personalized alerts.',
        ],
      },
    ],
    contactNote: 'Questions about this notice:',
  },

  /* ── privacy ───────────────────────────────────────────────────────────────
     The one page AdSense explicitly requires. The Google-supplied wording in
     the advertising section is close to verbatim on purpose — reviewers look
     for it, and paraphrasing it is a common rejection reason. Do NOT
     "modernise" it back into the DoubleClick DART cookie boilerplate that
     circulates in 2012-era templates; Google retired that phrasing. */
  privacy: {
    title: 'Privacy Policy',
    lead:
      'What this site collects — which is close to nothing — what the web host and the ad vendor see, and what changes when advertising is switched on.',
    effectiveLabel: 'In effect since',
    adsStatusOff:
      'Advertising is not enabled on this site as it is published today. No ad script is loaded, no advertising cookie is set, and no request leaves your browser for any advertising domain. The section below describes what changes if and when advertising is switched on. It is written in advance so that the disclosure comes before the practice rather than after it.',
    adsStatusOn:
      'Advertising is enabled on this site. The section below describes what that means for the data your browser sends and how to control it.',
    sections: [
      {
        h: 'The short version',
        p: [
          'StockPulse is a static website. There are no user accounts, no login, no comments, no forum, no working newsletter, no server-side application and no database. Every page you are reading is a file that was generated in advance and is served as it stands.',
          'It collects no personal information from you directly. It sets no cookies of its own. It writes nothing to your browser’s local storage, session storage or indexed database, on any page — the position simulator does its arithmetic in the page’s memory and forgets it the moment the tab closes.',
          'No analytics package is installed. There is no analytics tag, no tracking pixel, no heatmap tool and no tag manager on this site today. If that changes, this page is updated before the tag goes live, not after.',
          'The rest of this policy covers the two things that are true anyway: a web server has to receive your request in order to answer it, and advertising — when it is switched on — is served by a third party that does use cookies.',
        ],
      },
      {
        h: 'Who is responsible',
        p: [
          'The site is operated by an individual publisher, who is the controller for the small amount of processing described here. The contact address is at the bottom of this page and is a monitored mailbox.',
          'Legal name and postal address are provided on request to anyone with a legitimate reason to ask, including a supervisory authority.',
        ],
      },
      {
        h: 'What the web host sees',
        p: [
          'These pages are served by GitHub Pages. Like every web server on the internet it receives the request your browser makes: your IP address, the user-agent string your browser sends, the URL you asked for, the referring page if your browser sends one, and the time of the request. GitHub may retain that in its own server logs.',
          'Those logs belong to GitHub, not to this site. The operator cannot read them, query them, export them or delete them, and receives no report derived from them. GitHub is the controller for that processing and its privacy statement is the authoritative account of it.',
          'This is not something you can opt out of while still loading the page: an IP address is how the response finds its way back to you.',
        ],
        links: [
          {
            label: 'GitHub Privacy Statement',
            url: 'https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement',
          },
        ],
      },
      {
        h: 'Advertising and third-party cookies',
        p: [
          'Third party vendors, including Google, use cookies to serve ads based on a user’s prior visits to this website or other websites.',
          'Google’s use of advertising cookies enables it and its partners to serve ads to users based on their visit to this site and/or other sites on the Internet.',
          'Users may opt out of personalized advertising by visiting Ads Settings. Opting out does not remove advertising; it makes the advertising you see non-personalized.',
          'If you have not opted out of third-party ad serving, the cookies of other third-party vendors or ad networks may also be used to serve ads on this site. Those vendors have their own opt-out mechanisms, and the industry pages linked below collect several of them in one place.',
          'How Google uses information from sites that use its services — what it collects, what it does with it, and how to control it — is set out in full on Google’s own page for partner sites. That page, not this one, is the authoritative description of Google’s processing.',
        ],
        links: [
          { label: 'Google Ads Settings — opt out of personalized advertising', url: 'https://www.google.com/settings/ads' },
          {
            label: 'How Google uses information from sites or apps that use its services',
            url: 'https://policies.google.com/technologies/partner-sites',
          },
          { label: 'Google Advertising privacy notice', url: 'https://policies.google.com/technologies/ads' },
          { label: 'Digital Advertising Alliance — industry opt-out', url: 'https://www.aboutads.info/choices/' },
          { label: 'Network Advertising Initiative — industry opt-out', url: 'https://optout.networkadvertising.org/' },
        ],
      },
      {
        h: 'Cookies, web beacons and other identifiers',
        p: [
          'A cookie is a small file that a site, or a third party embedded in it, asks your browser to store and send back on later requests. A web beacon — also called a pixel or a clear GIF — is a tiny, invisible resource whose only function is that loading it tells a server you loaded it. Both exist to recognize the same browser twice.',
          'When advertising is enabled, the ad tags on this site may read and write: advertising cookies and similar identifiers held by your browser; your IP address, which also indicates your approximate location; your user agent and the device, operating system and browser characteristics it exposes; the page you are on and the page you arrived from; and which advertisements were requested, shown, viewed or clicked, and when.',
          'None of that reaches the operator of this site as data about an identifiable person. It goes to the ad vendor. What comes back to the operator is aggregate reporting — impressions, clicks, revenue — with no individual in it.',
          'You can block or delete cookies in your browser’s settings, and you can browse this site with third-party cookies switched off entirely. Nothing here needs a cookie to work: no feature of the site degrades if you refuse them.',
        ],
      },
      {
        h: 'Consent in the EEA, the United Kingdom and Switzerland',
        p: [
          'If you are in the European Economic Area, the United Kingdom or Switzerland, advertising cookies are not set until you have been asked and have agreed. That request is presented by a Google-certified consent management platform registered with the IAB Europe Transparency and Consent Framework — the standard Google requires of every publisher serving advertising into those regions.',
          'The dialog is not decoration and refusing it is a real option. Refusing means the advertising you see is non-personalized. It does not mean losing access to any part of this site, and nothing here is placed behind consent.',
          'You can change or withdraw your choice at any time using the “Cookie settings” link in the footer, which re-opens the same dialog. Withdrawing is as easy as consenting, and takes effect on the next page load.',
          'That footer link appears only when advertising is actually enabled. There is no point offering to reopen a dialog that was never shown.',
        ],
      },
      {
        h: 'Your rights under the GDPR and the UK GDPR',
        p: [
          'You have the right to ask what personal data is held about you, to have it corrected or erased, to object to processing, to have it restricted, to receive a copy, and to withdraw any consent you have given. You also have the right to complain to your national data protection authority.',
          'In practice a request to this site will almost always be answered “nothing is held”. There is no visitor database, and a page view cannot be traced back to you from anything the operator has. The two places where data about you may genuinely exist are the host’s server logs and the ad vendor’s systems; both run their own request channels, and the reply you get will point you to them rather than pretend to have access.',
          'If you email the operator, the operator then holds your address and whatever you wrote — for as long as it takes to deal with your message, and for up to twelve months afterwards so that a follow-up still makes sense. Ask, and it is deleted sooner.',
        ],
      },
      {
        h: 'Children',
        p: [
          'This site publishes equity market research. It is not directed at children, contains no feature aimed at them, and knowingly collects nothing from anyone below the age of majority in their country.',
          'Where advertising is enabled, this site is not designated as child-directed content, because it is not. If you believe a child has sent personal information to the contact address, write and it will be deleted.',
        ],
      },
      {
        h: 'Readers in the United States',
        p: [
          'The operator does not sell personal information and does not share it for cross-context behavioural advertising on its own account, for the simple reason that it holds none to sell. The ad vendor’s use of advertising identifiers may nonetheless fall inside the definition of “sharing” under some state privacy laws.',
          'The controls available to you are the ones described above: the consent dialog where it applies, Google Ads Settings everywhere, the industry opt-out pages, and your browser’s own cookie controls. This site does not attempt to detect, intercept or override a Global Privacy Control signal your browser sends — the signal is passed to the ad tag along with everything else your browser sends it.',
        ],
      },
      {
        h: 'Retention',
        p: [
          'The operator retains nothing about your visit, because it receives nothing to retain. Correspondence is kept as described above. Host logs and ad-vendor data are retained on those companies’ own published schedules, which they control and this site does not.',
        ],
      },
      {
        h: 'Changes to this policy',
        p: [
          'The date this version took effect is shown at the top of the page. Any change that widens what is collected — an analytics tag, an embedded video, a comment system, a mailing list that actually sends — is described here before it ships, and the effective date is moved forward. Policy changes are not backdated.',
        ],
      },
    ] as LegalSection[],
    contactHeading: 'Privacy contact',
    contactNote:
      'Privacy questions, access requests and deletion requests go to the same address as everything else:',
  },

  /* ── terms ─────────────────────────────────────────────────────────────── */
  terms: {
    title: 'Terms of Use',
    lead:
      'The terms you accept by using this site. They are short, and the one that matters is that nothing here is advice.',
    effectiveLabel: 'In effect since',
    governingLawUnset:
      'The governing-law clause below has not been filled in yet. The bracketed text is a placeholder the operator must replace with a real jurisdiction before launch.',
    sections: [
      {
        h: 'Acceptance',
        p: [
          'By loading any page of this site you accept these terms. If you do not accept them, stop using the site — that is the only remedy either side needs, because there is nothing to cancel and no account to close.',
          'These terms sit alongside the disclaimer and the privacy policy. The disclaimer describes what the content is and is not; these terms describe the legal relationship; the privacy policy describes the data. Read all three.',
        ],
      },
      {
        h: 'The rankings are mechanical screen output',
        p: [
          'Every board on this site is the output of a scoring formula published in full, in advance, on the methodology page. A security at rank 1 is the security that scored highest on that formula on that date within a defined universe. That is the entire claim, and no larger one should be read into it.',
          'A ranking is not a prediction, not a forecast, not a price target, not a recommendation, and not a statement that a security is suitable for you or for anybody else. The formula does not know the future, and neither does the person who wrote it.',
          'No human discretion is applied to the ordering. Nobody promotes a name onto a board or takes one off it. That constraint is what makes the published performance record meaningful — and it cuts both ways: a result that looks wrong to a reader stays where the formula put it until the formula itself is changed, in public, with a version bump.',
        ],
      },
      {
        h: 'Not investment advice, and no adviser relationship',
        p: [
          'The content is general market research and educational information published to the public at large. It is not personalized investment advice and it takes no account of your objectives, financial situation, tax position, existing holdings, time horizon or capacity to absorb loss.',
          'StockPulse is not a registered investment adviser, broker-dealer, or financial planner in any jurisdiction, and its operator is not licensed to give investment advice and does not give it.',
          'Using this site creates no advisory relationship, no brokerage relationship and no client relationship of any kind, and none should be inferred from any communication with the operator.',
        ],
      },
      {
        h: 'No fiduciary duty',
        p: [
          'The operator owes you no fiduciary duty, no duty of care in respect of your investment decisions, no duty of suitability and no duty of best execution. Those duties arise from relationships this site does not have with you, does not offer, and does not want.',
          'Every decision to buy, hold or sell anything is yours alone — made on your own analysis, or on advice you obtain from somebody who is accountable to you for it.',
        ],
      },
      {
        h: 'No warranty',
        p: [
          'The site and everything on it are provided “as is” and “as available”, without warranty of any kind, express or implied, including any implied warranty of merchantability, fitness for a particular purpose, accuracy, completeness, timeliness, non-infringement, or uninterrupted or error-free operation.',
          'Data comes from public sources that go down, rate-limit, change format and occasionally publish errors. Corporate actions, ticker changes, delistings and restatements can arrive late or not at all. Every price on this site is end-of-day and historical by construction; nothing here is a live quote.',
          'No representation is made that the site will be available at any given moment, that any figure on it is correct, or that any error will be corrected within any particular period. Verify anything you intend to act on against a primary source.',
        ],
      },
      {
        h: 'Limitation of liability',
        p: [
          'To the fullest extent permitted by law, neither the operator nor any contributor is liable for any trading loss, investment loss, lost profit, lost opportunity, loss of data, business interruption, or any indirect, incidental, special, consequential or punitive damage arising out of or connected with your use of, or inability to use, this site or anything published on it — whether the claim is framed in contract, tort, negligence, strict liability or otherwise, and whether or not the possibility of that loss was known.',
          'Where liability cannot lawfully be excluded, it is limited to the greater of the amount you paid to access this site, which is nothing, and the minimum the applicable law requires.',
          'Nothing in these terms excludes or limits liability for fraud, for fraudulent misrepresentation, for death or personal injury caused by negligence, or for anything else that cannot lawfully be excluded. Some jurisdictions do not permit certain exclusions; in those jurisdictions the exclusions above apply only as far as they lawfully can, and the rest of the clause survives.',
        ],
      },
      {
        h: 'Acceptable use',
        p: [
          'You may read this site, quote it with attribution and a link, and poll its published JSON and RSS endpoints for your own use. Those endpoints exist so that you never need to scrape the HTML.',
          'You may not: present a board as your own work, as advice, or as a forecast; strip the compliance notice from a reproduced table; resell access to the content; use the site as the feed for a paid tip or alert service; place load on it that degrades service for other readers, including scraping at a rate the published feeds make unnecessary; interfere or attempt to interfere with the site, its build pipeline or its repository; or use the content to train a model whose output presents these rankings as recommendations.',
          'Automated access to the published data files is welcome within those limits. Identify your client honestly in the user-agent string if you run anything at volume.',
        ],
      },
      {
        h: 'Intellectual property and licensing',
        p: [
          'The pipeline is open source; the content is not. Those are two different things and the distinction is deliberate.',
          'The data pipeline, the scoring implementation and the site source live in a public repository. The licence that applies to that code is whatever the repository’s licence file says. If no licence file is present, no licence has been granted and you should ask before reusing the code — a public repository is not by itself a grant of rights.',
          'The published content is separate and is not open source: the written copy on these pages, the methodology document as a piece of writing, the ranking outputs, the trade ledger and the site design remain the operator’s. You may quote short extracts with attribution and a link. You may not republish a board in full, mirror the site, or build a competing product out of its output.',
          '“StockPulse” and the site’s marks are not licensed for your use.',
          'Market data and headlines belong to their respective sources and are used here for research and commentary. Where a source imposes its own terms, those terms travel with the data and bind you too.',
        ],
      },
      {
        h: 'Third-party links and advertising',
        p: [
          'Links to other sites are provided for reference. The operator does not control them, does not endorse them, and is not responsible for their content or their privacy practices.',
          'Where advertising is served, the advertisements are selected by the ad vendor, not by the operator. An advertisement appearing beside a board is not an endorsement of the advertiser, and no advertiser has any influence over any ranking. No payment is accepted from any issuer, fund, broker or promoter to include, exclude or rank any security.',
        ],
      },
      {
        h: 'Changes and availability',
        p: [
          'The site, the boards it publishes and these terms may all change. A material change to these terms is published on this page with a new effective date; continuing to use the site after that date is acceptance of the change.',
          'The site may be taken down, in whole or in part, at any time and without notice. It is a free publication and carries no service commitment.',
        ],
      },
      {
        h: 'Governing law',
        p: [
          'These terms are governed by the laws of {jurisdiction}, without regard to conflict-of-laws rules, and the courts of {jurisdiction} have jurisdiction over any dispute arising out of them or out of your use of this site.',
          'If you are a consumer, this does not deprive you of the protection of the mandatory consumer-protection rules of the country where you live, and it does not remove any right you have under local law to bring a claim before your local courts.',
        ],
      },
      {
        h: 'Severability, waiver, entire agreement',
        p: [
          'If any provision of these terms is held unenforceable, the remainder stands and the unenforceable provision is read down to the smallest change that makes it enforceable.',
          'A failure to enforce a provision is not a waiver of it.',
          'These terms, together with the disclaimer and the privacy policy, are the whole of the agreement between you and the operator concerning this site.',
        ],
      },
    ] as LegalSection[],
    contactHeading: 'Questions about these terms',
  },

  /* ── editorial policy ──────────────────────────────────────────────────── */
  editorial: {
    title: 'Editorial and corrections policy',
    lead:
      'How the numbers are produced, how the words are written, where AI is used, and what happens when something turns out to be wrong.',
    effectiveLabel: 'In effect since',
    sections: [
      {
        h: 'How the rankings are produced',
        p: [
          'Every board is computed by a program from a formula published in full before it is applied. The inputs are prices, fundamentals and headline counts from public sources; the output is an ordering. There is no editorial step between the two.',
          'Nobody selects, promotes, demotes or removes a security by hand. There is no override switch and, by design, nowhere to put one: the board a reader sees is what the published formula returned for that date, and it is reproducible by anyone with the same inputs and the published code.',
          'The consequence is worth stating plainly, because it is uncomfortable. A result that looks wrong to a human stays where the formula put it. The remedy is to change the formula — in public, with a version bump and a written rationale — never to edit the output.',
          'Diversification constraints (sector caps, correlation caps, catalyst caps) can remove a name that scored high enough. When they do, the displaced name and the rule that displaced it are both published, so the constraint is visible rather than merely asserted.',
        ],
      },
      {
        h: 'How the written content is produced',
        p: [
          'The written material on this site — the methodology document, the explanatory copy beside every table, these policies — is drafted by the operator, checked against the code that implements it, and revised until the two agree. Where a page describes what the pipeline does, that description is written from the implementation, not from the intention.',
          'A claim about a number is not published unless the number can be traced to a rule. Where the site does not know something it says so; the known-limitations list on the About page exists for that reason and is maintained, not decorative.',
          'Nothing on this site is sponsored, gifted, or written to order, and no page has been placed here by anyone other than the operator.',
        ],
      },
      {
        h: 'Use of AI assistance',
        p: [
          'AI tools are used in producing this site: for drafting and editing prose, for writing and reviewing code, and for translation support between English and Korean. That is disclosed here rather than buried, and it is disclosed on the individual page wherever a piece of writing is materially AI-drafted.',
          'AI is not used to decide what is ranked, or in what order. The ranking is arithmetic over published inputs, and no model output enters any score. A language model is used nowhere in the pipeline that produces a board — including the headline sentiment score, which is a published lexicon, and is labelled as one precisely so nobody mistakes it for a model.',
          'No page is published on a model’s say-so. A human reviews every published page and checks every factual claim against the code or the source it came from. Where a model produced text that could not be verified, the text was cut rather than hedged.',
        ],
      },
      {
        h: 'Corrections',
        p: [
          'The trade ledger is append-only. It lives in version control, every historical version is publicly diffable, and rows are never deleted.',
          'An entry published in error is marked void, with a stated reason, and stays visible on the performance page. It is not removed, and the statistics state how it was treated. The alternative — quietly deleting the embarrassing rows — is the exact practice a public audit exists to make impossible.',
          'A factual error in written copy is fixed in place. Where the error changed the meaning of a published claim, the fix is noted with the date of the correction rather than silently overwritten.',
          'Sample-size warnings stay up until a horizon has at least thirty closed positions. On the long horizons that will take years, and the warning will stay up for those years.',
        ],
      },
      {
        h: 'Versioning and change control',
        p: [
          'The methodology carries a version number, and that version is stamped onto every ranking file at the moment of publication. Any change to a weight or a rule increments the version and is committed with a written rationale.',
          'Past entries keep the version they were generated under, so a change to the formula cannot silently rewrite past results. A performance series spanning a version change is labelled as such.',
          'This is the mechanism that makes the record falsifiable. Without it, any strategy can be made to look good in hindsight by changing the rule and re-running history.',
        ],
      },
      {
        h: 'Independence',
        p: [
          'No payment is accepted from any issuer, fund, broker or promoter to include, exclude or rank any security, and no arrangement exists under which one could be. Advertising, where it is served, is selected by the ad vendor and has no connection to any board.',
          'The operator may or may not hold positions in securities that appear on these boards and makes no representation either way. Assume a conflict may exist and weigh the content accordingly.',
        ],
      },
      {
        h: 'How to report an error',
        p: [
          'Email the contact address with the page, the date shown on the board, the ticker, and what you believe the correct value to be. A screenshot helps. Technical problems can also be raised in public as an issue in the repository, which is often faster because the thread stays visible to everyone who hits the same thing.',
          'A report that identifies a real error in a published number is handled ahead of everything else, and the correction is made under the rules above: fixed, recorded, and left visible.',
        ],
      },
    ] as LegalSection[],
  },

  /* ── contact ───────────────────────────────────────────────────────────── */
  contact: {
    title: 'Contact',
    lead: 'One address, read by a person. Use it for corrections, privacy requests, legal notices, and questions about how a number was produced.',
    emailHeading: 'Email',
    emailNote:
      'This is the address for everything: corrections, data errors, privacy and deletion requests, legal notices, licensing questions and advertising administration. It is a real mailbox, not a form that pretends to submit and discards what you typed.',
    responseHeading: 'What to expect',
    responseNote:
      'A first reply within {days} business days. Corrections that affect a published number are prioritized over everything else and are handled under the editorial policy: the error is fixed, the correction is recorded, and the original is not quietly deleted.',
    repoHeading: 'The source repository',
    repoNote:
      'Everything that produces this site — the scoring code, the methodology document, the site itself and its full history — is public. You can read the code that produced any number here, open an issue about it where everyone can see it, and check the change history rather than take a claim on trust. For a technical problem this is often the faster channel.',
    correctionsHeading: 'Reporting an error in the data',
    correctionsNote:
      'Include the page, the date shown on the board, the ticker, and what you believe the correct value is. A screenshot helps. Errors in public market data are common; this site would rather hear about one than defend it.',
    noAdviceHeading: 'What this channel is not',
    noAdviceNote:
      'It is not a way to obtain investment advice, a second opinion on a holding, or a view on whether to buy anything. Questions of that kind get a polite pointer back to the disclaimer. Answering them individually would turn a general publication into personalized advice, which is exactly the line this site does not cross.',
    privacyHeading: 'What happens to what you send',
    privacyNote:
      'Your message sits in the mailbox it arrived in and nowhere else. There is no ticketing system, no CRM and no mailing list. It is kept while the exchange is live and for up to twelve months afterwards, then deleted — sooner if you ask.',
  },

  /**
   * SERP metadata, separate from on-page headings.
   *
   * A title is not an <h1>. "News" is a fine page heading and a wasted title:
   * it spends 4 of ~60 available units and contains no term anyone searches.
   * Budgets are display units (latin=1, CJK=2) and the build audit enforces
   * them against the emitted HTML — see scripts/audit.mjs.
   *
   * Vocabulary is deliberate: no "signals", "picks" or "tips". The Deceptive
   * Practices publisher policy names get-rich-quick framing explicitly, and a
   * ranking is an entry on a screen, not a tip.
   */
  seo: {
    home: {
      title: 'Daily US & Korea Stock Rankings — 4 Horizons | StockPulse',
      description:
        'Four rule-based stock screens for the US and Korean markets, rebuilt every session. Published rule set, entry and stop levels, and every past entry audited to its exit.',
    },
    methodology: {
      title: 'Stock Ranking Methodology: The Full Rule Set | StockPulse',
      description:
        'The complete scoring rules, published before they are applied: cross-sectional z-scoring, point-in-time data, diversification caps and the exact exit convention used in the audit.',
    },
    performance: {
      title: 'Every Entry Audited: Public Track Record | StockPulse',
      description:
        'Win rate against a random-pick control, mean return against the benchmark, never-filled count and full trade ledger. Nothing removed retroactively, losses included.',
    },
    news: {
      title: 'Market News Matched to Ranked Stocks | StockPulse',
      description:
        'Headlines matched to the US and Korean stocks on the leaderboards, with lexicon sentiment scores, multi-outlet story clusters, and the health of every source feed.',
    },
    sectors: {
      title: 'US & Korea Sector Capital Flow Map | StockPulse',
      description:
        'A treemap of where market value sits and how it moved over 1, 5 and 20 days across both markets, with breadth and advance-decline counts per sector.',
    },
    simulator: {
      title: 'Position Size & Stop-Loss Calculator | StockPulse',
      description:
        'Split a hypothetical amount across a board and see share counts, aggregate stop-loss exposure and outcome scenarios. Runs in your browser; nothing is stored.',
    },
    alerts: {
      title: 'Machine-Readable Ranking Feeds: JSON & RSS | StockPulse',
      description:
        'Every board is published as JSON at a stable URL and as an RSS feed, with no key and no account. Email alerts are not live yet and this page says so plainly.',
    },
    about: {
      title: 'How StockPulse Ranks Stocks — and Who Runs It',
      description:
        'What this site is, what it deliberately is not, how the scoring works, where the data comes from, and the source reliability figures for the most recent pipeline run.',
    },
    disclaimer: {
      title: 'Disclaimer: This Is Not Investment Advice | StockPulse',
      description:
        'Not advice, no adviser registration, past performance proves nothing, the data can be wrong, everything is end-of-day, and you can lose money. In plain language.',
    },
    privacy: {
      title: 'Privacy Policy: What This Site Collects | StockPulse',
      description:
        'What data this site collects, what it does not, which third parties are involved, and how to request access or deletion. Written to be read, not to be skipped.',
    },
    terms: {
      title: 'Terms of Use for a Stock Research Site | StockPulse',
      description:
        'The terms covering use of the rankings, the published data feeds and the articles, including limits of liability and the absence of any advisory relationship.',
    },
    editorial: {
      title: 'Editorial Policy: How Articles Are Produced | StockPulse',
      description:
        'Who writes and reviews the content, when a language model is involved and how that is disclosed, how sources are cited, and how corrections are handled.',
    },
    contact: {
      title: 'Contact StockPulse — Corrections and Questions',
      description:
        'How to reach the operator, report an error in a published ranking or article, request data deletion, or read the source code that produced any number on this site.',
    },
  },

  /* blog */
  blog: {
    title: 'Research notes',
    intro:
      'How the rankings are built, what each factor actually measures, and where the data stops being trustworthy. Written to be checkable: every claim points at the rule, the source, or the code that produced it.',
    allPosts: 'All articles',
    featured: 'Start here',
    categories: 'Topics',
    category: 'Topic',
    readingTime: '{n} min read',
    published: 'Published',
    updated: 'Updated',
    writtenBy: 'Written by',
    reviewedBy: 'Reviewed by',
    reviewedByHelp: 'A named person read this before it was published and is accountable for it.',
    reviewLabel: 'Review',
    autoPublished: 'Auto-published — no individual review',
    autoPublishedShort: 'Auto-published',
    autoPublishedHelp:
      'Generated and published automatically on a schedule from figures the pipeline computed, with no individual human review before it went live. No language model wrote the text. Every number is reproducible from the data files linked below, and errors are corrected in public.',
    autoPublishedPolicy: 'How automated publishing works',
    aiTitle: 'How this article was produced',
    aiBadge: 'AI-assisted draft, human-reviewed',
    humanOnly: 'Written and reviewed by a person',
    noModel: 'Assembled by code — no language model',
    sources: 'Sources',
    sourcesHelp: 'What the claims above are based on. External links open in a new tab.',
    tags: 'Tags',
    tickers: 'Tickers discussed',
    related: 'Related reading',
    newerPost: 'Newer',
    olderPost: 'Older',
    backToBlog: 'All research notes',
    pageOf: 'Page {n} of {m}',
    nextPage: 'Older articles',
    prevPage: 'Newer articles',
    noPosts: 'Nothing published in this topic yet.',
    inCategory: '{category} articles',
    postCount: '{n} articles',
    postCountOne: '1 article',
    onlyLang: 'This article has not been translated yet.',
    indexSeoTitle: 'Stock Screening Research & Explainers | StockPulse',
    indexSeoDesc:
      'Plain-language explanations of the factors, statistics and data sources behind the US and Korea stock rankings — z-scoring, ATR stops, Piotroski F-score, point-in-time data, and where each one breaks.',
    categorySeoDesc: '{category} articles from StockPulse: how the rankings are built and what the numbers can and cannot tell you.',
  },

  /* misc */
  common: {
    market: { US: 'United States', KR: 'Korea' },
    marketShort: { US: 'US', KR: 'KR' },
    yes: 'Yes',
    no: 'No',
    none: 'None',
    back: 'Back to leaderboard',
    readMethodology: 'Read the methodology',
    seePerformance: 'See the performance audit',
    expand: 'Expand',
    collapse: 'Collapse',
    source: 'Source',
    updated: 'Updated',
  },
};

const ko: typeof en = {
  skipToContent: '본문으로 건너뛰기',
  nav: {
    home: '순위표',
    methodology: '방법론',
    performance: '성과 검증',
    news: '뉴스',
    simulator: '시뮬레이터',
    sectors: '섹터',
    blog: '리서치',
    alerts: '알림',
    about: '소개',
    disclaimer: '면책 고지',
    privacy: '개인정보처리방침',
    terms: '이용약관',
    editorial: '편집·정정 정책',
    contact: '문의',
  },
  theme: { label: '테마', light: '라이트', dark: '다크', system: '시스템', toggle: '색상 테마 전환' },
  langSwitch: 'View in English',
  langSwitchShort: 'English',
  langSwitchFallback: '이 페이지는 영어판이 없습니다. 영어 사이트로 이동합니다.',
  menu: '메뉴',
  footerLegal: '약관·정책',
  cookieSettings: '쿠키 설정',

  compliance:
    '본 사이트의 모든 콘텐츠는 시장 조사 및 교육 목적의 정보이며, 개인별 투자자문이 아닙니다. StockPulse는 등록된 투자자문업자가 아닙니다. 순위는 공개된 규칙에 따른 기계적 산출물이며 예측이 아닙니다. 투자 원금 손실이 발생할 수 있습니다. 투자 판단과 책임은 이용자 본인에게 있습니다.',
  complianceHeading: '중요 고지',
  footerDisclaimer:
    '시장 조사 및 교육 목적의 정보입니다. 투자자문이 아니며, 등록된 투자자문업자가 아니고, 예측도 아닙니다.',
  dataAsOf: '데이터 기준일',
  builtOn: '규칙 버전',

  placeholderTitle: '예시 데이터 포함',
  placeholderSome: '아래 데이터는 실제 시장 데이터가 아니라 예시로 만든 값이며, 실제 종목에 대한 설명이 아닙니다:',
  placeholderReal: '아래 데이터는 파이프라인이 실제로 산출한 값입니다:',
  placeholderFlagNote:
    '데이터 파일마다 예시 데이터 여부를 표시하는 값이 따로 들어 있고 이 고지는 그 값을 읽어 표시합니다. 그래서 페이지를 통째로 묶지 않고 데이터셋 단위로 정확하게 구분됩니다.',
  datasetName: {
    rankings: '순위',
    news: '뉴스',
    performance: '성과',
    sectors: '섹터',
    health: '소스 상태',
  },

  home: {
    title: '일간 순위표',
    intro:
      '규칙 기반 종목 스크리너 4종을 매 거래일 다시 계산합니다. 각 순위표는 미리 공개해 둔 점수 산식이 기계적으로 뽑아낸 상위 10종목일 뿐, 예측도 매수 권유도 아닙니다.',
    market: '시장',
    horizon: '투자 기간',
    asOf: '종가 기준일',
    turnover: '30일 종목 교체율',
    turnoverHelp: '최근 30일 사이에 순위표에서 교체된 종목의 비율입니다. 단기 순위표에서는 높게 나오는 것이 정상입니다.',
    eodNote:
      '모든 데이터는 종가 기준입니다. 장 마감 뒤에 발행한 순위표는 빨라야 다음 거래일 시가부터 실행할 수 있고, 성과 검증도 그날의 (시가 + 종가) ÷ 2 가격에 체결된 것으로 처리합니다.',
    sampleWarning:
      '이 투자 기간은 청산이 끝난 포지션이 아직 30건에 못 미칩니다. 표본이 부족하므로 아래 통계는 참고 수준으로만 보시기 바랍니다.',
    emptyBoard: '아직 발행되지 않은 순위표입니다.',
    emptyBoardHeading: '이 순위표는 발행되지 않았습니다',
    emptyBoardWhy: '이유',
    emptyBoardCode: '사유 코드',
    emptyBoardFooter: '장애가 아니라 의도한 동작입니다. 같은 시장의 다른 순위표는 정상적으로 발행됩니다.',
    columns: {
      rank: '순위',
      stock: '종목',
      price: '주가',
      trend: '30일',
      score: '점수',
      levels: '진입가 / 손절가',
      targets: '목표가',
      risk: '위험도',
      catalyst: '재료',
      detail: '팩터',
    },
    movementNew: '신규',
    movementNewLabel: '이번 순위표 신규 진입',
    movementUp: '{n}계단 상승',
    movementDown: '{n}계단 하락',
    movementFlat: '변동 없음',
    entryZone: '진입 구간',
    stop: '손절가',
    noStop: '가격 손절 없음',
    noStopExplain:
      '장기 포지션은 가격 손절로 관리하지 않습니다. 5년을 놓고 보면 15% 하락은 잡음이지만, 투자 논리가 깨지는 것은 그렇지 않습니다. 아래 조건 가운데 하나라도 성립하면 포지션을 정리합니다.',
    invalidation: '투자 논리 훼손 조건',
    targetBand: '목표 구간',
    targetConservative: '보수적',
    targetBase: '기본',
    targetBull: '낙관적',
    noTargets: '목표주가를 제시하지 않습니다. 5~10년 뒤의 목표주가는 사실상 허구이므로, 기업이 이익을 복리로 쌓아 가는지를 놓고 판단합니다.',
    targetBasisLabel: {
      atr: 'ATR 배수 목표가',
      fair_value_band: '2년 적정가치 구간',
      compounding_scenarios: '7년 복리 성장 시나리오',
    },
    targetBasisHelp: {
      atr: '종가에 그 종목 자신의 ATR(평균 실질 변동폭)을 각각 1.0배, 1.8배, 3.0배 더한 값입니다. 변동성에 비례해 정해지므로, 같은 규칙을 적용해도 전력주와 바이오주의 구간 폭은 크게 달라집니다. 주가 전망이 아니라 청산 로직이 실제로 사용하는 가격입니다.',
      fair_value_band:
        '성장률, 이익률, 기말 멀티플에 각각 보수적·기본·낙관적 가정을 넣어 산출한 1~2년 할인 적정가치 범위입니다. 밝혀 둔 가정이 만들어 낸 범위일 뿐 목표주가가 아니며, 포지션은 이 숫자가 아니라 투자 논리를 보고 정리합니다.',
      compounding_scenarios:
        '목표주가가 아닙니다. 매출 성장률, 이익률, 기말 멀티플에 대한 가정을 밝혀 놓고, 그 가정대로라면 기업 가치가 5~10년 동안 복리로 어디까지 불어나는지를 세 갈래로 계산한 것입니다. 5~10년 뒤의 목표주가는 사실상 허구이므로 방법론은 그 대신 시나리오 구간을 제시합니다. "가정이 유지된다면 계산은 이렇게 된다"는 뜻일 뿐, 그 가정이 유지될지에 대해서는 아무 말도 하지 않습니다.',
    },
    targetBasisShort: {
      atr: 'ATR 배수',
      fair_value_band: '2년 적정가치',
      compounding_scenarios: '시나리오, 예측 아님',
    },
    targetBasisWhat: '이 숫자의 성격',
    maxHold: '최대 보유',
    sessions: '거래일',
    riskGauge: '위험도',
    riskGaugeHelp: '유니버스 안에서 ATR ÷ 주가가 몇 분위인지 나타냅니다. 1이 가장 안정적이고 5가 변동성이 가장 큽니다.',
    completeness: '데이터 완전성',
    completenessBadge: '팩터 {total}개 중 {used}개',
    completenessHelp:
      '이 종목은 일부 팩터 입력값이 비어 있습니다. 빈 값을 평균으로 채우지 않고 남아 있는 값만으로 점수를 계산한 뒤, 그 사실을 여기에 표시합니다.',
    factorBreakdown: '팩터 분해',
    factorZ: 'z 점수',
    factorRaw: '원값',
    showFactors: '팩터 보기',
    hideFactors: '팩터 접기',
    factorsShort: '팩터',
    scrollHint: '표를 좌우로 스크롤할 수 있습니다. 일부 열이 화면 밖에 있습니다.',
    scrollRegion: '순위표, 좌우 스크롤 가능',
    scrollRegionTable: '표, 좌우 스크롤 가능',
    newsCount: '건(7일)',
    sentiment: '헤드라인 감성',
    cluster: '재료 묶음',
    flags: '플래그',
    flagLabel: {
      partial_data: '데이터 일부 누락',
      price_limit: '가격제한폭',
      stopped_out: '손절가 도달',
    },
    flagHelp: {
      partial_data:
        '이 종목은 일부 팩터를 쓸 수 없어 남은 팩터에 가중치를 다시 나눠 배분했습니다. 빈 값을 평균으로 채우지 않고 남아 있는 값만으로 점수를 계산한 뒤, 그 사실을 여기에 표시합니다.',
      price_limit:
        '거래소 일일 가격제한폭(±30%)에 걸렸거나 그 근처에서 마감한 종목입니다. 이때의 종가는 매수·매도가 만나 형성된 가격이 아니라 제한폭에 막혀 멈춰 선 가격이므로, 값이 잘려 나간 상태입니다. 등락률, 진입 구간, 목표가처럼 종가에서 끌어낸 수치는 모두 실제 움직임보다 작게 나옵니다.',
      stopped_out:
        '주가가 공개된 손절가를 이탈했습니다. 원장에는 손절가로 청산해 손실로 기록하며, 해당 종목은 5거래일 동안 다시 편입되지 않습니다.',
    },
    evidenceLabel: '감성 근거',
    evidenceHelp: '감성 점수를 만들어 낸 사전 등재 단어입니다. 점수가 실제로 무엇에 반응했는지 직접 확인할 수 있도록 공개합니다.',
    justMissed: '아깝게 빠진 종목',
    justMissedIntro:
      '점수만 놓고 보면 상위 10위 안에 들었지만 분산 규칙에 걸려 빠진 종목입니다. 어떤 규칙에 걸렸는지 함께 적어 두었으니, 제약이 실제로 작동했는지 직접 확인해 보시기 바랍니다.',
    displacedBy: {
      sector_cap: '섹터 상한: 같은 섹터에서 이미 3종목 편입',
      correlation_cap: '상관관계 상한: 상관계수 0.85를 넘는 종목이 이미 2개 편입',
      catalyst_cluster_cap: '재료 상한: 같은 뉴스 재료로 이미 4종목 편입',
    },
    heldShort: '{n}거래일',
    heldSessionsLabel: '연속 편입',
    heldSessionsHelp:
      '이 순위표에 {n}거래일 연속으로 올라 있습니다. 단기 순위표는 설정이 소멸하므로 교체가 빠른 것이 정상입니다. 반면 장기 순위표에서 이 수치가 낮다면 안정적이어야 할 목록이 흔들리고 있다는 뜻입니다.',
    stoppedOut: '손절가 이탈로 순위표에서 제외',
    stoppedOutIntro:
      '이곳에 발행되었고 손절가가 함께 공개되었으며 그 손절가가 깨진 종목입니다. 당일 순위표에서 빠졌고 5거래일 동안 재진입할 수 없습니다. 손절가를 공개해 놓고 정작 그 선이 깨진 종목을 조용히 지우는 사이트는 가장 중요한 결과를 감추는 것이므로, 그대로 공개합니다.',
    stoppedOutFell: '이탈 직전',
    stoppedOutRank: '{n}위',
    stoppedOutStopHit: '이탈한 손절가',
    stoppedOutPublished: '발행일',
    stoppedOutLast: '최근 종가',
    stoppedOutCooldown: '{n}거래일 재진입 제한',
    stoppedOutCooldownHelp:
      '손절가에 도달한 종목은 손실을 기록하고 {n}거래일 동안 이 순위표에 다시 오를 수 없습니다. 다음 날 점수가 좋아졌다는 이유로 손절 사실을 되돌릴 수 없도록 한 장치입니다(방법론 §7).',
    stoppedOutLedger: '이 종목들은 모두 거래 원장에서 확인하실 수 있습니다',
    newsPanel: '관련 헤드라인',
    newsFilterOn: '{ticker} 필터 적용됨',
    clearFilter: '필터 해제',
    filterHint: '표에서 종목 코드를 선택하면 헤드라인이 필터링됩니다.',
    noNewsForTicker: '현재 기간에는 이 종목에 걸린 헤드라인이 없습니다.',
    viewAllNews: '전체 뉴스',
    refreshed: '수치 갱신됨',
    newPublish: '새 순위표가 발행되었습니다. 전체 내용은 새로고침 후 확인하실 수 있습니다.',
    reload: '새로고침',
    openBoard: '이 순위표 열기',
    allBoards: '전체 순위표',
    boardPermalink: '이 순위표 전체 페이지',
  },

  regime: {
    heading: '시장 국면',
    breadth: '200일선 위 종목 비율',
    indexAbove: '지수가 200일선 위인지',
    yes: '예',
    no: '아니오',
    unknown: '판단 불가',
    multiplier: '점수 배수',
    state: {
      risk_on: '위험 선호',
      narrowing: '주도주 압축',
      caution: '경계',
      risk_off: '위험 회피',
      unknown: '판단 불가',
    },
    body: {
      risk_on: '지수가 200일선 위에 있고 유니버스의 절반 이상이 함께 올라가고 있습니다. 무난한 국면입니다.',
      narrowing:
        '지수는 200일선 위를 지키고 있지만 200일선 위에 있는 종목은 절반이 안 됩니다. 이렇게 주도주가 몇 종목으로 압축되는 국면은 과거 사례를 보면 추가 상승보다 조정으로 이어진 경우가 많았습니다. 점수에 0.85배를 적용합니다.',
      caution:
        '지수가 200일선 아래로 내려왔습니다. 지금 이 순위표는 우호적이지 않은 장세에 발행되고 있습니다. 이럴 때 필요한 대응은 종목을 바꾸는 것이 아니라 포지션 크기를 줄이는 것입니다. 점수에 0.70배를 적용합니다.',
      risk_off:
        '지수가 200일선 아래에 있고 상승 종목 비율마저 무너졌습니다. 지금 이 순위표는 우호적이지 않은 장세에 발행되고 있습니다. 이럴 때 필요한 대응은 새로 위험을 떠안지 않는 것입니다. 이런 국면에서는 스크리너 결과가 매수의 근거가 되지 못합니다. 아무것도 하지 않는 것 역시 하나의 선택이며, 본 사이트에는 그것을 대신할 공매도 전략이 없습니다. 점수에 0.50배를 적용합니다.',
      unknown: '오늘은 지수 이력이 모자라 국면을 분류할 수 없습니다. 점수에 배수를 적용하지 않습니다.',
    },
    sizing: '제시 포지션 크기',
    sizingValue: {
      risk_on: '평상시 수준',
      narrowing: '축소',
      caution: '대폭 축소',
      risk_off: '없음 (신규 진입 제시 안 함)',
      unknown: '분류 불가',
    },
  },

  methodology: {
    title: '방법론',
    intro:
      '규칙 전문을 적용하기 전에 미리 공개합니다. 그래야 이 사이트의 모든 숫자를 누군가의 의견이 아니라 문서에 적힌 규칙까지 거슬러 확인할 수 있습니다. 파이프라인이 그대로 구현하고 있는 문서를 손대지 않고 게재합니다.',
    version: '버전',
    summaryHeading: '한국어 요약',
    tocHeading: '목차',
    fullHeading: '규칙 전문',
  },

  perf: {
    title: '성과 검증',
    intro:
      '순위표에 오른 종목은 발행하는 그 시점에 추가만 가능한(append-only) 원장에 기록하고, 공개된 규칙대로 청산합니다. 나중에 지우는 일은 없습니다. 잘못 발행한 건도 사유를 적어 무효(void)로 표시할 뿐 그대로 남겨 둡니다.',
    winRate: '승률',
    controlWinRate: '무작위 선정 대조군 승률',
    controlHelp:
      '같은 날짜, 같은 유니버스에서 같은 개수를 무작위로 뽑았을 때의 승률입니다. 승률은 이 값과 나란히 놓고 봐야 의미가 생깁니다.',
    meanReturn: '평균 수익률',
    benchmarkReturn: '벤치마크',
    benchmarkHelp: '같은 기간 SPY(미국)·코스피(한국)를 사서 들고 있었을 경우입니다. 상승장에서는 아무렇게나 골라도 승률은 좋게 나옵니다.',
    medianReturn: '중위 수익률',
    excessReturn: '벤치마크 대비 초과',
    maxDrawdown: '최대 낙폭',
    avgHold: '평균 보유',
    days: '일',
    picks: '발행 건수',
    filled: '체결',
    noFill: '미체결',
    noFillHelp:
      '다음 거래일 체결 가격이 진입 구간 안으로 들어오지 않아 매수가 성립하지 않은 건입니다. 손익이 0이므로 수익률 계산에서 빠집니다. 장부상 성과 가운데 애초에 손댈 수 없었던 몫이 얼마인지 보여 줍니다.',
    equityCurve: '자산 곡선',
    equityHelp: '체결된 모든 포지션을 동일가중으로 담은 포트폴리오를 비용 차감 후 100으로 지수화한 것입니다. 같은 축에 벤치마크를 겹쳐 그렸습니다.',
    strategy: 'StockPulse',
    benchmark: '벤치마크',
    byHorizon: '투자 기간별',
    ledger: '거래 원장',
    ledgerIntro: '손실 건과 미체결 건을 포함한 모든 발행 내역입니다.',
    filterMarket: '시장',
    filterHorizon: '기간',
    filterStatus: '상태',
    all: '전체',
    sortBy: '정렬',
    noResults: '조건에 맞는 거래가 없습니다.',
    showing: '{total}건 중 {n}건 표시',
    cols: {
      date: '발행일',
      market: '시장',
      horizon: '기간',
      ticker: '종목코드',
      rank: '순위',
      entry: '진입가',
      exit: '청산가',
      exitDate: '청산일',
      reason: '청산 사유',
      ret: '수익률',
      net: '순수익률',
      bench: '벤치마크',
      hold: '보유',
      status: '상태',
    },
    exitReason: {
      stop: '손절',
      target: '목표 도달',
      max_hold: '보유 기간 만료',
      forced: '강제 청산',
      open: '보유 중',
    },
    status: { closed: '청산', open: '보유', no_fill: '미체결', void: '무효' },
    sampleWarnTitle: '청산 완료 30건 미만',
    sampleWarnAffected: '해당 투자 기간:',
    sampleWarnCount: '청산 {n}건',
    sampleWarnBody:
      '청산이 끝난 건이 30건에 못 미치면 통계적으로 유의하다고 볼 수 없습니다. 한 건의 결과가 승률을 몇 %포인트씩 움직입니다. 장기 순위표는 앞으로 몇 년 동안 이 경고를 달고 있을 텐데, 결함이 아니라 있는 그대로의 상태입니다.',
    openPositions: '보유 중 포지션',
    voidNote: '무효',
    antiGaming: '성과 부풀리기 방지 원칙',
    antiGamingItems: [
      '원장은 추가만 가능하며 git에 보관합니다. 과거 어느 시점의 내용이든 누구나 diff로 대조해 볼 수 있습니다.',
      '사후 삭제는 하지 않습니다. 오류로 발행된 건은 사유와 함께 무효로 표시하고 그대로 남겨둡니다.',
      '발행 건마다 그때의 방법론 버전을 함께 남기므로, 산식을 바꿔 과거 성과를 슬쩍 고쳐 쓸 수 없습니다.',
      '해당 투자 기간의 청산 완료 포지션이 30건이 될 때까지 표본 부족 경고를 내리지 않습니다.',
    ],
  },

  news: {
    title: '뉴스',
    intro:
      '순위 대상 종목에 걸린 헤드라인입니다. 감성 점수는 언어 모델이 아니라 단어 사전으로 매긴 값이고, 예측력은 잘 봐야 약한 수준입니다. 여러 입력 가운데 하나일 뿐이니 직접 판단하실 수 있도록 그대로 내보냅니다.',
    feedHeading: '전체 헤드라인',
    topStories: '주요 기사',
    topStoriesHelp: '두 곳 이상의 매체가 함께 다룬 기사입니다. 실제로 중요했던 사안을 가려내는 거친 기준입니다.',
    outlets: '개 매체',
    stories: '건',
    filterTicker: '종목',
    filterLang: '언어',
    filterSentiment: '감성',
    all: '전체',
    english: '영어',
    korean: '한국어',
    sentimentLabel: { bullish: '긍정', neutral: '중립', bearish: '부정', unknown: '미평가' },
    feedHealth: '피드 상태',
    feedHealthHelp: '가장 최근 파이프라인 실행에서 응답한 소스입니다. 실패한 피드는 값을 추정해 채우지 않고 아예 계산에서 뺍니다.',
    feedStatus: { ok: '정상', degraded: '저하', failing: '실패' },
    items: '건',
    newest: '최신',
    hoursAgo: '시간 전',
    noResults: '조건에 맞는 헤드라인이 없습니다.',
    showing: '전체 {total}건 중 {n}건 표시',
    clear: '필터 해제',
  },

  sim: {
    title: '포지션 시뮬레이터',
    intro:
      '가상의 금액을 순위표 상위 10종목에 똑같이 나눠 담았을 때의 포지션 크기, 손절이 모두 걸렸을 때의 손실 합계, 그리고 결과를 어떻게 가정하느냐에 따른 손익을 계산합니다. 공개된 가격을 놓고 하는 산수일 뿐 예측이 아닙니다.',
    amount: '배분 금액',
    market: '시장',
    horizon: '투자 기간',
    commission: '수수료(편도, bp)',
    recalc: '다시 계산',
    inputsHeading: '시나리오 입력값',
    positions: '포지션',
    perPosition: '종목당 배분',
    shares: '수량',
    cost: '매입 금액',
    cash: '미투자 잔액',
    cashHelp: '주식은 1주 단위로만 살 수 있어 잔액이 남습니다.',
    stopExposure: '손절 시 손실 합계',
    stopExposureHelp:
      '가격 손절이 걸려 있는 포지션의 (진입가 − 손절가) × 수량을 모두 더한 값입니다. 손절이 전부 실행됐을 때의 손실이며 슬리피지와 갭은 넣지 않았습니다. 장기 포지션은 가격 손절이 없어 이 값에 잡히지 않지만, 그렇다고 떨어지지 않는다는 뜻은 아닙니다.',
    noStopPositions: '이 가운데 {n}개 포지션은 가격 손절이 없어 위 금액에서 빠져 있습니다.',
    outcome: '결과 가정',
    outcomes: { stop: '손절', conservative: '보수적', base: '기본', bull: '낙관적', flat: '변동 없음' },
    outcomeUnavailable: '이 투자 기간에는 제시하지 않음',
    needsJs: '시뮬레이터는 값을 바꿔 가며 쓰는 기능이라 자바스크립트가 필요합니다. 사이트의 나머지 부분은 자바스크립트 없이도 모두 동작합니다.',
    applyAll: '전체 적용',
    projected: '예상 평가액',
    projectedPnl: '예상 손익',
    commissionCost: '수수료(왕복)',
    netPnl: '순손익',
    exportJson: 'JSON으로 내보내기',
    noStorage:
      '입력하신 내용은 저장되지 않습니다. 데이터베이스도, 쿠키도, 브라우저 저장소도 쓰지 않습니다. 계산 내용은 이 페이지의 메모리에만 있다가 탭을 닫는 순간 사라집니다. 남겨 두시려면 내보내기 버튼을 쓰시기 바랍니다.',
    hypothetical:
      '어디까지나 가정에 따른 계산입니다. 공개된 진입 구간의 중간값에 체결되고, 모든 포지션이 가정한 결과에 도달하며, 갭 하락으로 손절가를 뚫고 내려가는 일은 없다고 전제합니다. 세금, 호가 스프레드, 슬리피지, 대차 비용, 환율 변동은 넣지 않았습니다. 아래 수수료 입력값만 반영됩니다.',
    emptyBoard: '그 순위표에는 나눠 담을 종목이 없습니다.',
    total: '합계',
    invested: '투자 금액',
    exportedAt: '내보낸 시각',
  },

  sectors: {
    title: '섹터 자금 흐름',
    intro:
      '시가총액이 어느 섹터에 몰려 있고 그 돈이 어떻게 움직였는지 보여 줍니다. 타일 넓이는 시가총액, 색은 선택한 기간의 수익률입니다. 장세를 설명하는 그림일 뿐 매매 신호가 아닙니다.',
    window: '수익률 기간',
    w1d: '1일',
    w5d: '5일',
    w20d: '20일',
    legend: '수익률',
    tableFallback: '섹터 표',
    tableHelp: '트리맵과 같은 데이터를 스크린 리더로 읽거나 색 없이 봐도 이해할 수 있는 형태로 정리한 표입니다.',
    cols: {
      sector: '섹터',
      cap: '시가총액',
      weight: '비중',
      r1d: '1일',
      r5d: '5일',
      r20d: '20일',
      breadth: '상승 비율',
      adv: '상승 / 하락',
    },
    breadthHelp: '해당 섹터 종목 가운데 상승한 종목의 비율입니다.',
  },

  alerts: {
    title: '알림',
    intro: '이메일·푸시 알림은 아직 제공하지 않습니다. 지금 쓸 수 있는 것과 준비 중인 것을 정리했습니다.',
    todayHeading: '지금 쓸 수 있는 것',
    todayBody:
      '모든 순위표는 주소가 바뀌지 않는 JSON과 RSS 피드로 발행됩니다. 직접 주기적으로 받아 가고, 어제 것과 비교하고, 이미 쓰고 계신 도구에 연결하시면 됩니다. API 키도 계정도 필요 없고, GitHub Pages 자체의 제한 말고는 호출 횟수 제한도 없습니다.',
    jsonLink: '순위 JSON',
    newsLink: '뉴스 JSON',
    perfLink: '성과 JSON',
    rssLink: 'RSS 피드',
    plannedHeading: '준비 중인 것',
    plannedBody:
      '순위표가 바뀌면 보내는 일간 요약, 그리고 발행한 종목이 손절가에 닿으면 그날 안에 알리는 기능입니다. 둘 다 메일 발송 업체와 제대로 작동하는 수신거부 절차가 있어야 하는데 아직 붙여 두지 않았습니다.',
    formHeading: '사전 등록',
    formNote:
      '이 양식은 아직 어디에도 연결되어 있지 않습니다. 버튼은 일부러 눌리지 않게 해 두었습니다. 접수된 척하고 입력값을 버리는 양식은 없느니만 못하기 때문입니다. 정식으로 열 때에는 요약 발송에만 주소를 쓰고, 클릭 한 번으로 수신을 끊을 수 있게 합니다.',
    emailLabel: '이메일 주소',
    emailPlaceholder: '아직 연결되지 않음',
    submit: '아직 제공하지 않음',
    contact: '그때까지는 위 피드가 순위표를 받아 보는 공식 경로입니다.',
  },

  about: {
    title: '소개',
    whatHeading: '어떤 사이트인가',
    whatBody:
      'StockPulse는 미국과 한국 시장을 대상으로 매일 네 가지 종목 순위를 계산합니다. 점수 산식은 적용하기 전에 전문을 공개합니다. 한 번이라도 순위표에 오른 종목은 청산될 때까지 추적해 손실로 끝난 건까지 그대로 공개합니다.',
    whatNotHeading: '어떤 사이트가 아닌가',
    whatNotBody:
      '투자자문도 아니고 종목 추천 서비스도 아니며, 주가가 어떻게 될지도 알지 못합니다. 스크리너 결과는 "오늘 이 규칙에서 점수가 가장 높았다"는 뜻일 뿐입니다. 언뜻 보이는 것보다 훨씬 작은 주장이고, 이 사이트가 하는 주장은 그것 하나뿐입니다.',
    howHeading: '작동 방식',
    howBody:
      '모든 팩터는 가중치를 매기기 전에 그날 유니버스 안에서 횡단면 z 점수로 바꿉니다. 단위가 서로 다른 원지표는 그대로 더할 수 없기 때문입니다. 데이터는 시점 기준(point-in-time)이라, 특정 날짜의 점수에는 그 날짜까지 공시된 자료만 들어갑니다. 청산 규칙은 진입보다 먼저 정해 두고, 성과 검증은 재량을 두지 않고 그 규칙대로만 포지션을 닫습니다.',
    dataHeading: '데이터와 출처',
    dataBody:
      '주가, 재무, 뉴스는 모두 공개된 소스에서 받아 옵니다. 특히 한국 재무 데이터는 커버리지가 고르지 않은데, 이 사이트는 그 사실을 덮지 않고 그대로 적습니다. 가장 최근 실행의 소스별 신뢰도는 아래에 공개합니다.',
    sourceHealth: '소스 상태 (최근 실행)',
    successRate: '성공률',
    notes: '비고',
    openHeading: '설계부터 공개',
    openBody:
      '규칙 문서, 거래 원장, 사이트 소스가 모두 한 저장소에 있습니다. 여기 있는 숫자가 틀렸다면 그 숫자를 만들어 낸 코드를 직접 읽어 볼 수 있고, 변경 이력도 그대로 확인할 수 있습니다.',
    limitsHeading: '알려진 한계',
    contactHeading: '연락처',
  },

  disclaimer: {
    title: '면책 고지',
    lead: '이 사이트의 내용을 근거로 무언가를 실행하기 전에 반드시 읽어 주십시오. 아무도 읽지 않는 고지는 누구도 보호하지 못하므로 쉬운 표현으로 적었습니다.',
    sections: [
      {
        h: '투자자문이 아닙니다',
        p: [
          '이 사이트의 모든 내용은 불특정 다수에게 공개하는 시장 조사·교육 정보입니다. 개인별 투자자문이 아니며, 특정 종목의 매수·매도·보유를 권유하는 것도 아닙니다.',
          '이 사이트의 어떤 내용도 이용자의 소득, 세금 문제, 이미 보유한 자산, 투자 기간, 필요한 현금, 감당할 수 있는 손실 폭을 고려하지 않습니다. 그 모두를 빼놓고 만든 순위가 특정인에 대한 자문이 될 수는 없고, 그런 용도로 제공하지도 않습니다.',
        ],
      },
      {
        h: '투자자문업 등록을 하지 않았습니다',
        p: [
          'StockPulse는 어느 나라에서도 등록된 투자자문업자, 투자중개업자, 재무설계사가 아닙니다. 운영자는 투자자문을 할 자격이 없고, 하지도 않습니다.',
          '국내 이용자께: 유사투자자문업 규정은 불특정 다수를 상대로 대가를 받고 투자 정보를 제공하는 영업에 적용되며, 금융감독원에 신고할 의무가 따릅니다. 이 사이트는 무료이고 누구에게나 같은 내용을 보여 줍니다. 앞으로 유료로 전환하거나 개별 문의에 맞춤 답변을 하게 된다면 그 규정부터 검토해야 합니다.',
          '미국 이용자께: Investment Advisers Act에는 개별 고객에 맞춘 자문을 하지 않는 정기 간행물에 대한 발행인 예외(publisher’s exclusion)가 있습니다. 이 사이트는 맞춤 응대를 하지 않고, 정해진 일정으로 발행하며, 모든 독자에게 같은 내용을 보여 주도록 만들어 그 예외 안에 들어가게 설계했습니다. 다만 이는 의도를 설명한 것이지 법률 의견이 아니며, 그 예외는 흔히 생각하는 것보다 좁게 해석됩니다.',
        ],
      },
      {
        h: '순위는 기계적 산출물이며 예측이 아닙니다',
        p: [
          '순위표는 미리 공개한 점수 산식이 뱉어 낸 결과입니다. 1위 종목은 오늘 그 산식에서 점수가 가장 높았던 종목이라는 뜻이고, 이 사이트가 하는 주장은 거기까지입니다.',
          '산식은 이 데이터에 맞춰 최적화한 것이 아니라 공개된 연구 문헌에서 끌어냈습니다. 과적합이라는 함정은 피했지만, 그 대가로 가중치를 다듬지 않았다는 점은 감수합니다. 시장 2개 × 투자 기간 4개 × 팩터 수십 개는 탐색 공간이 넓고, 그런 작업에서 신호처럼 보이는 것 가운데 일부는 그저 우연입니다.',
        ],
      },
      {
        h: '과거 성과는 미래 수익을 보장하지 않습니다',
        p: [
          '성과 페이지는 정해진 체결 가정과 비용 모형 아래에서 공개된 규칙이 과거에 실제로 만들어 낸 기록입니다. 전망이 아니고, 복리로 늘려 계산한다고 해서 약속이 되지도 않습니다.',
          '표본은 작습니다. 특히 장기 투자 기간은 의미 있는 기록이 쌓이기까지 몇 년이 걸립니다. 청산이 끝난 포지션이 30건에 못 미치는 투자 기간은 해당 페이지에 그 사실을 표시합니다.',
        ],
      },
      {
        h: '보유 포지션과 이해상충',
        p: [
          '운영자가 순위표에 오른 종목을 보유하고 있을 수도, 보유하지 않을 수도 있으며 어느 쪽인지 밝히지 않습니다. 이해상충이 있을 수 있다고 전제하고 내용을 판단하시기 바랍니다.',
          '특정 종목을 넣거나 빼거나 순위를 올려 주는 대가를 발행사, 운용사, 증권사, 홍보 대행사 어느 곳에서도 받지 않습니다. 이 원칙이 바뀐다면 시행한 뒤가 아니라 시행하기 전에 이 페이지에 밝히겠습니다.',
        ],
      },
      {
        h: '데이터가 지연되거나, 틀리거나, 누락될 수 있습니다',
        p: [
          '데이터는 언제든 멈추고, 호출을 제한하고, 형식을 바꾸고, 때로는 틀린 값을 내보내는 공개 소스에서 옵니다. 기업행위, 종목코드 변경, 상장폐지, 재무제표 정정이 늦게 반영되거나 아예 반영되지 않을 수 있습니다.',
          '소스가 실패하면 그 팩터를 평균값으로 메우지 않고 계산에서 빼며, 해당 종목에는 데이터 일부 누락 표시를 붙입니다. 정직한 처리 방식이지만, 그만큼 모든 종목의 점수가 똑같은 입력으로 계산되지는 않는다는 뜻이기도 합니다.',
          '정확성, 완전성, 특정 목적에의 적합성을 일절 보증하지 않습니다. 실제로 실행에 옮길 내용은 반드시 원 출처에서 다시 확인하시기 바랍니다.',
        ],
      },
      {
        h: '모든 데이터는 종가 기준입니다',
        p: [
          '이 시스템에는 장중 데이터도, 시간외 데이터도 없습니다. 종가로 계산해 장 마감 뒤에 발행한 순위표는 다음 거래일 개장 전까지는 실행할 방법이 없습니다.',
          '성과 검증도 이 사실을 그대로 반영합니다. 다음 거래일의 (시가 + 종가) ÷ 2가 공개된 진입 구간 안에 들어올 때만 체결로 처리하고, 그렇지 않으면 미체결로 남깁니다. 이 사이트에 표시되는 가격은 구조상 모두 지나간 가격이며 실시간 시세가 아닙니다.',
        ],
      },
      {
        h: '원금 손실이 발생할 수 있습니다',
        p: [
          '주가는 0원까지 떨어질 수 있습니다. 손절가는 보장이 아닙니다. 갭 하락으로 손절가를 뚫고 내려가면 그 아래에서 체결되고, 급변동 장세에서는 훨씬 아래에서 체결됩니다. 장기 포지션은 설계상 가격 손절 자체가 없습니다.',
          '잃어도 괜찮은 범위를 넘는 돈을 넣지 마십시오. 본인 상황에 맞는 조언이 필요하다면, 그 조언에 대해 이용자에게 책임을 지는 자격 있는 전문가를 찾으시기 바랍니다.',
        ],
      },
      {
        h: '이 사이트를 운영하는 분께',
        p: [
          '구독료, 협찬, 제휴 링크, 유료 등급 등 어떤 형태로든 수익을 붙이는 순간 미국과 한국 양쪽에서 규제 판단이 실질적으로 달라지고, 위에 적은 발행인 예외 논리도 더는 통하지 않을 수 있습니다. 첫 결제를 받은 뒤가 아니라 그 전에, 서비스하는 나라마다 증권 전문 변호사와 상담하십시오.',
          '개별 이용자의 상황에 맞춰 반응하는 기능을 붙이기 전에도 마찬가지입니다. 챗봇, 포트폴리오를 뽑아 주는 설문, 개인 맞춤 알림이 모두 여기에 해당합니다.',
        ],
      },
    ],
    contactNote: '본 고지에 대한 문의:',
  },

  /* ── 개인정보처리방침 ──────────────────────────────────────────────────────
     영문 Privacy Policy의 번역이 아니라, 「개인정보 보호법」과 온라인 맞춤형
     광고 개인정보 보호 가이드라인이 요구하는 고지 항목에 맞추어 별도로
     작성한 문서입니다. 제3자 제공과 처리위탁의 구분, 국외 이전, 행태정보,
     권익침해 구제방법은 한국법 고유의 요구사항이므로 영문판에 대응 항목이
     없습니다. */
  privacy: {
    title: '개인정보처리방침',
    lead:
      '본 사이트가 무엇을 수집하고 무엇을 수집하지 않는지, 호스팅 사업자와 광고 사업자가 무엇을 보게 되는지, 광고를 게재하면 무엇이 달라지는지를 밝힙니다.',
    effectiveLabel: '시행일',
    adsStatusOff:
      '현재 본 사이트에는 광고가 게재되어 있지 않습니다. 광고 스크립트를 불러오지 않고, 광고 쿠키를 설치하지 않으며, 이용자의 브라우저에서 광고 도메인으로 나가는 요청도 발생하지 않습니다. 아래 제8조와 제9조를 비롯하여 광고를 전제로 적은 내용은 앞으로 광고를 게재할 때 적용되며, 고지가 처리보다 먼저 이루어지도록 미리 작성하여 공개합니다.',
    adsStatusOn:
      '현재 본 사이트에는 광고가 게재되어 있습니다. 아래 제8조와 제9조는 이용자의 브라우저에서 어떤 정보가 나가는지, 이를 어떻게 거부할 수 있는지를 정하고 있습니다.',
    sections: [
      {
        h: '제1조 (본 방침의 목적과 적용 범위)',
        p: [
          'StockPulse(이하 "본 사이트")는 정적 웹사이트로서 회원가입, 로그인, 게시판, 댓글, 뉴스레터 발송 기능이 없고, 별도의 서버 애플리케이션이나 데이터베이스를 운영하지 않습니다. 이용자로부터 성명, 연락처, 생년월일 등 개인정보를 직접 수집하지 않습니다.',
          '본 사이트는 자체 쿠키를 설치하지 않으며, 브라우저의 로컬 저장소와 세션 저장소에도 어떠한 값도 기록하지 않습니다. 포지션 시뮬레이터의 계산은 전적으로 이용자 브라우저의 메모리에서 이루어지고 탭을 닫으면 사라집니다.',
          '접속 분석 도구(애널리틱스)는 설치되어 있지 않습니다. 앞으로 도입하는 경우에는 도입 전에 본 방침을 개정하여 공개합니다.',
          '「개인정보 보호법」은 국외에 있는 사업자라도 국내 이용자를 대상으로 재화 또는 서비스를 제공하는 경우 적용될 수 있습니다. 본 사이트는 한국어 서비스를 제공하므로, 영문 Privacy Policy와 별도로 국내 법령이 요구하는 사항에 맞추어 본 개인정보처리방침을 작성하여 공개합니다.',
        ],
      },
      {
        h: '제2조 (개인정보의 처리 목적)',
        p: [
          '본 사이트는 다음의 목적으로만 개인정보를 처리합니다. 아래 목적 외의 용도로는 이용하지 않으며, 목적이 변경되는 경우에는 사전에 동의를 받거나 본 방침을 개정하여 공개합니다.',
          '문의 응대: 전자우편으로 접수된 문의, 정정 요청, 열람·삭제 요구의 확인과 처리.',
          '서비스 제공: 이용자가 요청한 웹페이지의 전송. 이 과정에서 발생하는 접속 기록은 제6조의 호스팅 수탁자가 생성하고 보관합니다.',
          '온라인 맞춤형 광고(광고를 게재하는 경우에 한합니다): 광고의 게재, 노출 빈도 제어, 광고 성과 측정. 이 처리는 제5조의 광고 사업자가 자신의 책임으로 수행하며, 본 사이트 운영자가 수행하지 않습니다.',
          '법령상 의무의 이행과 권리 관계의 확인.',
        ],
      },
      {
        h: '제3조 (처리하는 개인정보의 항목)',
        p: [
          '직접 수집하는 항목: 없습니다. 회원가입 절차 자체가 없으므로 필수 항목도 선택 항목도 존재하지 않습니다.',
          '이용자가 문의 전자우편을 보내는 경우: 전자우편 주소, 그리고 이용자가 문의 내용에 스스로 적은 정보.',
          '인터넷 서비스 이용 과정에서 자동으로 생성·수집되는 항목: IP 주소, 브라우저 종류 및 버전(User-Agent), 요청 URL, 접속 일시, 연결 경로(리퍼러). 이 정보는 웹 호스팅 사업자의 서버 로그에 기록되며, 본 사이트 운영자는 이를 열람·조회·내려받기·삭제할 수 없습니다.',
          '광고를 게재하는 경우: 제9조에 정한 행태정보.',
        ],
      },
      {
        h: '제4조 (개인정보의 보유·이용기간 및 파기)',
        p: [
          '운영자가 직접 보유하는 이용자 개인정보는 없습니다.',
          '전자우편 문의로 수신한 개인정보는 문의 처리가 끝난 날부터 1년간 보관한 뒤 지체 없이 파기합니다. 이용자가 그 전에 파기를 요청하면 즉시 파기합니다.',
          '서버 로그와 행태정보의 보유·이용기간은 각각 제6조의 수탁자와 제5조의 광고 사업자가 자신의 정책에 따라 정하며, 본 사이트는 그 기간을 정하거나 변경할 수 없습니다.',
          '파기 방법: 전자적 파일 형태로 저장된 개인정보는 복구할 수 없는 방법으로 영구 삭제합니다.',
        ],
      },
      {
        h: '제5조 (개인정보의 제3자 제공)',
        p: [
          '본 사이트는 정보주체의 동의가 있거나 「개인정보 보호법」 제17조·제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다. 개인정보를 판매하지 않습니다.',
          '광고를 게재하는 경우 다음과 같이 제공합니다. 제공받는 자: Google LLC(유럽경제지역 이용자에 대하여는 Google Ireland Limited) / 제공 목적: 온라인 맞춤형 광고의 게재, 노출 빈도 제어, 광고 성과 측정 / 제공 항목: 제9조의 행태정보 / 보유·이용기간: Google의 광고 정책에 따른 기간.',
          'Google은 본 사이트의 지시 범위에서 처리하는 수탁자가 아니라, 자신의 광고 네트워크 전반에서 자신의 목적과 판단으로 정보를 처리합니다. 그래서 제6조의 처리위탁과 나누어 제3자 제공으로 기재합니다. 두 경우는 책임의 소재와 고지할 사항이 다르기 때문입니다.',
          '본 사이트는 Google 외의 광고 사업자와 계약하고 있지 않습니다. 사업자가 추가되는 경우에는 본 조에 그 사업자명을 기재하여 공개한 뒤에 게재를 시작합니다.',
        ],
      },
      {
        h: '제6조 (개인정보 처리업무의 위탁)',
        p: [
          '본 사이트는 「개인정보 보호법」 제26조에 따라 다음과 같이 처리업무를 위탁하고 있습니다. 수탁자: GitHub, Inc. / 위탁업무의 내용: 정적 웹사이트 호스팅 및 콘텐츠 전송.',
          '수탁자는 위탁받은 업무의 범위에서만 개인정보를 처리합니다. 수탁자 또는 위탁업무의 내용이 변경되는 경우에는 본 방침을 통하여 공개합니다.',
        ],
        links: [
          {
            label: 'GitHub 개인정보 처리방침(영문)',
            url: 'https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement',
          },
        ],
      },
      {
        h: '제7조 (개인정보의 국외 이전)',
        p: [
          '본 사이트의 호스팅 서버와 광고 사업자의 서버는 대한민국 밖에 있습니다. 따라서 이용자가 본 사이트에 접속하는 것만으로 아래와 같은 국외 이전이 발생합니다. 「개인정보 보호법」 제28조의8에 따라 이전에 관한 사항을 아래와 같이 공개합니다.',
          '(1) 이전받는 자: GitHub, Inc. / 이전되는 국가: 미국 및 GitHub이 콘텐츠 전송망을 운영하는 국가 / 이전 일시 및 방법: 이용자가 페이지를 요청하는 시점에 정보통신망을 통하여 자동으로 이전 / 이전 항목: IP 주소, 브라우저 정보, 요청 URL, 접속 일시 / 이전받는 자의 이용 목적: 웹사이트 호스팅 및 콘텐츠 전송 / 보유·이용기간: GitHub의 정책에 따른 기간.',
          '(2) 이전받는 자: Google LLC / 이전되는 국가: 미국 및 Google이 데이터센터를 운영하는 국가 / 이전 일시 및 방법: 광고가 게재된 페이지에서 광고 스크립트가 실행되는 시점에 정보통신망을 통하여 자동으로 이전 / 이전 항목: 제9조의 행태정보 / 이전받는 자의 이용 목적: 맞춤형 광고의 게재 및 성과 측정 / 보유·이용기간: Google의 정책에 따른 기간.',
          '이용자는 국외 이전을 거부할 수 있습니다. 광고와 관련된 이전은 제9조의 거부 방법으로 차단할 수 있습니다. 다만 호스팅과 관련된 이전은 웹페이지를 전송받는 행위 자체에 따라붙으므로, 이를 거부하려면 본 사이트 접속을 중단하는 방법밖에 없습니다. 이 점을 감추지 않고 밝힙니다.',
        ],
      },
      {
        h: '제8조 (개인정보 자동 수집 장치의 설치·운영 및 거부에 관한 사항)',
        p: [
          '쿠키는 웹사이트나 그 사이트에 삽입된 제3자가 이용자의 브라우저에 저장해 두었다가 다음 요청 때 다시 읽어 가는 작은 파일입니다. 웹비콘(픽셀)은 불러오는 행위 자체가 서버에 기록으로 남는, 눈에 보이지 않는 아주 작은 이미지입니다. 둘 다 같은 브라우저를 다시 알아보기 위한 장치입니다.',
          '본 사이트는 자체 쿠키를 설치하지 않습니다. 광고를 게재하는 경우에 한하여 광고 사업자의 쿠키와 유사한 식별자가 이용자의 브라우저에 저장될 수 있습니다.',
          '쿠키 설치에 대한 선택권은 이용자에게 있습니다. 브라우저 설정에서 모든 쿠키를 허용하거나, 저장될 때마다 확인을 거치거나, 저장을 모두 거부할 수 있습니다. 설정 경로 예시: Chrome은 설정 → 개인정보 보호 및 보안 → 서드파티 쿠키, Edge는 설정 → 쿠키 및 사이트 권한, Safari는 설정 → 개인 정보 보호입니다.',
          '쿠키를 모두 거부하더라도 본 사이트의 열람과 기능 이용에는 아무런 제한이 없습니다. 본 사이트의 어떤 기능도 쿠키를 필요로 하지 않습니다.',
        ],
      },
      {
        h: '제9조 (온라인 맞춤형 광고를 위한 행태정보의 수집·이용·제공 및 거부)',
        p: [
          '수집·이용하는 행태정보의 항목: 이용자의 웹사이트 방문 이력, 광고 요청·노출·조회·클릭 이력, 쿠키와 웹비콘(픽셀)에 저장된 광고 식별자, IP 주소, 기기 및 브라우저 정보, 접속 일시.',
          '수집 방법: 이용자가 광고가 게재된 페이지를 열람하거나 광고를 조회·클릭할 때, 광고 사업자가 제공하는 자동 수집 장치(쿠키, 웹비콘, 픽셀 등)를 통하여 자동으로 수집되어 광고 사업자에게 전송됩니다. 본 사이트의 서버는 이를 수집하지도, 보관하지도 않습니다.',
          '이용 목적: 이용자의 관심과 성향에 기반한 맞춤형 광고의 제공, 같은 광고가 반복 노출되지 않도록 하는 빈도 제어, 광고 효과 측정 및 부정 클릭 방지.',
          '행태정보를 수집·처리하는 광고 사업자: Google LLC(유럽경제지역 이용자에 대하여는 Google Ireland Limited).',
          '보유·이용기간 및 이후 처리: 본 사이트 운영자는 행태정보를 직접 보유하지 않습니다. 보유·이용기간은 광고 사업자인 Google의 광고 정책 및 쿠키 정책에 따르며, 이용자는 Google 광고 설정에서 관련 데이터를 직접 확인하고 삭제할 수 있습니다. 브라우저에 저장된 쿠키는 이용자가 삭제하는 즉시 파기됩니다.',
          '이용자 통제권의 행사(거부) 방법: ① 페이지 하단의 "쿠키 설정"을 눌러 동의를 변경하거나 철회합니다(동의 관리 도구가 표시되는 지역에 한합니다). ② Google 광고 설정에서 맞춤형 광고를 해제합니다. ③ 제8조의 방법으로 브라우저에서 쿠키를 차단하거나 삭제합니다.',
          '맞춤형 광고를 거부하더라도 광고 자체는 계속 노출될 수 있으며, 다만 이용자의 관심사에 기반하지 않은 광고가 노출됩니다. 거부하였다는 이유로 본 사이트의 열람이나 기능 이용이 제한되지 않습니다.',
          '행태정보의 수집·이용·거부와 관련한 상담과 신고는 제12조의 개인정보 보호책임자에게 하실 수 있으며, 제13조에 적은 개인정보침해 신고센터(국번 없이 118)와 개인정보 분쟁조정위원회(1833-6972)도 이용하실 수 있습니다.',
          '본 사이트는 만 14세 미만 아동을 주 이용자로 하지 않으며, 아동을 대상으로 행태정보를 수집하지 않습니다.',
        ],
        links: [
          { label: 'Google 광고 설정 — 맞춤형 광고 해제', url: 'https://www.google.com/settings/ads' },
          {
            label: 'Google 서비스를 사용하는 사이트의 정보 이용 방식',
            url: 'https://policies.google.com/technologies/partner-sites',
          },
          { label: 'Google 광고 개인정보처리방침', url: 'https://policies.google.com/technologies/ads' },
        ],
      },
      {
        h: '제10조 (정보주체와 법정대리인의 권리·의무 및 그 행사방법)',
        p: [
          '이용자는 언제든지 개인정보의 열람, 정정·삭제, 처리정지, 동의 철회를 요구할 수 있습니다. 만 14세 미만 아동의 개인정보에 대하여는 법정대리인이 그 권리를 행사할 수 있습니다.',
          '요구는 제12조의 연락처로 전자우편을 통하여 접수하며, 접수일부터 10일 이내에 조치하고 그 결과를 통지합니다.',
          '본 사이트가 직접 보유한 개인정보가 없으므로 상당수의 요구에 대하여는 "보유하고 있는 개인정보가 없음"을 확인하여 회신하게 됩니다. 이 경우 호스팅 사업자와 광고 사업자의 접수 창구를 함께 안내합니다.',
          '대리인을 통하여 요구하는 경우에는 위임 사실을 확인할 수 있는 서류를 제출하여야 합니다.',
        ],
      },
      {
        h: '제11조 (개인정보의 안전성 확보조치)',
        p: [
          '본 사이트는 개인정보를 수집하지 않는 구조 자체를 일차적인 보호 조치로 삼고 있습니다. 수집되지 않은 정보는 유출될 수 없습니다.',
          '모든 페이지는 HTTPS로 전송하며, 사이트 소스와 데이터 파이프라인은 공개 저장소에서 관리하여 변경 이력을 누구나 확인할 수 있도록 하고 있습니다.',
          '이용자로부터 수신한 전자우편은 접근 권한이 부여된 운영자 계정에서만 열람합니다.',
        ],
      },
      {
        h: '제12조 (개인정보 보호책임자)',
        p: [
          '개인정보 보호책임자 성명: [운영자 성명 — 공개 전 반드시 기재] / 직책: 운영자 / 연락처: 본 페이지 하단의 전자우편 주소.',
          '정보주체는 본 사이트를 이용하면서 발생한 모든 개인정보 보호 관련 문의, 불만 처리, 피해 구제를 개인정보 보호책임자에게 요청할 수 있으며, 본 사이트는 지체 없이 답변하고 처리합니다.',
        ],
      },
      {
        h: '제13조 (권익침해에 대한 구제방법)',
        p: [
          '정보주체는 개인정보 침해로 인한 구제를 받기 위하여 아래 기관에 분쟁 해결이나 상담을 신청할 수 있습니다. 아래 기관은 본 사이트와 별개의 기관으로서, 본 사이트의 처리에 만족하지 못하거나 보다 자세한 도움이 필요한 경우 이용하실 수 있습니다.',
          '개인정보분쟁조정위원회: (국번 없이) 1833-6972 / www.kopico.go.kr',
          '개인정보침해신고센터: (국번 없이) 118 / privacy.kisa.or.kr',
          '대검찰청 사이버수사과: (국번 없이) 1301 / www.spo.go.kr',
          '경찰청 국가수사본부 사이버수사국: (국번 없이) 182 / ecrm.police.go.kr',
          '「개인정보 보호법」 제35조(개인정보의 열람), 제36조(개인정보의 정정·삭제), 제37조(개인정보의 처리정지 등)에 따른 요구에 대하여 공공기관의 장이 한 처분 또는 부작위로 권리 또는 이익을 침해받은 사람은 「행정심판법」이 정하는 바에 따라 행정심판을 청구할 수 있습니다.',
        ],
        links: [
          { label: '개인정보분쟁조정위원회', url: 'https://www.kopico.go.kr' },
          { label: '개인정보침해신고센터', url: 'https://privacy.kisa.or.kr' },
        ],
      },
      {
        h: '제14조 (개인정보처리방침의 변경)',
        p: [
          '본 방침의 시행일은 페이지 상단에 표시합니다.',
          '법령이나 정책, 보안 기술의 변경에 따라 내용을 추가·삭제·수정하는 경우에는 시행 7일 전부터 본 페이지를 통하여 공지합니다. 다만 수집 항목, 이용 목적, 제3자 제공, 국외 이전과 같이 이용자의 권리에 중대한 영향을 미치는 변경은 시행 30일 전부터 공지합니다.',
          '개정 내용을 소급하여 적용하지 않습니다.',
        ],
      },
    ] as LegalSection[],
    contactHeading: '개인정보 관련 문의',
    contactNote: '개인정보 열람·정정·삭제·처리정지 요구를 포함한 모든 문의는 아래 주소로 접수합니다:',
  },

  /* ── 이용약관 ────────────────────────────────────────────────────────────── */
  terms: {
    title: '이용약관',
    lead:
      '본 사이트를 이용하면 동의한 것으로 보는 약관입니다. 분량은 짧고, 가장 중요한 내용은 이곳의 어떤 것도 투자자문이 아니라는 점입니다.',
    effectiveLabel: '시행일',
    governingLawUnset:
      '아래 준거법 조항이 아직 채워지지 않았습니다. 대괄호로 표시한 부분은 임시 문구이며, 운영자가 공개 전에 실제 관할로 바꾸어야 합니다.',
    sections: [
      {
        h: '제1조 (약관의 동의)',
        p: [
          '이용자가 본 사이트의 페이지를 열람하면 본 약관에 동의한 것으로 봅니다. 동의하지 않으신다면 이용을 중단하여 주십시오. 회원가입도 계정도 없으므로 별도의 해지 절차 없이 이용을 그만두는 것으로 충분합니다.',
          '본 약관은 면책 고지 및 개인정보처리방침과 함께 적용됩니다. 면책 고지는 콘텐츠의 성격을, 본 약관은 이용자와 운영자 사이의 법률관계를, 개인정보처리방침은 정보의 처리를 각각 정합니다. 세 문서를 함께 읽어 주십시오.',
        ],
      },
      {
        h: '제2조 (순위의 성격)',
        p: [
          '본 사이트의 모든 순위표는 적용에 앞서 방법론 페이지에 전문을 공개한 점수 산식의 결과물입니다. 1위 종목은 해당 날짜에 정해진 유니버스 안에서 그 산식의 점수가 가장 높았던 종목이라는 뜻이며, 이 사이트가 하는 주장은 거기까지입니다. 그보다 큰 의미로 읽어서는 안 됩니다.',
          '순위는 예측도, 전망도, 목표주가도, 매수 권유도 아니며, 해당 종목이 이용자에게 적합하다는 진술도 아닙니다. 산식은 미래를 알지 못하고, 그 산식을 만든 사람도 마찬가지입니다.',
          '순서를 정하는 데 사람의 재량은 개입하지 않습니다. 특정 종목을 손으로 올리거나 내리는 장치는 아예 없습니다. 이 제약이 있어야 공개 성과 검증이 의미를 가집니다. 다만 같은 제약이 반대 방향으로도 작동합니다. 사람이 보기에 잘못된 결과라도 산식이 놓은 자리에 그대로 남으며, 해결책은 결과를 손보는 것이 아니라 산식 자체를 공개적으로 바꾸고 버전을 올리는 것입니다.',
        ],
      },
      {
        h: '제3조 (투자자문의 부인 및 자문관계의 부존재)',
        p: [
          '본 사이트의 콘텐츠는 불특정 다수에게 공개하는 일반적인 시장 조사·교육 정보입니다. 개인별 투자자문이 아니며, 이용자의 투자 목적, 재산 상황, 세금 문제, 이미 보유한 자산, 투자 기간, 손실을 감당할 수 있는 정도를 전혀 고려하지 않습니다.',
          'StockPulse는 어느 나라에서도 등록된 투자자문업자, 투자중개업자, 재무설계사가 아닙니다. 운영자는 투자자문을 할 자격이 없고, 하지도 않습니다.',
          '본 사이트를 이용한다고 하여 자문관계, 중개관계, 그 밖의 어떠한 고객관계도 성립하지 않으며, 운영자와 주고받은 연락에서 그러한 관계가 추단되지도 않습니다.',
        ],
      },
      {
        h: '제4조 (신인의무의 부존재)',
        p: [
          '운영자는 이용자에 대하여 신인의무를 지지 않으며, 이용자의 투자 판단에 관한 주의의무, 적합성 확인 의무, 최선집행의무도 지지 않습니다. 이러한 의무는 본 사이트가 이용자와 맺지 않는 관계에서 생기는 것이고, 본 사이트는 그런 관계를 제안하지도 원하지도 않습니다.',
          '매수·보유·매도의 모든 결정은 전적으로 이용자 본인의 몫이며, 이용자 자신의 분석이나 이용자에게 책임을 지는 전문가의 조언에 따라 이루어져야 합니다.',
        ],
      },
      {
        h: '제5조 (보증의 부인)',
        p: [
          '본 사이트와 그 콘텐츠는 "있는 그대로(as is)" 그리고 "이용 가능한 상태로(as available)" 제공되며, 상품성, 특정 목적에의 적합성, 정확성, 완전성, 적시성, 권리 비침해, 중단 없는 운영에 관한 명시적·묵시적 보증을 일체 하지 않습니다.',
          '데이터는 언제든 멈추고, 호출을 제한하고, 형식을 바꾸며, 때로는 틀린 값을 내보내는 공개 소스에서 옵니다. 기업행위, 종목코드 변경, 상장폐지, 재무제표 정정이 늦게 반영되거나 아예 반영되지 않을 수 있습니다. 본 사이트의 모든 가격은 종가 기준이며 구조상 모두 지나간 가격입니다. 실시간 시세는 어디에도 없습니다.',
          '특정 시점에 접속이 가능한지, 개별 수치가 정확한지, 오류를 언제까지 고치는지에 관하여 어떠한 진술도 하지 않습니다. 실제로 실행에 옮길 내용은 반드시 원 출처에서 다시 확인하시기 바랍니다.',
        ],
      },
      {
        h: '제6조 (책임의 제한)',
        p: [
          '관련 법령이 허용하는 최대 범위에서, 운영자와 기여자는 본 사이트의 이용 또는 이용 불능으로 인하여 발생한 매매 손실, 투자 손실, 일실이익, 기회 상실, 데이터 손실, 영업 중단, 그 밖의 간접적·부수적·특별·결과적·징벌적 손해에 대하여 책임을 지지 않습니다. 청구의 법적 성질이 계약, 불법행위, 과실, 무과실책임 중 무엇이든, 손해 발생 가능성을 알았는지 여부와 관계없이 같습니다.',
          '법률상 책임을 배제할 수 없는 경우, 그 책임은 이용자가 본 사이트 이용을 위하여 지급한 금액(즉 0원)과 관련 법령이 요구하는 최소 금액 중 큰 금액으로 제한됩니다.',
          '본 약관의 어떠한 조항도 사기, 고의 또는 중대한 과실로 인한 책임, 생명·신체의 침해에 대한 책임, 그 밖에 법률상 배제할 수 없는 책임을 배제하거나 제한하지 않습니다. 일부 관할에서는 특정 면책이 허용되지 않으며, 그러한 관할에서는 허용되는 범위에서만 적용되고 나머지 조항은 그대로 효력을 유지합니다.',
        ],
      },
      {
        h: '제7조 (이용자의 금지행위)',
        p: [
          '이용자는 본 사이트를 열람하고, 출처와 링크를 밝혀 짧게 인용하며, 공개된 JSON·RSS 주소를 주기적으로 받아 개인적으로 이용할 수 있습니다. 해당 주소는 HTML을 긁어 갈 필요가 없도록 제공하는 것입니다.',
          '다음 행위는 금지합니다. 순위표를 자신의 저작물, 자문 또는 전망인 것처럼 제시하는 행위, 표를 재게시하면서 준수 고지를 제거하는 행위, 콘텐츠에 대한 접근권을 판매하는 행위, 유료 종목 정보 서비스나 알림 서비스의 원천 데이터로 사용하는 행위, 공개된 피드로 대체 가능함에도 과도한 부하를 유발하는 크롤링 등으로 다른 이용자의 접속을 저해하는 행위, 사이트·빌드 파이프라인·저장소를 방해하거나 방해를 시도하는 행위, 본 사이트의 순위를 추천으로 제시하는 모델의 학습에 콘텐츠를 사용하는 행위.',
          '위 범위 안에서라면 공개 데이터 파일에 프로그램으로 접근하셔도 좋습니다. 다만 대량으로 수집하는 경우에는 User-Agent에 사용 주체를 정직하게 밝혀 주십시오.',
        ],
      },
      {
        h: '제8조 (지식재산권과 이용 허락)',
        p: [
          '파이프라인은 오픈소스이지만 콘텐츠는 오픈소스가 아닙니다. 둘은 서로 다른 것이고, 그 구분은 의도한 것입니다.',
          '데이터 파이프라인, 점수 산식의 구현 코드, 사이트 소스는 공개 저장소에 있습니다. 해당 코드에 적용되는 라이선스는 저장소의 라이선스 파일에 기재된 것입니다. 라이선스 파일이 없다면 어떠한 이용 허락도 부여되지 않은 것이므로, 코드를 재사용하기 전에 문의하여 주십시오. 저장소가 공개되어 있다는 사실 자체가 권리의 부여는 아닙니다.',
          '공개된 콘텐츠는 이와 별개이며 오픈소스가 아닙니다. 각 페이지의 문안, 저작물로서의 방법론 문서, 순위 산출 결과, 거래 원장, 사이트 디자인의 권리는 운영자에게 있습니다. 출처와 링크를 표시한 짧은 인용은 허용하나, 순위표 전체의 재게시, 사이트의 미러링, 산출물을 이용한 경쟁 서비스 구축은 허용하지 않습니다.',
          '"StockPulse"라는 명칭과 본 사이트의 표장은 이용자에게 사용을 허락하지 않습니다.',
          '시장 데이터와 뉴스 헤드라인의 권리는 각 출처에 있으며, 본 사이트에서는 조사·논평 목적으로 이용합니다. 출처가 별도의 이용 조건을 정한 경우 그 조건은 데이터와 함께 이용자에게도 적용됩니다.',
        ],
      },
      {
        h: '제9조 (외부 링크와 광고)',
        p: [
          '다른 사이트로 연결되는 링크는 참고를 위하여 제공합니다. 운영자는 해당 사이트를 통제하지 않고, 보증하지 않으며, 그 내용이나 개인정보 처리에 대하여 책임지지 않습니다.',
          '광고가 게재되는 경우 개별 광고는 광고 사업자가 고르며 운영자가 고르지 않습니다. 순위표 옆에 붙은 광고는 광고주를 보증하는 것이 아니고, 광고주는 어떤 순위에도 영향을 미치지 않습니다. 특정 종목을 넣거나 빼거나 순위를 올려 주는 대가를 발행사·운용사·증권사·홍보 대행사 어느 곳에서도 받지 않습니다.',
        ],
      },
      {
        h: '제10조 (약관의 변경과 서비스의 중단)',
        p: [
          '사이트, 발행하는 순위표, 본 약관은 모두 바뀔 수 있습니다. 본 약관의 중요한 변경은 새 시행일과 함께 이 페이지에 게시하며, 시행일 이후에도 계속 이용하시면 변경에 동의한 것으로 봅니다.',
          '본 사이트는 사전 통지 없이 전부 또는 일부의 제공이 중단될 수 있습니다. 무상으로 제공하는 간행물이며 서비스 수준에 관한 약정을 포함하지 않습니다.',
        ],
      },
      {
        h: '제11조 (준거법 및 재판관할)',
        p: [
          '본 약관은 {jurisdiction}의 법률을 준거법으로 하며, 국제사법의 저촉규정은 적용하지 않습니다. 본 약관 또는 본 사이트의 이용에서 발생하는 분쟁에 대하여는 {jurisdiction}의 법원을 관할 법원으로 합니다.',
          '이용자가 소비자인 경우, 본 조는 이용자가 거주하는 국가의 강행적 소비자 보호 규정에 따른 보호를 박탈하지 않으며, 거주지 법원에 소를 제기할 수 있는 법률상 권리를 제한하지 않습니다.',
        ],
      },
      {
        h: '제12조 (분리가능성, 권리 불포기, 완전합의)',
        p: [
          '본 약관의 어느 조항이 집행 불가능하다고 판단되는 경우에도 나머지 조항은 그대로 효력을 유지하며, 해당 조항은 집행 가능하게 되는 최소한의 범위로 축소하여 해석합니다.',
          '어떤 조항을 즉시 행사하지 않았다고 하여 그 권리를 포기한 것으로 보지 않습니다.',
          '본 약관과 면책 고지, 개인정보처리방침은 본 사이트에 관한 이용자와 운영자 사이의 완전한 합의를 구성합니다.',
        ],
      },
    ] as LegalSection[],
    contactHeading: '본 약관에 대한 문의',
  },

  /* ── 편집·정정 정책 ──────────────────────────────────────────────────────── */
  editorial: {
    title: '편집·정정 정책',
    lead: '수치를 어떻게 산출하는지, 문안을 어떻게 쓰는지, AI를 어디에 쓰는지, 오류가 확인되면 무엇을 하는지를 정한 문서입니다.',
    effectiveLabel: '시행일',
    sections: [
      {
        h: '순위의 산출 방식',
        p: [
          '모든 순위표는 적용 전에 전문을 공개한 산식에 따라 프로그램이 계산합니다. 들어가는 것은 공개 소스에서 모은 주가, 재무, 헤드라인 집계이고 나오는 것은 순서입니다. 그 사이에 편집이 끼어드는 단계는 없습니다.',
          '사람이 특정 종목을 고르거나, 올리거나, 내리거나, 빼지 않습니다. 손으로 개입하는 장치가 없고 설계상 그것을 둘 자리도 없습니다. 이용자가 보는 순위표는 그날 공개된 산식이 내놓은 결과이며, 같은 입력과 공개된 코드만 있으면 누구나 그대로 재현할 수 있습니다.',
          '이 원칙의 결과는 불편하더라도 분명히 밝혀 둘 필요가 있습니다. 사람이 보기에 잘못된 결과라도 산식이 놓은 자리에 그대로 남습니다. 해결책은 산출물을 손보는 것이 아니라, 근거를 문서로 남기고 버전을 올리면서 산식 자체를 공개적으로 변경하는 것입니다.',
          '분산 규칙(섹터 상한, 상관관계 상한, 재료 묶음 상한)은 점수가 충분히 높았던 종목도 빼낼 수 있습니다. 그럴 때에는 빠진 종목과 그 종목을 밀어낸 규칙을 함께 공개합니다. 제약이 실제로 작동했다는 것을 말로 주장하지 않고 자료로 보이기 위해서입니다.',
        ],
      },
      {
        h: '문안의 작성 방식',
        p: [
          '방법론 문서, 표마다 붙는 설명, 본 정책을 포함해 사이트의 모든 문안은 운영자가 쓰고, 그것을 구현한 코드와 대조해 둘이 맞아떨어질 때까지 고칩니다. 파이프라인의 동작을 설명하는 문안은 의도가 아니라 구현을 보고 씁니다.',
          '어떤 수치에 관한 주장이든 그 수치를 규칙까지 거슬러 확인할 수 없으면 게재하지 않습니다. 모르는 것은 모른다고 적습니다. 소개 페이지의 "알려진 한계" 목록이 그 때문에 있으며, 구색으로 둔 항목이 아니라 계속 손보는 항목입니다.',
          '본 사이트에는 협찬받은 글도, 대가를 받고 쓴 글도, 남에게서 받아 온 글도 없습니다. 운영자가 아닌 사람이 올린 페이지도 없습니다.',
        ],
      },
      {
        h: 'AI 사용의 고지',
        p: [
          '본 사이트를 만드는 데 AI 도구를 씁니다. 문안 초안 작성과 교정, 코드 작성과 검토, 영어와 한국어 사이의 번역 보조가 그 범위입니다. 이 사실을 묻어 두지 않고 여기에 밝히며, 개별 글의 초안을 실질적으로 AI가 쓴 경우에는 그 페이지에도 함께 표시합니다.',
          '무엇을 어떤 순서로 올릴지는 AI가 정하지 않습니다. 순위는 공개된 입력을 놓고 하는 산술 계산이며, 어떤 모델의 출력도 점수에 들어가지 않습니다. 순위표를 만드는 파이프라인 어디에도 언어 모델은 쓰이지 않습니다. 헤드라인 감성 점수도 공개된 단어 사전으로 매긴 값이고, 모델로 오해받지 않도록 그렇게 못 박아 두었습니다.',
          '모델이 그렇게 말했다는 이유만으로 올라가는 페이지는 없습니다. 게재하는 모든 페이지는 사람이 검토하고, 사실 주장은 코드나 출처와 하나씩 대조해 확인합니다. 확인할 수 없는 문장은 표현을 누그러뜨리는 대신 아예 잘라 냈습니다.',
        ],
      },
      {
        h: '정정',
        p: [
          '거래 원장은 추가 전용입니다. 버전 관리 시스템에 보관되어 모든 과거 버전을 누구나 diff로 확인할 수 있으며, 행을 삭제하지 않습니다.',
          '잘못 발행한 건은 사유를 적어 무효로 표시하고 성과 페이지에 그대로 남깁니다. 지우지 않으며, 통계에서 그 건을 어떻게 처리했는지도 함께 밝힙니다. 불리한 줄을 슬쩍 지우는 것이야말로 공개 검증이 막으려는 바로 그 관행입니다.',
          '문안의 사실 오류는 그 자리에서 고칩니다. 오류가 공개된 주장의 의미까지 바꾼 경우에는 슬쩍 덮어쓰지 않고 정정 일자를 함께 표시합니다.',
          '표본 부족 경고는 해당 투자 기간의 청산 완료 포지션이 30건이 될 때까지 유지합니다. 장기 순위표에서는 몇 년이 걸릴 텐데, 그 몇 년 동안 경고를 그대로 둡니다.',
        ],
      },
      {
        h: '버전 관리와 변경 통제',
        p: [
          '방법론에는 버전 번호가 붙고, 발행하는 순간 모든 순위 파일에 그 버전이 함께 기록됩니다. 가중치나 규칙을 바꾸면 버전을 올리고 변경 사유를 문서로 남겨 커밋합니다.',
          '과거 발행 건은 만들어질 당시의 버전을 그대로 달고 있으므로, 산식을 바꿔 과거 성과를 슬쩍 고쳐 쓸 수 없습니다. 버전이 바뀌는 구간에 걸쳐 있는 성과에는 그 사실을 표시합니다.',
          '이 장치가 있어야 기록을 반증할 수 있습니다. 이것이 없으면 어떤 전략이든 규칙을 바꿔 과거를 다시 계산하는 방식으로 뒤늦게 그럴듯하게 꾸며 낼 수 있습니다.',
        ],
      },
      {
        h: '독립성',
        p: [
          '특정 종목을 넣거나 빼거나 순위를 올려 주는 대가를 발행사·운용사·증권사·홍보 대행사 어느 곳에서도 받지 않으며, 그런 대가를 받을 수 있는 계약 관계 자체가 없습니다. 광고가 게재되는 경우 개별 광고는 광고 사업자가 고르며 어떤 순위와도 연결되지 않습니다.',
          '운영자가 순위표에 오른 종목을 보유하고 있을 수도, 보유하지 않을 수도 있으며 어느 쪽인지 밝히지 않습니다. 이해상충이 있을 수 있다고 전제하고 내용을 판단하시기 바랍니다.',
        ],
      },
      {
        h: '오류 신고 방법',
        p: [
          '문의 주소로 페이지, 순위표에 표시된 날짜, 종목코드, 올바르다고 보시는 값을 적어 보내 주십시오. 화면 캡처가 있으면 도움이 됩니다. 기술적인 문제라면 저장소에 공개 이슈로 올리셔도 됩니다. 같은 문제를 겪는 다른 이용자에게도 내용이 보이기 때문에 대체로 더 빠릅니다.',
          '공개된 수치에서 실제 오류를 짚어 준 신고는 다른 모든 일에 앞서 처리합니다. 정정은 위 원칙에 따라 고치고, 기록하고, 그대로 남기는 방식으로 합니다.',
        ],
      },
    ] as LegalSection[],
  },

  /* ── 문의 ────────────────────────────────────────────────────────────────── */
  contact: {
    title: '문의',
    lead: '사람이 직접 확인하는 주소 하나로 운영합니다. 정정 요청, 개인정보 관련 요구, 법적 통지, 수치가 어떻게 나왔는지에 대한 질문을 받습니다.',
    emailHeading: '전자우편',
    emailNote:
      '정정 요청, 데이터 오류 신고, 개인정보 열람·삭제 요구, 법적 통지, 라이선스 문의, 광고 관련 업무를 모두 이 주소에서 처리합니다. 접수된 척하고 입력값을 버리는 양식이 아니라, 실제로 메일이 도착하는 사서함입니다.',
    responseHeading: '응답 기준',
    responseNote:
      '영업일 기준 {days}일 안에 1차 회신을 드립니다. 공개된 수치에 영향을 주는 정정 요청은 다른 모든 문의에 앞서 처리하며, 편집·정정 정책에 따라 오류를 고치고 정정한 사실을 기록하되 원래 기록을 임의로 지우지 않습니다.',
    repoHeading: '소스 저장소',
    repoNote:
      '이 사이트를 만들어 내는 것은 모두 공개되어 있습니다. 점수 산식 코드, 방법론 문서, 사이트 자체, 그리고 전체 변경 이력까지 그렇습니다. 어떤 수치를 만든 코드를 직접 읽어 보고, 모두가 보는 자리에 이슈를 올리고, 주장을 믿는 대신 변경 이력을 확인하실 수 있습니다. 기술적인 문제라면 이 경로가 대체로 더 빠릅니다.',
    correctionsHeading: '데이터 오류 신고',
    correctionsNote:
      '페이지, 순위표에 표시된 날짜, 종목코드, 올바르다고 보시는 값을 함께 적어 주십시오. 화면 캡처가 있으면 도움이 됩니다. 공개 시장 데이터에 오류가 있는 일은 드물지 않으며, 본 사이트는 그것을 변명하기보다 전해 듣는 쪽을 택합니다.',
    noAdviceHeading: '이 창구에서 할 수 없는 것',
    noAdviceNote:
      '투자자문을 받거나, 보유 종목에 대한 의견을 구하거나, 사도 되는지를 물어보는 용도로는 이용하실 수 없습니다. 그런 문의에는 면책 고지를 안내하는 회신을 드립니다. 개별적으로 답을 드리는 순간 일반 간행물이 개인별 자문이 되고, 그 선은 본 사이트가 넘지 않습니다.',
    privacyHeading: '보내신 내용의 처리',
    privacyNote:
      '보내신 메일은 도착한 사서함에만 남습니다. 티켓 시스템도, 고객관리 시스템도, 발송용 주소록도 없습니다. 문의가 오가는 동안과 끝난 뒤 최대 12개월까지 보관한 다음 삭제하며, 요청하시면 그 전에 삭제합니다.',
  },

  seo: {
    home: {
      title: '미국·한국 증시 일간 종목 순위 | StockPulse',
      description:
        '미국·한국 증시를 대상으로 투자 기간 4종의 규칙 기반 스크리너를 매 거래일 다시 계산합니다. 규칙 전문 공개, 진입가·손절가 제시, 과거 발행 종목의 성과 전수 검증.',
    },
    methodology: {
      title: '종목 순위 산정 방법론 전문 | StockPulse',
      description:
        '적용하기 전에 미리 공개하는 점수 산정 규칙 전문입니다. 횡단면 z 점수, 시점 기준 데이터, 분산 제약, 그리고 성과 검증에 쓰는 청산 규칙까지 그대로 담았습니다.',
    },
    performance: {
      title: '발행 종목 전수 성과 검증 기록 | StockPulse',
      description:
        '무작위 대조군 대비 승률, 벤치마크 대비 평균 수익률, 미체결 건수, 거래 원장 전체를 공개합니다. 나중에 지우는 일 없이 손실로 끝난 건도 그대로 남깁니다.',
    },
    news: {
      title: '순위 종목 연계 시장 뉴스 | StockPulse',
      description:
        '미국·한국 순위표 종목에 걸린 헤드라인입니다. 단어 사전으로 매긴 감성 점수, 여러 매체가 함께 다룬 기사 묶음, 소스별 피드 상태를 함께 제공합니다.',
    },
    sectors: {
      title: '미국·한국 섹터 자금 흐름 지도 | StockPulse',
      description:
        '시가총액이 어느 섹터에 몰려 있고 1일·5일·20일 동안 어떻게 움직였는지 트리맵으로 보여 줍니다. 섹터별 상승 종목 비율과 상승·하락 종목 수도 함께 제공합니다.',
    },
    simulator: {
      title: '포지션 크기·손절 손실 계산기 | StockPulse',
      description:
        '가상의 금액을 순위표에 나눠 담아 수량, 손절이 모두 걸렸을 때의 손실 합계, 시나리오별 손익을 계산합니다. 브라우저에서만 돌아가며 아무것도 저장하지 않습니다.',
    },
    alerts: {
      title: '기계 판독 가능 순위 피드: JSON·RSS | StockPulse',
      description:
        '모든 순위표를 주소가 바뀌지 않는 JSON과 RSS로 발행합니다. API 키도 계정도 필요 없습니다. 이메일 알림은 아직 제공하지 않으며, 그 사실을 이 페이지에 그대로 적어 두었습니다.',
    },
    about: {
      title: 'StockPulse 소개 — 순위 산정 방식과 운영자',
      description:
        '이 사이트가 어떤 사이트이고 어떤 사이트가 아닌지, 점수를 어떻게 계산하는지, 데이터는 어디서 오는지, 그리고 가장 최근 실행의 소스별 신뢰도를 공개합니다.',
    },
    disclaimer: {
      title: '면책 고지: 투자자문이 아닙니다 | StockPulse',
      description:
        '투자자문이 아니고, 투자자문업 등록도 하지 않았으며, 과거 성과는 아무것도 보장하지 않습니다. 데이터는 틀릴 수 있고 모두 종가 기준이며 원금 손실이 날 수 있습니다.',
    },
    privacy: {
      title: '개인정보처리방침: 수집 항목 안내 | StockPulse',
      description:
        '수집하는 항목과 수집하지 않는 항목, 제3자 제공과 국외 이전, 행태정보 거부 방법, 열람·삭제 요구 절차를 「개인정보 보호법」에 맞추어 밝힙니다.',
    },
    terms: {
      title: '이용약관 — 종목 리서치 사이트 | StockPulse',
      description:
        '순위표와 공개 데이터 피드, 게시글 이용에 적용되는 약관입니다. 책임의 한계, 그리고 자문관계가 성립하지 않는다는 점을 함께 정하고 있습니다.',
    },
    editorial: {
      title: '편집 정책: 콘텐츠 제작 방식 | StockPulse',
      description:
        '누가 쓰고 누가 검토하는지, 언어 모델이 언제 관여하고 그 사실을 어떻게 밝히는지, 출처는 어떻게 인용하고 정정은 어떻게 처리하는지 설명합니다.',
    },
    contact: {
      title: 'StockPulse 문의 — 정정 요청과 질문',
      description:
        '운영자에게 연락하는 방법, 발행된 순위나 글의 오류를 신고하는 방법, 데이터 삭제를 요구하는 방법, 그리고 그 수치를 만들어 낸 소스 코드를 직접 확인하는 방법입니다.',
    },
  },

  /* blog */
  blog: {
    title: '리서치 노트',
    intro:
      '순위가 어떻게 만들어지는지, 각 팩터가 실제로 무엇을 재는지, 데이터를 어디서부터 믿을 수 없는지 설명합니다. 직접 확인하실 수 있도록 썼습니다. 모든 주장은 규칙이나 출처, 아니면 그 값을 만들어 낸 코드를 가리킵니다.',
    allPosts: '전체 글',
    featured: '먼저 읽어 볼 글',
    categories: '주제',
    category: '주제',
    readingTime: '읽는 데 {n}분',
    published: '발행일',
    updated: '수정일',
    writtenBy: '작성',
    reviewedBy: '검토',
    reviewedByHelp: '발행 전에 실명의 담당자가 읽고 검토했으며, 그 내용에 대해 책임을 집니다.',
    reviewLabel: '검토',
    autoPublished: '자동 발행 · 개별 검토 없음',
    autoPublishedShort: '자동 발행',
    autoPublishedHelp:
      '파이프라인이 계산한 수치를 바탕으로 정해진 시각에 자동 생성되어 발행되었으며, 게시 전에 사람이 개별적으로 검토하지 않았습니다. 생성형 언어 모델은 이 글을 작성하지 않았습니다. 모든 수치는 아래에 링크된 데이터 파일로 재현할 수 있으며, 오류는 공개적으로 정정합니다.',
    autoPublishedPolicy: '자동 발행 방식 자세히 보기',
    aiTitle: '이 글의 제작 방식',
    aiBadge: 'AI 초안 작성 · 사람 검토',
    humanOnly: '사람이 작성하고 검토했습니다',
    noModel: '코드가 조립했습니다 · 언어 모델 미사용',
    sources: '출처',
    sourcesHelp: '위 내용의 근거입니다. 외부 링크는 새 탭에서 열립니다.',
    tags: '태그',
    tickers: '언급된 종목',
    related: '함께 읽기',
    newerPost: '최신 글',
    olderPost: '이전 글',
    backToBlog: '전체 리서치 노트',
    pageOf: '{m}페이지 중 {n}페이지',
    nextPage: '이전 글 더보기',
    prevPage: '최신 글 보기',
    noPosts: '이 주제로 발행된 글이 아직 없습니다.',
    inCategory: '{category} 관련 글',
    postCount: '글 {n}개',
    postCountOne: '글 1개',
    onlyLang: '이 글은 아직 한국어로 번역되지 않았습니다.',
    indexSeoTitle: '종목 스크리닝 리서치·해설 | StockPulse',
    indexSeoDesc:
      '미국·한국 증시 종목 순위의 근거가 되는 팩터, 통계, 데이터 출처를 쉬운 말로 설명합니다. 횡단면 z 점수, ATR 손절, 피오트로스키 F 스코어, 시점 기준 데이터, 그리고 각각이 어디서 무너지는지를 다룹니다.',
    categorySeoDesc: 'StockPulse {category} 관련 글: 순위가 어떻게 만들어지는지, 그 숫자가 무엇까지 말해 주고 무엇은 말해 주지 못하는지 정리했습니다.',
  },

  common: {
    market: { US: '미국', KR: '한국' },
    marketShort: { US: '미국', KR: '한국' },
    yes: '예',
    no: '아니오',
    none: '없음',
    back: '순위표로 돌아가기',
    readMethodology: '방법론 보기',
    seePerformance: '성과 검증 보기',
    expand: '펼치기',
    collapse: '접기',
    source: '출처',
    updated: '갱신',
  },
};

export const UI = { en, ko };
export type Strings = typeof en;

/** Simple {placeholder} interpolation. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}
