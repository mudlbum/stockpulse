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
    aiTitle: 'How this article was produced',
    aiBadge: 'AI-assisted draft, human-reviewed',
    humanOnly: 'Written and reviewed by a person',
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
  langSwitchFallback: '이 페이지의 영어 버전이 없습니다 — 영어 사이트로 이동합니다',
  menu: '메뉴',
  footerLegal: '약관·정책',
  cookieSettings: '개인정보 설정',

  compliance:
    '본 사이트의 모든 콘텐츠는 시장 조사 및 교육 목적의 정보이며, 개인별 투자자문이 아닙니다. StockPulse는 등록된 투자자문업자가 아닙니다. 순위는 공개된 규칙에 따른 기계적 산출물이며 예측이 아닙니다. 투자 원금 손실이 발생할 수 있습니다. 투자 판단과 책임은 이용자 본인에게 있습니다.',
  complianceHeading: '중요 고지',
  footerDisclaimer:
    '시장 조사 및 교육 목적의 정보입니다. 투자자문이 아니며, 등록된 투자자문업자가 아니고, 예측도 아닙니다.',
  dataAsOf: '데이터 기준',
  builtOn: '규칙 버전',

  placeholderTitle: '예시 데이터 포함',
  placeholderSome: '이 페이지에서 아래 데이터는 실제 시장 데이터가 아닌 예시 데이터이며, 실제 종목을 설명하지 않습니다:',
  placeholderReal: '이 페이지에서 아래 데이터는 실제 파이프라인 산출물입니다:',
  placeholderFlagNote:
    '각 데이터 파일은 자체 placeholder 플래그를 가지고 있으며 이 고지는 그 플래그를 읽어 표시하므로, 페이지 전체가 아니라 데이터셋별로 정확합니다.',
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
      '규칙 기반 종목 스크리너 4종을 매 거래일 재계산합니다. 각 순위표는 공개된 점수 산식의 기계적 상위 10종목이며, 예측이나 매수 권유가 아닙니다.',
    market: '시장',
    horizon: '투자 기간',
    asOf: '종가 기준',
    turnover: '30일 회전율',
    turnoverHelp: '최근 30일 동안 교체된 종목 비율입니다. 단기 순위표에서는 높은 것이 정상입니다.',
    eodNote:
      '모든 데이터는 종가 기준입니다. 장 마감 후 발행된 순위표는 빨라야 다음 거래일 시가부터 실행 가능하며, 성과 검증도 그 세션의 (시가 + 종가) ÷ 2 가격으로 체결을 가정합니다.',
    sampleWarning:
      '이 기간의 청산 완료 포지션이 30건 미만입니다. 통계 수치는 참고용이며 근거로 쓰기에는 표본이 부족합니다.',
    emptyBoard: '아직 발행되지 않은 순위표입니다.',
    emptyBoardHeading: '이 순위표는 발행되지 않았습니다',
    emptyBoardWhy: '이유',
    emptyBoardCode: '사유 코드',
    emptyBoardFooter: '오류가 아니라 의도된 동작입니다. 같은 시장의 다른 순위표는 정상적으로 발행됩니다.',
    columns: {
      rank: '순위',
      stock: '종목',
      price: '주가',
      trend: '30일',
      score: '점수',
      levels: '진입 / 손절',
      targets: '목표가',
      risk: '위험도',
      catalyst: '촉매',
      detail: '팩터',
    },
    movementNew: '신규',
    movementNewLabel: '이번 순위표 신규 진입',
    movementUp: '{n}계단 상승',
    movementDown: '{n}계단 하락',
    movementFlat: '변동 없음',
    entryZone: '진입 구간',
    stop: '손절',
    noStop: '가격 손절 없음',
    noStopExplain:
      '장기 포지션은 가격 손절로 관리하지 않습니다. 5년 관점에서 15% 하락은 노이즈이지만, 투자 논리의 훼손은 다릅니다. 아래 조건 중 하나가 성립하면 포지션을 청산합니다:',
    invalidation: '논리 훼손 조건',
    targetBand: '목표 구간',
    targetConservative: '보수적',
    targetBase: '기본',
    targetBull: '낙관적',
    noTargets: '가격 목표를 제시하지 않습니다. 5~10년 목표주가는 허구에 가깝기 때문에 복리 성장 논리로 판단합니다.',
    targetBasisLabel: {
      atr: 'ATR 배수 목표가',
      fair_value_band: '2년 적정가치 구간',
      compounding_scenarios: '7년 복리 성장 시나리오',
    },
    targetBasisHelp: {
      atr: '각 구간은 종가에 해당 종목 자체의 ATR(평균 실제 범위) 배수를 더한 값입니다. 각각 1.0배, 1.8배, 3.0배입니다. 변동성에 비례하므로 같은 규칙에서도 유틸리티와 바이오 종목의 구간 폭이 다르게 나옵니다. 주가 전망이 아니라 청산 로직이 실제로 사용하는 가격 수준입니다.',
      fair_value_band:
        '성장률, 마진, 청산 배수에 대한 보수적·기본·낙관적 가정으로 산출한 1~2년 할인 적정가치 범위입니다. 명시된 가정이 만들어낸 범위이지 목표주가가 아니며, 포지션은 이 수치가 아니라 투자 논리에 따라 청산됩니다.',
      compounding_scenarios:
        '목표주가가 아닙니다. 매출 성장률, 마진, 청산 배수에 대한 명시된 가정 하에서 5~10년간 기업 가치가 어떻게 복리로 성장하는지를 보여주는 세 가지 시나리오입니다. 5~10년 목표주가는 허구에 가깝기 때문에 방법론은 대신 시나리오 구간을 제시합니다. "이 가정이 유지된다면 계산은 이렇게 된다"는 뜻이며, 그 가정이 유지될지에 대해서는 아무 말도 하지 않습니다.',
    },
    targetBasisShort: {
      atr: 'ATR 배수',
      fair_value_band: '적정가치 2년',
      compounding_scenarios: '시나리오, 예측 아님',
    },
    targetBasisWhat: '이 수치의 성격',
    maxHold: '최대 보유',
    sessions: '거래일',
    riskGauge: '위험도',
    riskGaugeHelp: '유니버스 내 ATR ÷ 주가의 5분위입니다. 1이 가장 안정적, 5가 가장 변동성이 큽니다.',
    completeness: '데이터 완전성',
    completenessBadge: '팩터 {total}개 중 {used}개',
    completenessHelp:
      '이 종목은 일부 팩터 입력값이 누락되었습니다. 누락값을 평균으로 채우지 않고, 존재하는 값만으로 점수를 계산한 뒤 여기에 표시합니다.',
    factorBreakdown: '팩터 분해',
    factorZ: 'z 점수',
    factorRaw: '원값',
    showFactors: '팩터 보기',
    hideFactors: '팩터 접기',
    factorsShort: '팩터',
    scrollHint: '표를 좌우로 스크롤할 수 있습니다. 일부 열이 화면 밖에 있습니다.',
    scrollRegion: '순위표, 좌우 스크롤 가능',
    scrollRegionTable: '표, 좌우 스크롤 가능',
    newsCount: '건 (7일)',
    sentiment: '헤드라인 감성',
    cluster: '촉매 클러스터',
    flags: '플래그',
    flagLabel: {
      partial_data: '데이터 일부 누락',
      price_limit: '가격 제한',
      stopped_out: '손절 도달',
    },
    flagHelp: {
      partial_data:
        '이 종목은 일부 팩터를 사용할 수 없어 나머지 팩터에 가중치를 재정규화했습니다. 누락값을 평균으로 채우지 않고, 존재하는 값만으로 점수를 계산한 뒤 여기에 표시합니다.',
      price_limit:
        'KRX 일일 가격제한폭(±30%)에 도달했거나 근접한 상태로 마감했습니다. 종가는 시장이 청산된 가격이 아니라 거래가 제한된 가격이므로 절단된 값입니다. 등락률, 진입 구간, 목표가 등 종가에서 파생된 모든 수치는 실제 움직임보다 축소되어 표시됩니다.',
      stopped_out:
        '공개된 손절가가 이탈되었습니다. 원장에서 손절가로 포지션을 청산해 손실로 기록하며, 해당 종목은 5거래일간 재편입할 수 없습니다.',
    },
    evidenceLabel: '감성 근거',
    evidenceHelp: '감성 점수를 만들어낸 사전 기반 키워드입니다. 실제로 무엇에 반응했는지 확인할 수 있도록 공개합니다.',
    justMissed: '탈락 종목',
    justMissedIntro:
      '점수만으로는 상위 10위 안에 들었으나 분산 규칙에 의해 제외된 종목입니다. 어떤 규칙이 적용되었는지 명시하여, 제약이 실제로 작동하는 것을 확인할 수 있게 했습니다.',
    displacedBy: {
      sector_cap: '섹터 상한 — 동일 섹터 3종목 이미 편입',
      correlation_cap: '상관관계 상한 — 상관계수 0.85 초과 종목 2개 이미 편입',
      catalyst_cluster_cap: '촉매 상한 — 동일 뉴스 클러스터 4종목 이미 편입',
    },
    newsPanel: '관련 헤드라인',
    newsFilterOn: '{ticker} 필터 적용됨',
    clearFilter: '필터 해제',
    filterHint: '표에서 종목 코드를 선택하면 헤드라인이 필터링됩니다.',
    noNewsForTicker: '현재 구간에서 이 종목과 일치하는 헤드라인이 없습니다.',
    viewAllNews: '전체 뉴스',
    refreshed: '실시간 수치 갱신됨',
    newPublish: '새 순위표가 발행되었습니다. 전체 내용을 보려면 새로고침하세요.',
    reload: '새로고침',
    openBoard: '이 순위표 열기',
    allBoards: '전체 순위표',
    boardPermalink: '이 순위표 전체 페이지',
  },

  regime: {
    heading: '시장 국면',
    breadth: '200일선 상회 비율',
    indexAbove: '지수의 200일 이동평균 상회 여부',
    yes: '예',
    no: '아니오',
    unknown: '판단 불가',
    multiplier: '점수 배수',
    state: {
      risk_on: '위험 선호',
      narrowing: '주도주 축소',
      caution: '경계',
      risk_off: '위험 회피',
      unknown: '판단 불가',
    },
    body: {
      risk_on: '지수가 200일 이동평균 위에 있고 유니버스의 절반 이상이 동참하고 있습니다. 정상적인 국면입니다.',
      narrowing:
        '지수는 200일선 위를 유지하고 있으나 구성 종목의 절반 미만만 그렇습니다. 주도주가 좁아지는 국면은 역사적으로 상승보다 조정에 선행하는 경우가 많습니다. 점수에 0.85배를 적용합니다.',
      caution:
        '지수가 200일 이동평균 아래에 있습니다. 이 순위표는 우호적이지 않은 시장에 발행되고 있습니다. 지금 필요한 대응은 다른 종목이 아니라 축소된 포지션 크기입니다. 점수에 0.70배를 적용합니다.',
      risk_off:
        '지수가 200일 이동평균 아래에 있고 시장 폭이 무너졌습니다. 이 순위표는 우호적이지 않은 시장에 발행되고 있습니다. 지금 필요한 대응은 신규 위험을 지지 않는 것입니다. 이 국면에서 스크리너 결과는 매수의 근거가 되지 않습니다. "아무것도 하지 않는 것"도 하나의 선택이며, 본 사이트에는 이를 대체할 공매도 전략이 없습니다. 점수에 0.50배를 적용합니다.',
      unknown: '오늘은 국면을 분류하기에 지수 이력이 충분하지 않습니다. 점수 배수를 적용하지 않습니다.',
    },
    sizing: '권고 포지션 크기',
    sizingValue: {
      risk_on: '평상시 수준',
      narrowing: '축소',
      caution: '대폭 축소',
      risk_off: '없음 — 신규 진입 권고하지 않음',
      unknown: '분류 불가',
    },
  },

  methodology: {
    title: '방법론',
    intro:
      '적용에 앞서 전체 규칙을 공개합니다. 이 사이트의 모든 수치는 의견이 아니라 사전에 문서화된 규칙으로 소급 추적할 수 있습니다. 파이프라인이 구현하는 문서를 그대로 게재합니다.',
    version: '버전',
    summaryHeading: '한국어 요약',
    tocHeading: '목차',
    fullHeading: '규칙 전문',
  },

  perf: {
    title: '성과 검증',
    intro:
      '발행된 모든 종목은 발행 시점에 추가 전용(append-only) 원장에 기록되고, 공개된 규칙에 따라 청산됩니다. 사후에 삭제하지 않습니다. 오류로 발행된 건은 사유와 함께 무효(void)로 표시하고 그대로 남겨둡니다.',
    winRate: '승률',
    controlWinRate: '무작위 대조군 승률',
    controlHelp:
      '동일한 날짜, 동일한 유니버스에서 같은 수만큼 무작위로 뽑은 경우의 승률입니다. 승률은 이 값과 비교할 때만 의미가 있습니다.',
    meanReturn: '평균 수익률',
    benchmarkReturn: '벤치마크',
    benchmarkHelp: '동일 기간 SPY(미국) / KOSPI(한국) 매수 후 보유. 상승장에서는 아무렇게나 골라도 승률이 좋습니다.',
    medianReturn: '중위 수익률',
    excessReturn: '벤치마크 대비 초과',
    maxDrawdown: '최대 낙폭',
    avgHold: '평균 보유',
    days: '일',
    picks: '발행 건수',
    filled: '체결',
    noFill: '미체결',
    noFillHelp:
      '다음 거래일 체결 가격이 진입 구간에 들어오지 않아 체결되지 않은 건입니다. 수익도 손실도 없으며 수익률 계산에서 제외됩니다. 이론상 성과 중 실제로 도달 불가능했던 비중을 보여줍니다.',
    equityCurve: '자산 곡선',
    equityHelp: '체결된 모든 포지션의 동일가중 포트폴리오, 비용 차감 후, 100 기준 지수화. 동일 축에 벤치마크를 겹쳐 표시합니다.',
    strategy: 'StockPulse',
    benchmark: '벤치마크',
    byHorizon: '기간별',
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
      ticker: '종목',
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
      max_hold: '최대 보유 만료',
      forced: '강제 청산',
      open: '보유 중',
    },
    status: { closed: '청산', open: '보유', no_fill: '미체결', void: '무효' },
    sampleWarnTitle: '청산 완료 30건 미만',
    sampleWarnAffected: '해당 기간:',
    sampleWarnCount: '청산 {n}건',
    sampleWarnBody:
      '청산 완료 30건 미만에서는 통계적으로 유의미하지 않으며, 한 건의 결과가 승률을 수 %p 움직입니다. 장기 순위표는 앞으로 수년간 이 경고를 달고 있을 텐데, 이는 결함이 아니라 사실 그대로입니다.',
    openPositions: '보유 중 포지션',
    voidNote: '무효',
    antiGaming: '수치 조작 방지 원칙',
    antiGamingItems: [
      '원장은 추가 전용이며 git에 저장됩니다. 모든 과거 버전을 누구나 diff로 확인할 수 있습니다.',
      '사후 삭제는 하지 않습니다. 오류로 발행된 건은 사유와 함께 무효로 표시하고 그대로 남겨둡니다.',
      '각 발행 건에 해당 방법론 버전을 함께 기록하므로, 산식 변경으로 과거 성과를 조용히 다시 쓸 수 없습니다.',
      '해당 기간의 청산 완료 포지션이 30건에 도달할 때까지 표본 부족 경고를 유지합니다.',
    ],
  },

  news: {
    title: '뉴스',
    intro:
      '순위 유니버스에 매칭된 헤드라인입니다. 감성 점수는 언어 모델이 아닌 사전 기반 점수이며 예측력은 약합니다. 여러 입력 중 하나일 뿐이며, 직접 판단할 수 있도록 그대로 공개합니다.',
    feedHeading: '전체 헤드라인',
    topStories: '주요 기사',
    topStoriesHelp: '2개 이상 매체가 보도한 기사입니다. 실제로 중요했던 사안을 걸러내는 대략적인 기준입니다.',
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
    feedHealthHelp: '마지막 파이프라인 실행에서 응답한 소스입니다. 실패한 피드는 값을 추정하지 않고 기여분을 제거합니다.',
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
      '가상의 금액을 순위표 상위 10종목에 균등 배분했을 때의 포지션 크기, 손절 시 총 노출, 그리고 가정한 결과에 따른 손익을 계산합니다. 공개된 가격 수준에 대한 산술 계산일 뿐 예측이 아닙니다.',
    amount: '배분 금액',
    market: '시장',
    horizon: '투자 기간',
    commission: '수수료 (편도, bp)',
    recalc: '다시 계산',
    inputsHeading: '시나리오 입력값',
    positions: '포지션',
    perPosition: '종목당 배분',
    shares: '수량',
    cost: '매입 금액',
    cash: '미투자 잔액',
    cashHelp: '주식은 정수 단위로만 매수하므로 잔액이 남습니다.',
    stopExposure: '손절 시 총 노출',
    stopExposureHelp:
      '가격 손절이 있는 포지션의 (진입가 − 손절가) × 수량 합계입니다. 모든 손절이 실행될 경우의 손실이며, 슬리피지와 갭은 반영하지 않았습니다. 장기 포지션은 가격 손절이 없어 이 수치에 포함되지 않지만, 하락하지 않는다는 뜻은 아닙니다.',
    noStopPositions: '이 중 {n}개 포지션은 가격 손절이 없어 해당 수치에서 제외되었습니다.',
    outcome: '결과 가정',
    outcomes: { stop: '손절', conservative: '보수적', base: '기본', bull: '낙관적', flat: '변동 없음' },
    outcomeUnavailable: '이 기간에는 제시되지 않음',
    needsJs: '시뮬레이터는 대화형 기능이라 JavaScript가 필요합니다. 사이트의 나머지 기능은 JavaScript 없이도 동작합니다.',
    applyAll: '전체 적용',
    projected: '예상 평가액',
    projectedPnl: '예상 손익',
    commissionCost: '수수료 (왕복)',
    netPnl: '순손익',
    exportJson: 'JSON으로 내보내기',
    noStorage:
      '입력한 내용은 저장되지 않습니다. 데이터베이스도, 쿠키도, 브라우저 저장소도 사용하지 않습니다. 시나리오는 이 페이지의 메모리에만 존재하며 탭을 닫으면 사라집니다. 보관하려면 내보내기 버튼을 사용하세요.',
    hypothetical:
      '가상의 계산입니다. 공개된 진입 구간의 중간값에 체결되고, 모든 포지션이 가정한 결과에 도달하며, 손절가를 갭 하락으로 뚫지 않는다고 전제합니다. 세금, 호가 스프레드, 슬리피지, 차입 비용, 환율 변동은 제외했습니다. 아래 수수료 입력값만 반영됩니다.',
    emptyBoard: '해당 순위표에는 배분할 포지션이 없습니다.',
    total: '합계',
    invested: '투자 금액',
    exportedAt: '내보낸 시각',
  },

  sectors: {
    title: '섹터 자금 흐름',
    intro:
      '시가총액이 어디에 있고 어떻게 움직였는지 보여줍니다. 타일 면적은 시가총액, 색상은 선택한 기간의 수익률입니다. 시장 상황에 대한 설명이며 매매 신호가 아닙니다.',
    window: '수익률 기간',
    w1d: '1일',
    w5d: '5일',
    w20d: '20일',
    legend: '수익률',
    tableFallback: '섹터 표',
    tableHelp: '트리맵과 동일한 데이터를, 스크린 리더나 색상 없이도 읽을 수 있는 형태로 제공합니다.',
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
    breadthHelp: '해당 섹터 구성 종목 중 상승한 종목의 비율입니다.',
  },

  alerts: {
    title: '알림',
    intro: '이메일·푸시 알림은 아직 제공하지 않습니다. 현재 제공되는 것과 계획된 것을 안내합니다.',
    todayHeading: '지금 사용할 수 있는 것',
    todayBody:
      '모든 순위표는 고정 URL의 기계 판독 가능한 JSON과 RSS 피드로 발행됩니다. 직접 폴링하고, 비교하고, 사용 중인 도구에 연결하세요. API 키도 계정도 필요 없으며, GitHub Pages의 제한 외 별도 호출 제한도 없습니다.',
    jsonLink: '순위 JSON',
    newsLink: '뉴스 JSON',
    perfLink: '성과 JSON',
    rssLink: 'RSS 피드',
    plannedHeading: '계획된 것',
    plannedBody:
      '순위표가 변경될 때 보내는 일간 요약과, 발행된 종목이 손절가에 도달했을 때 당일 알리는 기능입니다. 두 기능 모두 메일 발송 제공자와 실제로 작동하는 수신거부 절차가 필요하며, 아직 연결되어 있지 않습니다.',
    formHeading: '사전 등록',
    formNote:
      '이 양식은 어디에도 연결되어 있지 않습니다. 버튼은 의도적으로 비활성화했습니다. 제출되는 척하면서 입력값을 조용히 버리는 양식은 없느니만 못하기 때문입니다. 정식 제공 시에는 요약 발송 목적으로만 주소를 저장하고 원클릭 수신거부를 제공합니다.',
    emailLabel: '이메일 주소',
    emailPlaceholder: '아직 연결되지 않음',
    submit: '아직 제공하지 않음',
    contact: '그때까지는 위의 피드가 순위표를 구독하는 공식 방법입니다.',
  },

  about: {
    title: '소개',
    whatHeading: '무엇인가',
    whatBody:
      'StockPulse는 미국과 한국 시장을 대상으로 매일 4종의 종목 순위를 계산합니다. 점수 산식은 적용 전에 전문을 공개합니다. 순위표에 오른 모든 종목은 청산 시점까지 추적해 손실 건을 포함하여 공개합니다.',
    whatNotHeading: '무엇이 아닌가',
    whatNotBody:
      '투자자문이 아니고, 종목 추천 서비스가 아니며, 주가가 어떻게 될지 알지 못합니다. 스크리너 결과는 "오늘 이 규칙에서 가장 높은 점수를 받았다"는 뜻이며, 언뜻 보이는 것보다 훨씬 작은 주장입니다. 그리고 그것이 이 사이트가 하는 유일한 주장입니다.',
    howHeading: '작동 방식',
    howBody:
      '모든 팩터는 가중치를 적용하기 전에 당일 유니버스 내 횡단면 z 점수로 변환합니다. 단위가 다른 원지표를 그대로 더할 수 없기 때문입니다. 데이터는 시점 기준(point-in-time)이며, 특정 날짜의 점수는 그 날짜 이전에 공시된 데이터만 사용합니다. 청산 규칙은 진입 전에 확정하며, 성과 검증은 재량 없이 그 규칙대로만 포지션을 종료합니다.',
    dataHeading: '데이터와 출처',
    dataBody:
      '주가, 재무, 뉴스는 공개 소스에서 수집합니다. 특히 한국 재무 데이터의 커버리지는 고르지 않으며, 사이트는 이를 감추지 않고 명시합니다. 최근 실행의 소스별 신뢰도를 아래에 공개합니다.',
    sourceHealth: '소스 상태 (최근 실행)',
    successRate: '성공률',
    notes: '비고',
    openHeading: '구조적으로 공개',
    openBody:
      '규칙 문서, 거래 원장, 사이트 소스가 하나의 저장소에 있습니다. 여기 있는 수치가 틀렸다면, 그것을 만들어낸 코드를 읽을 수 있고 변경 이력도 확인할 수 있습니다.',
    limitsHeading: '알려진 한계',
    contactHeading: '연락처',
  },

  disclaimer: {
    title: '면책 고지',
    lead: '이 사이트의 내용을 근거로 행동하기 전에 읽어 주십시오. 아무도 읽을 수 없는 고지는 누구도 보호하지 못하므로 평이한 표현으로 작성했습니다.',
    sections: [
      {
        h: '투자자문이 아닙니다',
        p: [
          '이 사이트의 모든 내용은 불특정 다수에게 공개되는 시장 조사 및 교육 정보입니다. 개인별 투자자문이 아니며, 특정 증권의 매수·매도·보유 권유가 아닙니다.',
          '이 사이트의 어떤 내용도 이용자의 소득, 세무 상황, 기존 보유 자산, 투자 기간, 유동성 필요, 손실 감내 수준을 고려하지 않습니다. 그 모두를 무시한 순위가 특정인에 대한 자문이 될 수 없으며, 그런 목적으로 제공되지도 않습니다.',
        ],
      },
      {
        h: '투자자문업 등록을 하지 않았습니다',
        p: [
          'StockPulse는 어느 관할에서도 등록된 투자자문업자, 투자중개업자, 재무설계사가 아닙니다. 운영자는 투자자문을 제공할 자격이 없으며 제공하지도 않습니다.',
          '한국 이용자: 유사투자자문업 규정은 불특정 다수인을 대상으로 대가를 받고 투자 정보를 제공하는 영업에 적용되며, 금융감독원에 대한 보고 의무가 따릅니다. 이 사이트는 무료이고 비개인화되어 있습니다. 향후 유료화하거나 개별 응답을 제공하게 된다면 그 규정을 먼저 검토해야 합니다.',
          '미국 이용자: Investment Advisers Act에는 개별 고객에 맞춘 자문을 제공하지 않는 정기 간행물에 대한 발행인 예외(publisher’s exclusion)가 있습니다. 이 사이트는 비개인화되고 정기적으로 발행되며 모든 독자에게 동일하도록 설계되어 그 예외 범위 안에 있도록 만들어졌습니다. 이는 의도에 대한 설명이며 법률 의견이 아니고, 해당 예외는 일반적인 인식보다 좁게 해석됩니다.',
        ],
      },
      {
        h: '순위는 기계적 산출물이며 예측이 아닙니다',
        p: [
          '순위표는 사전에 공개된 점수 산식의 산출물입니다. 1위 종목은 오늘 그 산식에서 가장 높은 점수를 받은 종목입니다. 주장의 전부가 그것입니다.',
          '산식은 이 데이터에 최적화한 것이 아니라 공개된 연구 문헌에서 도출했습니다. 과적합이라는 실패 방식은 피했지만 가중치가 튜닝되지 않았다는 점은 받아들입니다. 2개 시장 × 4개 기간 × 수십 개 팩터는 넓은 탐색 공간이며, 그런 작업에서 신호처럼 보이는 것의 일부는 우연입니다.',
        ],
      },
      {
        h: '과거 성과는 미래 수익을 보장하지 않습니다',
        p: [
          '성과 페이지는 특정 체결 가정과 비용 모형 하에서 공개된 규칙이 과거 날짜에 만들어낸 기록입니다. 전망이 아니며, 복리로 환산해 약속이 되지 않습니다.',
          '표본은 작습니다. 특히 장기 기간은 의미 있는 기록이 쌓이는 데 수년이 걸립니다. 청산 완료 포지션이 30건 미만인 기간에는 해당 페이지에 그 사실을 표시합니다.',
        ],
      },
      {
        h: '보유 포지션과 이해상충',
        p: [
          '운영자는 이 순위표에 등장하는 증권을 보유하고 있을 수도, 보유하지 않을 수도 있으며 어느 쪽도 표명하지 않습니다. 이해상충이 존재할 수 있다고 가정하고 내용을 판단하십시오.',
          '특정 증권의 포함, 제외, 순위에 대해 발행사, 운용사, 증권사, 홍보 대행으로부터 어떠한 대가도 받지 않습니다. 이것이 바뀐다면 시행 후가 아니라 시행 전에 이 페이지에 공개합니다.',
        ],
      },
      {
        h: '데이터가 지연되거나, 틀리거나, 누락될 수 있습니다',
        p: [
          '데이터는 중단되고, 호출을 제한하고, 형식을 바꾸고, 때로는 오류를 발행하는 공개 소스에서 옵니다. 기업 행위, 종목 코드 변경, 상장폐지, 재작성 공시가 늦게 반영되거나 반영되지 않을 수 있습니다.',
          '소스가 실패하면 해당 팩터를 평균값으로 채우지 않고 제외하며, 해당 종목에 데이터 일부 누락 표시를 붙입니다. 정직한 처리 방식이지만, 그만큼 모든 종목의 점수가 동일한 입력으로 계산되지는 않는다는 뜻이기도 합니다.',
          '정확성, 완전성, 특정 목적 적합성에 대해 어떠한 보증도 하지 않습니다. 실행에 옮길 내용은 반드시 원 출처에서 확인하십시오.',
        ],
      },
      {
        h: '모든 데이터는 종가 기준입니다',
        p: [
          '이 시스템에는 장중 데이터도 시간외 데이터도 없습니다. 종가로 계산해 장 마감 후 발행한 순위표는 다음 거래일 개장 전에는 실행할 수 없습니다.',
          '성과 검증도 이를 반영합니다. 다음 거래일의 (시가 + 종가) ÷ 2가 공개된 진입 구간 안에 들어올 때만 체결로 처리하고, 그렇지 않으면 미체결로 기록합니다. 이 사이트에 표시된 가격은 구조적으로 과거 가격이며 실시간 시세가 아닙니다.',
        ],
      },
      {
        h: '원금 손실이 발생할 수 있습니다',
        p: [
          '주식은 0이 될 수 있습니다. 손절가는 보장이 아닙니다. 갭 하락으로 손절가를 뚫으면 그 아래에서 체결되며, 급변동 장세에서는 훨씬 아래에서 체결됩니다. 장기 포지션은 설계상 가격 손절 자체가 없습니다.',
          '잃어도 되는 범위를 넘는 자금을 투입하지 마십시오. 본인의 상황에 맞는 조언이 필요하다면, 이용자에게 책임을 지는 자격 있는 전문가에게 받으십시오.',
        ],
      },
      {
        h: '이 사이트를 운영하는 분께',
        p: [
          '구독료, 협찬, 제휴 링크, 유료 등급 등 어떤 형태로든 수익화한다면 미국과 한국 모두에서 규제 판단이 실질적으로 달라지며, 위에 설명한 발행인 예외 논리가 더 이상 적용되지 않을 수 있습니다. 첫 결제를 받은 뒤가 아니라 그 전에, 서비스하는 각 관할의 증권 전문 변호사와 상담하십시오.',
          '개별 이용자의 상황에 반응하는 기능을 추가하기 전에도 마찬가지입니다. 챗봇, 포트폴리오를 산출하는 설문, 개인화된 알림이 모두 여기에 해당합니다.',
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
      '본 사이트가 무엇을 수집하고 무엇을 수집하지 않는지, 호스팅 사업자와 광고 사업자가 무엇을 보게 되는지, 광고를 게재할 때 무엇이 달라지는지를 밝힙니다.',
    effectiveLabel: '시행일',
    adsStatusOff:
      '현재 본 사이트에는 광고가 게재되어 있지 않습니다. 광고 스크립트를 불러오지 않으며, 광고 쿠키를 설치하지 않고, 이용자의 브라우저에서 광고 도메인으로 어떠한 요청도 발생하지 않습니다. 아래 제4조부터 제6조까지는 향후 광고를 게재할 경우에 적용되는 내용이며, 고지가 처리에 앞서도록 미리 작성하여 공개합니다.',
    adsStatusOn:
      '현재 본 사이트에는 광고가 게재되어 있습니다. 아래 제4조부터 제6조까지는 이용자의 브라우저에서 전송되는 정보와 그 거부 방법을 규정합니다.',
    sections: [
      {
        h: '제1조 (본 방침의 목적과 수집 현황)',
        p: [
          'StockPulse(이하 "본 사이트")는 정적 웹사이트로서 회원가입, 로그인, 게시판, 댓글, 뉴스레터 발송 기능이 없으며 별도의 서버 애플리케이션이나 데이터베이스를 운영하지 않습니다. 이용자로부터 성명, 연락처, 생년월일 등 개인정보를 직접 수집하지 않습니다.',
          '본 사이트는 자체 쿠키를 설치하지 않으며 브라우저의 로컬 저장소·세션 저장소에 어떠한 값도 기록하지 않습니다. 포지션 시뮬레이터의 계산은 전적으로 이용자 브라우저의 메모리에서 이루어지며 탭을 닫으면 사라집니다.',
          '현재 어떠한 접속 분석 도구(애널리틱스)도 설치되어 있지 않습니다. 향후 도입하는 경우 도입 이전에 본 방침을 개정하여 공개합니다.',
          '「개인정보 보호법」은 국외에 소재한 사업자라도 국내 이용자를 대상으로 재화 또는 서비스를 제공하는 경우 적용될 수 있습니다. 본 사이트는 한국어 서비스를 제공하므로, 영문 Privacy Policy와 별도로 본 개인정보처리방침을 작성하여 게시합니다.',
        ],
      },
      {
        h: '제2조 (처리하는 개인정보의 항목)',
        p: [
          '직접 수집하는 항목: 없습니다.',
          '자동으로 생성·수집될 수 있는 항목: 웹 호스팅 사업자의 서버 로그에 IP 주소, 브라우저 종류 및 버전(User-Agent), 요청 URL, 접속 일시, 연결 경로(리퍼러)가 기록될 수 있습니다. 해당 로그는 호스팅 사업자가 자신의 책임과 정책에 따라 처리하며, 본 사이트 운영자는 이를 열람·조회·내려받기·삭제할 수 없습니다.',
          '이용자가 문의 전자우편을 보내는 경우: 이메일 주소 및 문의 내용에 포함된 정보.',
          '광고를 게재하는 경우: 제4조에 정한 행태정보.',
        ],
      },
      {
        h: '제3조 (개인정보의 처리 목적)',
        p: [
          '문의에 대한 응대, 정정 요청의 확인과 처리.',
          '광고를 게재하는 경우, 광고의 게재·노출 빈도 제어·성과 측정. 이 처리는 광고 사업자가 수행하며 본 사이트 운영자가 수행하지 않습니다.',
          '법령상 의무의 이행 및 권리 관계의 확인.',
          '위 목적 외의 용도로는 개인정보를 이용하지 않으며, 목적이 변경되는 경우 사전에 동의를 받거나 본 방침을 개정하여 공개합니다.',
        ],
      },
      {
        h: '제4조 (온라인 맞춤형 광고를 위한 행태정보의 수집·이용 및 거부)',
        p: [
          '수집·이용하는 행태정보의 항목: 이용자의 웹사이트 방문 이력, 광고 요청·노출·조회·클릭 이력, 쿠키와 웹비콘(픽셀)에 저장된 광고 식별자, IP 주소, 기기 및 브라우저 정보, 접속 일시.',
          '수집 방법: 이용자가 광고가 게재된 페이지를 열람하거나 광고를 조회·클릭할 때, 광고 사업자가 제공하는 자동 수집 장치(쿠키, 웹비콘, 픽셀 등)를 통하여 자동으로 수집되어 광고 사업자에게 전송됩니다. 본 사이트의 서버는 이를 수집하지도, 보관하지도 않습니다.',
          '이용 목적: 이용자의 관심과 성향에 기반한 맞춤형 광고의 제공, 동일 광고의 반복 노출 제한(빈도 제어), 광고 효과 측정 및 부정 클릭 방지.',
          '행태정보를 수집·처리하는 광고 사업자: Google LLC(유럽경제지역 이용자에 대하여는 Google Ireland Limited)입니다. 본 사이트는 Google 외의 광고 사업자와 계약하고 있지 않으며, 사업자가 추가되는 경우 본 조에 사업자명을 기재하여 공개한 뒤에 게재를 시작합니다.',
          '보유·이용기간: 본 사이트 운영자는 행태정보를 직접 보유하지 않습니다. 수집된 행태정보의 보유·이용기간은 광고 사업자인 Google의 광고 정책 및 쿠키 정책에 따르며, 이용자는 Google 광고 설정에서 관련 데이터를 확인하고 삭제할 수 있습니다.',
          '이용자 통제권의 행사(거부) 방법: ① 본 페이지 하단의 "개인정보 설정"을 눌러 동의를 변경하거나 철회합니다(동의 관리 도구가 표시되는 지역에 한합니다). ② Google 광고 설정에서 맞춤형 광고를 해제합니다. ③ 브라우저 설정에서 쿠키를 차단하거나 삭제합니다. 예시: Chrome은 설정 → 개인정보 보호 및 보안 → 서드파티 쿠키, Edge는 설정 → 쿠키 및 사이트 권한, Safari는 설정 → 개인 정보 보호에서 각각 설정할 수 있습니다.',
          '맞춤형 광고를 거부하더라도 광고 자체는 계속 노출될 수 있으며, 다만 이용자의 관심사에 기반하지 않은 광고가 노출됩니다. 거부로 인하여 본 사이트의 열람이나 기능 이용이 제한되지 않습니다.',
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
        h: '제5조 (개인정보의 제3자 제공과 처리위탁의 구분)',
        p: [
          '「개인정보 보호법」은 개인정보를 받는 자가 자신의 목적을 위하여 처리하는 제3자 제공(제17조)과, 본 사이트의 업무 수행을 위하여 본 사이트의 지시 범위에서 처리하도록 맡기는 처리위탁(제26조)을 구분하여 규율합니다. 두 경우는 책임의 소재와 고지하여야 할 사항이 다르므로 아래와 같이 나누어 밝힙니다.',
          '처리위탁 — 수탁자: GitHub, Inc. / 위탁업무의 내용: 정적 웹사이트 호스팅 및 콘텐츠 전송. 수탁자는 위탁 목적의 범위에서만 개인정보를 처리하며, 본 사이트는 「개인정보 보호법」 제26조에 따라 위탁 사실을 본 방침에 공개합니다. 수탁자 또는 위탁업무의 내용이 변경되는 경우 본 방침을 통하여 공개합니다.',
          '제3자 제공 — 제공받는 자: Google LLC / 제공 목적: 온라인 맞춤형 광고의 게재, 노출 빈도 제어, 광고 성과 측정 / 제공 항목: 제4조의 행태정보 / 보유·이용기간: Google의 정책에 따른 기간. Google은 본 사이트의 지시에 따라 처리하는 수탁자가 아니라, 자신의 광고 네트워크 전반에서 자신의 목적과 판단으로 정보를 처리하므로 처리위탁이 아닌 제3자 제공으로 구분하여 기재합니다.',
          '본 사이트는 개인정보를 판매하지 않으며, 위에 기재한 경우와 법령에 근거가 있는 경우를 제외하고 제3자에게 제공하지 않습니다.',
        ],
      },
      {
        h: '제6조 (개인정보의 국외 이전)',
        p: [
          '본 사이트의 호스팅 서버와 광고 사업자의 서버는 대한민국 밖에 있습니다. 따라서 이용자가 본 사이트에 접속하는 것만으로 아래와 같은 국외 이전이 발생합니다. 「개인정보 보호법」 제28조의8에 따라 이전에 관한 사항을 아래와 같이 공개합니다.',
          '(1) 이전받는 자: GitHub, Inc. / 이전되는 국가: 미국 및 GitHub이 콘텐츠 전송망을 운영하는 국가 / 이전 일시 및 방법: 이용자가 페이지를 요청하는 시점에 정보통신망을 통하여 자동으로 이전 / 이전 항목: IP 주소, 브라우저 정보, 요청 URL, 접속 일시 / 이전받는 자의 이용 목적: 웹사이트 호스팅 및 콘텐츠 전송 / 보유·이용기간: GitHub의 정책에 따른 기간.',
          '(2) 이전받는 자: Google LLC / 이전되는 국가: 미국 및 Google이 데이터센터를 운영하는 국가 / 이전 일시 및 방법: 광고가 게재된 페이지에서 광고 스크립트가 실행되는 시점에 정보통신망을 통하여 자동으로 이전 / 이전 항목: 제4조의 행태정보 / 이전받는 자의 이용 목적: 맞춤형 광고의 게재 및 성과 측정 / 보유·이용기간: Google의 정책에 따른 기간.',
          '이용자는 국외 이전을 거부할 수 있습니다. 광고와 관련된 이전은 제4조의 거부 방법으로 차단할 수 있습니다. 다만 호스팅과 관련된 이전은 웹페이지를 전송받는 행위 자체에 수반되므로, 이를 거부하려면 본 사이트 접속을 중단하는 방법 외에는 없습니다. 이 점을 감추지 않고 밝힙니다.',
        ],
        links: [
          {
            label: 'GitHub 개인정보 처리방침(영문)',
            url: 'https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement',
          },
        ],
      },
      {
        h: '제7조 (개인정보의 보유·이용기간 및 파기)',
        p: [
          '운영자가 직접 보유하는 이용자 개인정보는 없습니다.',
          '전자우편 문의로 수신한 개인정보는 문의 처리가 완료된 때부터 1년간 보관한 뒤 지체 없이 파기합니다. 이용자가 그 전에 파기를 요청하면 즉시 파기합니다.',
          '전자적 파일 형태로 보관된 정보는 복구할 수 없는 방법으로 영구 삭제합니다.',
        ],
      },
      {
        h: '제8조 (정보주체와 법정대리인의 권리·의무 및 행사 방법)',
        p: [
          '이용자는 언제든지 개인정보의 열람, 정정·삭제, 처리정지, 동의 철회를 요구할 수 있습니다. 만 14세 미만 아동의 개인정보에 대하여는 법정대리인이 이를 행사할 수 있습니다.',
          '요구는 제10조의 연락처로 전자우편을 통하여 접수하며, 접수일부터 10일 이내에 조치하고 그 결과를 통지합니다.',
          '본 사이트가 직접 보유한 개인정보가 없으므로 상당수의 요구에 대하여는 "보유하고 있는 개인정보가 없음"을 확인하여 회신하게 됩니다. 이 경우 호스팅 사업자와 광고 사업자의 접수 창구를 함께 안내합니다.',
          '대리인을 통하여 요구하는 경우에는 위임 사실을 확인할 수 있는 서류를 제출하여야 합니다.',
        ],
      },
      {
        h: '제9조 (개인정보의 안전성 확보 조치)',
        p: [
          '본 사이트는 개인정보를 수집하지 않는 구조 자체를 일차적인 보호 조치로 채택하고 있습니다. 수집되지 않은 정보는 유출될 수 없습니다.',
          '모든 페이지는 HTTPS로 전송되며, 사이트 소스와 데이터 파이프라인은 공개 저장소에서 관리되어 변경 이력을 누구나 확인할 수 있습니다.',
          '이용자로부터 수신한 전자우편은 접근 권한이 부여된 운영자 계정에서만 열람합니다.',
        ],
      },
      {
        h: '제10조 (개인정보 보호책임자)',
        p: [
          '개인정보 보호책임자 성명: [운영자 성명 — 공개 전 반드시 기재] / 직책: 운영자 / 연락처: 본 페이지 하단의 전자우편 주소.',
          '정보주체는 본 사이트를 이용하며 발생한 모든 개인정보 보호 관련 문의, 불만 처리, 피해 구제를 개인정보 보호책임자에게 요청할 수 있으며, 본 사이트는 지체 없이 답변하고 처리합니다.',
        ],
      },
      {
        h: '제11조 (권익침해에 대한 구제방법)',
        p: [
          '정보주체는 개인정보 침해로 인한 구제를 받기 위하여 아래 기관에 분쟁 해결이나 상담을 신청할 수 있습니다. 아래 기관은 본 사이트와 별개의 기관으로서, 본 사이트의 처리에 만족하지 못하거나 보다 자세한 도움이 필요한 경우 이용할 수 있습니다.',
          '개인정보분쟁조정위원회: (국번없이) 1833-6972 / www.kopico.go.kr',
          '개인정보침해신고센터: (국번없이) 118 / privacy.kisa.or.kr',
          '대검찰청 사이버수사과: (국번없이) 1301 / www.spo.go.kr',
          '경찰청 사이버수사국: (국번없이) 182 / ecrm.police.go.kr',
          '「개인정보 보호법」 제35조(개인정보의 열람), 제36조(개인정보의 정정·삭제), 제37조(개인정보의 처리정지 등)의 규정에 의한 요구에 대하여 공공기관의 장이 행한 처분 또는 부작위로 인하여 권리 또는 이익의 침해를 받은 자는 행정심판법이 정하는 바에 따라 행정심판을 청구할 수 있습니다.',
        ],
        links: [
          { label: '개인정보분쟁조정위원회', url: 'https://www.kopico.go.kr' },
          { label: '개인정보침해신고센터', url: 'https://privacy.kisa.or.kr' },
        ],
      },
      {
        h: '제12조 (본 방침의 변경)',
        p: [
          '본 방침의 시행일은 페이지 상단에 표시합니다.',
          '법령·정책 또는 보안 기술의 변경에 따라 내용의 추가·삭제·수정이 있는 경우 시행 7일 전부터 본 페이지를 통하여 공지합니다. 다만 수집 항목, 이용 목적, 제3자 제공, 국외 이전 등 이용자의 권리에 중대한 영향을 미치는 변경은 시행 30일 전부터 공지합니다.',
          '본 사이트는 개정 내용을 소급하여 적용하지 않습니다.',
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
      '본 사이트를 이용함으로써 동의하게 되는 약관입니다. 분량은 짧으며, 가장 중요한 조항은 이곳의 어떤 내용도 투자자문이 아니라는 점입니다.',
    effectiveLabel: '시행일',
    governingLawUnset:
      '아래 준거법 조항이 아직 작성되지 않았습니다. 대괄호로 표시된 부분은 자리표시자이며, 운영자가 공개 전에 실제 관할로 교체하여야 합니다.',
    sections: [
      {
        h: '제1조 (약관의 동의)',
        p: [
          '이용자가 본 사이트의 페이지를 열람하는 것으로 본 약관에 동의한 것으로 봅니다. 동의하지 않는 경우 이용을 중단하여 주십시오. 회원 가입도 계정도 없으므로 해지 절차 없이 이용을 중단하는 것으로 충분합니다.',
          '본 약관은 면책 고지 및 개인정보처리방침과 함께 적용됩니다. 면책 고지는 콘텐츠의 성격을, 본 약관은 이용자와 운영자 사이의 법률관계를, 개인정보처리방침은 정보의 처리를 각각 정합니다. 세 문서를 함께 읽어 주십시오.',
        ],
      },
      {
        h: '제2조 (순위는 기계적 스크리닝 산출물입니다)',
        p: [
          '본 사이트의 모든 순위표는 적용에 앞서 방법론 페이지에 전문을 공개한 점수 산식의 산출물입니다. 1위 종목은 해당 날짜에 정해진 유니버스 안에서 그 산식의 점수가 가장 높았던 종목입니다. 주장의 전부가 그것이며, 그보다 큰 의미를 읽어서는 안 됩니다.',
          '순위는 예측이 아니고, 전망이 아니며, 목표주가가 아니고, 매수 권유가 아니며, 해당 종목이 이용자에게 적합하다는 진술도 아닙니다. 산식은 미래를 알지 못하며, 산식을 작성한 사람도 마찬가지입니다.',
          '순서 결정에 사람의 재량은 개입하지 않습니다. 특정 종목을 순위표에 올리거나 내리는 조작은 존재하지 않습니다. 이 제약이 공개 성과 검증을 의미 있게 만듭니다. 동시에 반대 방향으로도 작동합니다. 사람이 보기에 잘못된 결과라도 산식이 놓은 자리에 그대로 남으며, 그 해결책은 산출물을 수정하는 것이 아니라 산식 자체를 공개적으로 변경하고 버전을 올리는 것입니다.',
        ],
      },
      {
        h: '제3조 (투자자문이 아니며 자문 관계가 성립하지 않습니다)',
        p: [
          '본 사이트의 콘텐츠는 불특정 다수에게 공개되는 일반적인 시장 조사 및 교육 정보입니다. 개인별 투자자문이 아니며, 이용자의 투자 목적, 재산 상황, 세무 상황, 기존 보유 자산, 투자 기간, 손실 감내 능력을 전혀 고려하지 않습니다.',
          'StockPulse는 어느 관할에서도 등록된 투자자문업자, 투자중개업자, 재무설계사가 아닙니다. 운영자는 투자자문을 제공할 자격이 없으며 제공하지도 않습니다.',
          '본 사이트의 이용으로 자문 관계, 중개 관계, 그 밖의 어떠한 고객 관계도 성립하지 않으며, 운영자와 주고받은 연락으로부터 그러한 관계가 추단되지도 않습니다.',
        ],
      },
      {
        h: '제4조 (신인의무의 부존재)',
        p: [
          '운영자는 이용자에 대하여 신인의무를 부담하지 않으며, 이용자의 투자 판단에 관한 주의의무, 적합성 확인 의무, 최선집행의무를 부담하지 않습니다. 이러한 의무는 본 사이트가 이용자와 맺지 않는 관계에서 발생하는 것이며, 본 사이트는 그러한 관계를 제안하지도 원하지도 않습니다.',
          '매수·보유·매도의 모든 결정은 전적으로 이용자 본인의 것이며, 이용자 자신의 분석 또는 이용자에게 책임을 지는 전문가의 조언에 따라 이루어져야 합니다.',
        ],
      },
      {
        h: '제5조 (보증의 부인)',
        p: [
          '본 사이트와 그 콘텐츠는 "있는 그대로(as is)" 그리고 "이용 가능한 상태로(as available)" 제공되며, 상품성, 특정 목적에의 적합성, 정확성, 완전성, 적시성, 권리 비침해, 중단 없는 운영에 관한 명시적·묵시적 보증을 일체 하지 않습니다.',
          '데이터는 중단되고, 호출을 제한하고, 형식을 바꾸며, 때로는 오류를 발행하는 공개 소스에서 옵니다. 기업 행위, 종목 코드 변경, 상장폐지, 재작성 공시가 늦게 반영되거나 반영되지 않을 수 있습니다. 본 사이트의 모든 가격은 종가 기준이며 구조적으로 과거 가격입니다. 실시간 시세는 어디에도 없습니다.',
          '특정 시점의 접속 가능성, 개별 수치의 정확성, 오류의 특정 기간 내 수정에 관하여 어떠한 진술도 하지 않습니다. 실행에 옮길 내용은 반드시 원 출처에서 확인하십시오.',
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
        h: '제7조 (금지되는 이용)',
        p: [
          '이용자는 본 사이트를 열람하고, 출처와 링크를 표시하여 짧게 인용하며, 공개된 JSON 및 RSS 엔드포인트를 폴링하여 개인적으로 이용할 수 있습니다. 해당 엔드포인트는 HTML을 크롤링할 필요가 없도록 제공되는 것입니다.',
          '다음 행위는 금지합니다. 순위표를 자신의 저작물, 자문 또는 전망인 것처럼 제시하는 행위, 표를 재게시하면서 준수 고지를 제거하는 행위, 콘텐츠에 대한 접근권을 판매하는 행위, 유료 종목 정보 서비스나 알림 서비스의 원천 데이터로 사용하는 행위, 공개된 피드로 대체 가능함에도 과도한 부하를 유발하는 크롤링 등으로 다른 이용자의 접속을 저해하는 행위, 사이트·빌드 파이프라인·저장소를 방해하거나 방해를 시도하는 행위, 본 사이트의 순위를 추천으로 제시하는 모델의 학습에 콘텐츠를 사용하는 행위.',
          '위 범위 안에서 공개 데이터 파일에 대한 자동화된 접근을 환영합니다. 다만 대량으로 수집하는 경우 User-Agent에 사용 주체를 정직하게 밝혀 주십시오.',
        ],
      },
      {
        h: '제8조 (지식재산권 및 이용 허락)',
        p: [
          '파이프라인은 오픈소스이지만 콘텐츠는 오픈소스가 아닙니다. 이는 서로 다른 것이며, 그 구분은 의도적입니다.',
          '데이터 파이프라인, 점수 산식의 구현 코드, 사이트 소스는 공개 저장소에 있습니다. 해당 코드에 적용되는 라이선스는 저장소의 라이선스 파일에 기재된 것입니다. 라이선스 파일이 없다면 어떠한 이용 허락도 부여되지 않은 것이므로, 코드를 재사용하기 전에 문의하여 주십시오. 저장소가 공개되어 있다는 사실 자체가 권리의 부여는 아닙니다.',
          '공개된 콘텐츠는 이와 별개이며 오픈소스가 아닙니다. 각 페이지의 문안, 저작물로서의 방법론 문서, 순위 산출 결과, 거래 원장, 사이트 디자인의 권리는 운영자에게 있습니다. 출처와 링크를 표시한 짧은 인용은 허용하나, 순위표 전체의 재게시, 사이트의 미러링, 산출물을 이용한 경쟁 서비스 구축은 허용하지 않습니다.',
          '"StockPulse"와 본 사이트의 표장은 이용자에게 사용이 허락되지 않습니다.',
          '시장 데이터와 뉴스 헤드라인의 권리는 각 출처에 있으며, 본 사이트에서는 조사·논평 목적으로 이용합니다. 출처가 별도의 이용 조건을 정한 경우 그 조건은 데이터와 함께 이용자에게도 적용됩니다.',
        ],
      },
      {
        h: '제9조 (외부 링크와 광고)',
        p: [
          '다른 사이트로의 링크는 참고를 위하여 제공됩니다. 운영자는 해당 사이트를 통제하지 않고, 보증하지 않으며, 그 내용이나 개인정보 처리에 대하여 책임지지 않습니다.',
          '광고가 게재되는 경우 개별 광고는 광고 사업자가 선택하며 운영자가 선택하지 않습니다. 순위표 옆에 표시된 광고는 광고주에 대한 보증이 아니고, 광고주는 어떠한 순위에도 영향을 미치지 않습니다. 특정 종목의 편입, 제외, 순위에 대하여 발행사·운용사·증권사·홍보 대행으로부터 어떠한 대가도 받지 않습니다.',
        ],
      },
      {
        h: '제10조 (변경 및 제공의 중단)',
        p: [
          '사이트, 발행되는 순위표, 본 약관은 변경될 수 있습니다. 본 약관의 중요한 변경은 새로운 시행일과 함께 본 페이지에 게시하며, 시행일 이후의 계속 이용은 변경에 대한 동의로 봅니다.',
          '본 사이트는 사전 통지 없이 전부 또는 일부의 제공이 중단될 수 있습니다. 무상으로 제공되는 간행물이며 서비스 수준에 관한 약정을 포함하지 않습니다.',
        ],
      },
      {
        h: '제11조 (준거법과 관할)',
        p: [
          '본 약관은 {jurisdiction}의 법률을 준거법으로 하며, 국제사법의 저촉규정은 적용하지 않습니다. 본 약관 또는 본 사이트의 이용에서 발생하는 분쟁에 대하여는 {jurisdiction}의 법원을 관할 법원으로 합니다.',
          '이용자가 소비자인 경우, 본 조는 이용자가 거주하는 국가의 강행적 소비자 보호 규정에 따른 보호를 박탈하지 않으며, 거주지 법원에 소를 제기할 수 있는 법률상 권리를 제한하지 않습니다.',
        ],
      },
      {
        h: '제12조 (분리 가능성, 권리 불포기, 완전 합의)',
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
    lead: '수치가 어떻게 산출되는지, 문안이 어떻게 작성되는지, AI를 어디에 사용하는지, 오류가 확인되면 무엇을 하는지를 정합니다.',
    effectiveLabel: '시행일',
    sections: [
      {
        h: '순위의 산출 방식',
        p: [
          '모든 순위표는 적용 전에 전문을 공개한 산식에 따라 프로그램이 계산합니다. 입력은 공개 소스에서 수집한 주가, 재무, 헤드라인 집계이며 출력은 순서입니다. 그 사이에 편집 단계는 존재하지 않습니다.',
          '사람이 특정 종목을 선정하거나, 올리거나, 내리거나, 제거하지 않습니다. 수동 개입 장치가 없으며 설계상 그것을 둘 자리도 없습니다. 이용자가 보는 순위표는 해당 날짜에 공개된 산식이 반환한 결과이며, 동일한 입력과 공개된 코드가 있으면 누구나 재현할 수 있습니다.',
          '이 원칙의 결과는 불편하더라도 분명히 밝혀 둘 필요가 있습니다. 사람이 보기에 잘못된 결과라도 산식이 놓은 자리에 그대로 남습니다. 해결책은 산출물을 손보는 것이 아니라, 근거를 문서로 남기고 버전을 올리면서 산식 자체를 공개적으로 변경하는 것입니다.',
          '분산 규칙(섹터 상한, 상관관계 상한, 촉매 클러스터 상한)은 점수가 충분히 높았던 종목을 제외할 수 있습니다. 그 경우 제외된 종목과 제외한 규칙을 함께 공개하여, 제약이 실제로 작동했음을 주장이 아니라 자료로 보이게 합니다.',
        ],
      },
      {
        h: '문안의 작성 방식',
        p: [
          '방법론 문서, 각 표 옆의 설명 문안, 본 정책을 포함한 사이트의 모든 문안은 운영자가 작성하고, 그것을 구현한 코드와 대조하여 양자가 일치할 때까지 수정합니다. 파이프라인의 동작을 설명하는 문안은 의도가 아니라 구현을 보고 작성합니다.',
          '수치에 관한 주장은 그 수치가 규칙으로 소급 추적되지 않으면 게재하지 않습니다. 알지 못하는 것은 알지 못한다고 적습니다. 소개 페이지의 "알려진 한계" 목록은 그 때문에 존재하며, 형식적으로 두는 항목이 아니라 계속 갱신하는 항목입니다.',
          '본 사이트에는 협찬 콘텐츠, 대가를 받고 작성한 콘텐츠, 제공받은 콘텐츠가 없으며, 운영자 외의 주체가 게재한 페이지도 없습니다.',
        ],
      },
      {
        h: 'AI 사용의 고지',
        p: [
          '본 사이트의 제작에 AI 도구를 사용합니다. 문안의 초안 작성과 교정, 코드의 작성과 검토, 영어와 한국어 사이의 번역 보조가 그 범위입니다. 이를 숨기지 않고 이 문서에 밝히며, 개별 글이 실질적으로 AI로 초안 작성된 경우에는 해당 페이지에 함께 표시합니다.',
          '무엇을 어떤 순서로 순위에 올릴지는 AI가 결정하지 않습니다. 순위는 공개된 입력에 대한 산술 계산이며 어떠한 모델의 출력도 점수에 들어가지 않습니다. 순위표를 만드는 파이프라인 어디에도 언어 모델은 사용되지 않습니다. 헤드라인 감성 점수 역시 공개된 사전 기반 점수이며, 모델로 오인되지 않도록 그렇게 명시하고 있습니다.',
          '모델이 그렇게 말했다는 이유로 게재되는 페이지는 없습니다. 게재되는 모든 페이지는 사람이 검토하며, 사실 주장은 코드 또는 출처와 대조하여 확인합니다. 확인할 수 없는 문장은 표현을 완화하는 대신 삭제했습니다.',
        ],
      },
      {
        h: '정정',
        p: [
          '거래 원장은 추가 전용입니다. 버전 관리 시스템에 보관되어 모든 과거 버전을 누구나 diff로 확인할 수 있으며, 행을 삭제하지 않습니다.',
          '오류로 발행된 건은 사유를 명시하여 무효로 표시하고 성과 페이지에 그대로 남깁니다. 삭제하지 않으며, 통계에서 어떻게 처리했는지도 함께 밝힙니다. 불리한 행을 조용히 지우는 것이야말로 공개 검증이 불가능하게 만들고자 하는 바로 그 관행입니다.',
          '문안의 사실 오류는 해당 위치에서 수정합니다. 오류가 공개된 주장의 의미를 바꾼 경우에는 조용히 덮어쓰지 않고 정정 일자를 함께 표시합니다.',
          '표본 부족 경고는 해당 기간의 청산 완료 포지션이 30건에 도달할 때까지 유지합니다. 장기 순위표에서는 수년이 걸리며, 그 수년 동안 경고를 그대로 둡니다.',
        ],
      },
      {
        h: '버전 관리와 변경 통제',
        p: [
          '방법론에는 버전 번호가 부여되며, 발행 시점에 모든 순위 파일에 그 버전이 기록됩니다. 가중치나 규칙을 변경하면 버전을 올리고 변경 사유를 문서로 남겨 커밋합니다.',
          '과거 발행 건은 생성 당시의 버전을 그대로 유지하므로, 산식 변경으로 과거 성과를 조용히 다시 쓸 수 없습니다. 버전 변경을 가로지르는 성과 구간은 그 사실을 표시합니다.',
          '이 장치가 기록을 반증 가능하게 만듭니다. 이것이 없으면 어떤 전략이든 규칙을 바꾸어 과거를 다시 계산하는 방식으로 사후에 좋아 보이게 만들 수 있습니다.',
        ],
      },
      {
        h: '독립성',
        p: [
          '특정 종목의 편입, 제외, 순위에 대하여 발행사·운용사·증권사·홍보 대행으로부터 어떠한 대가도 받지 않으며, 그러한 대가를 받을 수 있는 계약 관계도 존재하지 않습니다. 광고가 게재되는 경우 개별 광고는 광고 사업자가 선택하며 어떤 순위와도 연결되지 않습니다.',
          '운영자는 순위표에 등장하는 증권을 보유하고 있을 수도, 보유하지 않을 수도 있으며 어느 쪽도 표명하지 않습니다. 이해상충이 존재할 수 있다고 가정하고 내용을 판단하십시오.',
        ],
      },
      {
        h: '오류 신고 방법',
        p: [
          '문의 주소로 페이지, 순위표에 표시된 날짜, 종목 코드, 올바르다고 보는 값을 적어 보내 주십시오. 화면 캡처가 있으면 도움이 됩니다. 기술적 문제는 저장소에 공개 이슈로 등록할 수도 있으며, 같은 문제를 겪는 다른 이용자에게도 내용이 보이므로 대체로 더 빠릅니다.',
          '공개된 수치의 실제 오류를 지적한 신고는 다른 모든 업무에 우선하여 처리하며, 정정은 위 원칙에 따라 수정·기록하고 그대로 남기는 방식으로 이루어집니다.',
        ],
      },
    ] as LegalSection[],
  },

  /* ── 문의 ────────────────────────────────────────────────────────────────── */
  contact: {
    title: '문의',
    lead: '사람이 확인하는 주소 하나로 운영합니다. 정정 요청, 개인정보 관련 요구, 법적 통지, 수치 산출에 관한 질문을 받습니다.',
    emailHeading: '전자우편',
    emailNote:
      '정정 요청, 데이터 오류 신고, 개인정보 열람·삭제 요구, 법적 통지, 라이선스 문의, 광고 관련 행정 업무를 모두 이 주소에서 처리합니다. 제출되는 척하면서 입력값을 버리는 양식이 아니라 실제로 수신되는 사서함입니다.',
    responseHeading: '응답 기준',
    responseNote:
      '영업일 기준 {days}일 이내에 1차 회신합니다. 공개된 수치에 영향을 주는 정정 요청은 다른 모든 문의에 우선하여 처리하며, 편집·정정 정책에 따라 오류를 수정하고 정정 사실을 기록하며 원 기록을 임의로 삭제하지 않습니다.',
    repoHeading: '소스 저장소',
    repoNote:
      '이 사이트를 만들어 내는 모든 것 — 점수 산식 코드, 방법론 문서, 사이트 자체와 전체 변경 이력 — 이 공개되어 있습니다. 어떤 수치를 만든 코드를 직접 읽고, 공개된 자리에서 이슈를 등록하고, 주장을 믿는 대신 변경 이력을 확인할 수 있습니다. 기술적 문제는 이 경로가 대체로 더 빠릅니다.',
    correctionsHeading: '데이터 오류 신고',
    correctionsNote:
      '페이지, 순위표에 표시된 날짜, 종목 코드, 올바르다고 보는 값을 함께 적어 주십시오. 화면 캡처가 있으면 도움이 됩니다. 공개 시장 데이터의 오류는 드물지 않으며, 본 사이트는 이를 방어하기보다 전달받기를 원합니다.',
    noAdviceHeading: '이 창구에서 할 수 없는 것',
    noAdviceNote:
      '투자자문을 받거나, 보유 종목에 대한 의견을 구하거나, 매수 여부에 대한 판단을 요청하는 용도로는 이용할 수 없습니다. 그러한 문의에는 면책 고지를 안내하는 회신을 드립니다. 개별적으로 답변하는 순간 일반 간행물이 개인별 자문이 되며, 그것이 본 사이트가 넘지 않는 선입니다.',
    privacyHeading: '보내신 내용의 처리',
    privacyNote:
      '보내신 메일은 수신된 사서함에만 보관됩니다. 티켓 시스템도, 고객관리 시스템도, 발송용 주소록도 없습니다. 문의가 진행되는 동안과 종료 후 최대 12개월까지 보관한 뒤 삭제하며, 요청하시면 그 전에 삭제합니다.',
  },

  seo: {
    home: {
      title: '미국·한국 증시 일간 종목 순위 | StockPulse',
      description:
        '미국·한국 증시를 대상으로 4개 투자 기간별 규칙 기반 스크리너를 매 거래일 재계산합니다. 규칙 전문 공개, 진입·손절 가격 제시, 과거 발행 종목의 성과를 모두 검증합니다.',
    },
    methodology: {
      title: '종목 순위 산정 방법론 전문 | StockPulse',
      description:
        '적용 전에 공개하는 전체 점수 산정 규칙입니다. 횡단면 z 점수, 시점 기준 데이터, 분산 제약, 그리고 성과 검증에 쓰이는 정확한 청산 규칙을 다룹니다.',
    },
    performance: {
      title: '발행 종목 전수 성과 검증 기록 | StockPulse',
      description:
        '무작위 대조군 대비 승률, 벤치마크 대비 평균 수익률, 미체결 건수, 전체 거래 원장을 공개합니다. 사후 삭제 없이 손실 건도 그대로 포함합니다.',
    },
    news: {
      title: '순위 종목 연계 시장 뉴스 | StockPulse',
      description:
        '미국·한국 순위표 종목에 매칭된 헤드라인입니다. 사전 기반 감성 점수, 복수 매체 보도 클러스터, 소스별 피드 상태를 함께 제공합니다.',
    },
    sectors: {
      title: '미국·한국 섹터 자금 흐름 지도 | StockPulse',
      description:
        '시가총액이 어디에 있고 1일·5일·20일 동안 어떻게 움직였는지 트리맵으로 보여줍니다. 섹터별 상승 비율과 상승·하락 종목 수를 함께 제공합니다.',
    },
    simulator: {
      title: '포지션 크기·손절 노출 계산기 | StockPulse',
      description:
        '가상의 금액을 순위표에 배분해 수량, 손절 시 총 노출, 결과 시나리오별 손익을 계산합니다. 브라우저에서만 실행되며 아무것도 저장하지 않습니다.',
    },
    alerts: {
      title: '기계 판독 가능 순위 피드: JSON·RSS | StockPulse',
      description:
        '모든 순위표를 고정 URL의 JSON과 RSS로 발행합니다. API 키도 계정도 필요 없습니다. 이메일 알림은 아직 제공하지 않으며 이 페이지에 그대로 밝혀 둡니다.',
    },
    about: {
      title: 'StockPulse 소개 — 순위 산정 방식과 운영자',
      description:
        '이 사이트가 무엇이고 의도적으로 무엇이 아닌지, 점수가 어떻게 계산되는지, 데이터가 어디서 오는지, 그리고 최근 실행의 소스별 신뢰도를 공개합니다.',
    },
    disclaimer: {
      title: '면책 고지: 투자자문이 아닙니다 | StockPulse',
      description:
        '투자자문이 아니고, 투자자문업 등록도 하지 않았으며, 과거 성과는 아무것도 보장하지 않습니다. 데이터는 틀릴 수 있고 모두 종가 기준이며 원금 손실이 가능합니다.',
    },
    privacy: {
      title: '개인정보처리방침: 수집 항목 안내 | StockPulse',
      description:
        '이 사이트가 무엇을 수집하고 무엇을 수집하지 않는지, 어떤 제3자가 관여하는지, 열람·삭제를 어떻게 요청하는지 설명합니다. 건너뛰라고 쓴 문서가 아닙니다.',
    },
    terms: {
      title: '이용약관 — 종목 리서치 사이트 | StockPulse',
      description:
        '순위, 공개 데이터 피드, 게시글 이용에 적용되는 약관입니다. 책임의 한계와 자문 관계가 성립하지 않는다는 점을 포함합니다.',
    },
    editorial: {
      title: '편집 정책: 콘텐츠 제작 방식 | StockPulse',
      description:
        '누가 작성하고 검토하는지, 언어 모델이 언제 관여하며 그것을 어떻게 공개하는지, 출처를 어떻게 인용하고 정정을 어떻게 처리하는지 설명합니다.',
    },
    contact: {
      title: 'StockPulse 문의 — 정정 요청과 질문',
      description:
        '운영자에게 연락하는 방법, 발행된 순위나 글의 오류를 신고하는 방법, 데이터 삭제를 요청하는 방법, 그리고 수치를 만들어낸 소스 코드를 확인하는 방법입니다.',
    },
  },

  /* blog */
  blog: {
    title: '리서치 노트',
    intro:
      '순위가 어떻게 만들어지는지, 각 팩터가 실제로 무엇을 측정하는지, 그리고 데이터를 어디서부터 믿을 수 없는지 설명합니다. 확인 가능하도록 썼습니다. 모든 주장은 규칙, 출처, 또는 그것을 만들어낸 코드를 가리킵니다.',
    allPosts: '전체 글',
    featured: '먼저 읽어보기',
    categories: '주제',
    category: '주제',
    readingTime: '읽는 데 {n}분',
    published: '발행일',
    updated: '수정일',
    writtenBy: '작성',
    reviewedBy: '검토',
    reviewedByHelp: '발행 전 실명의 담당자가 읽고 검토했으며, 그 내용에 대해 책임을 집니다.',
    aiTitle: '이 글의 제작 방식',
    aiBadge: 'AI 초안 작성 · 사람 검토',
    humanOnly: '사람이 작성하고 검토했습니다',
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
    postCount: '{n}개 글',
    postCountOne: '1개 글',
    onlyLang: '이 글은 아직 번역되지 않았습니다.',
    indexSeoTitle: '종목 스크리닝 리서치·해설 | StockPulse',
    indexSeoDesc:
      '미국·한국 증시 종목 순위의 근거가 되는 팩터, 통계, 데이터 출처를 평이하게 설명합니다. 횡단면 z 점수, ATR 손절, 피오트로스키 F 스코어, 시점 기준 데이터, 그리고 각각이 어디서 무너지는지 다룹니다.',
    categorySeoDesc: 'StockPulse {category} 관련 글: 순위가 어떻게 만들어지는지, 그 수치가 무엇을 말해주고 무엇을 말해주지 못하는지.',
  },

  common: {
    market: { US: '미국', KR: '한국' },
    marketShort: { US: '미국', KR: '한국' },
    yes: '예',
    no: '아니오',
    none: '없음',
    back: '순위표로 돌아가기',
    readMethodology: '방법론 읽기',
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
