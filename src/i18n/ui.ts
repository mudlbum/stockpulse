/**
 * All user-facing copy lives here.
 *
 * `ko` is typed as `typeof en`, so adding an English string without a Korean
 * one is a type error. That plus the shared view components in src/views/pages
 * is what stops the two languages drifting apart.
 */

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
    alerts: 'Alerts',
    about: 'About',
    disclaimer: 'Disclaimer',
  },
  theme: { label: 'Theme', light: 'Light', dark: 'Dark', system: 'System', toggle: 'Switch colour theme' },
  langSwitch: 'View in Korean',
  langSwitchShort: '한국어',
  menu: 'Menu',

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
  },

  /* performance */
  perf: {
    title: 'Performance audit',
    intro:
      'Every published pick is written to an append-only ledger at publication time and closed on its published rules. Nothing is removed retroactively. A pick published in error is marked void with a reason and still shown.',
    winRate: 'Win rate',
    controlWinRate: 'Random-pick control',
    controlHelp:
      'The same number of picks drawn at random from the same universe on the same dates. A win rate only means something next to this.',
    meanReturn: 'Mean return',
    benchmarkReturn: 'Benchmark',
    benchmarkHelp: 'Same-period buy-and-hold of SPY (US) / KOSPI (KR). In a rising market a monkey posts a good win rate.',
    medianReturn: 'Median return',
    excessReturn: 'Excess vs benchmark',
    maxDrawdown: 'Max drawdown',
    avgHold: 'Avg hold',
    days: 'days',
    picks: 'Picks',
    filled: 'Filled',
    noFill: 'Never filled',
    noFillHelp:
      'Picks whose entry zone was never touched at the next session’s fill price. They earn nothing and are excluded from returns — this is how much of the theoretical performance was unreachable.',
    equityCurve: 'Equity curve',
    equityHelp:
      'Equal-weight portfolio of all filled picks, net of costs, indexed to 100. Benchmark overlaid on the same scale.',
    strategy: 'StockPulse',
    benchmark: 'Benchmark',
    byHorizon: 'By horizon',
    ledger: 'Trade ledger',
    ledgerIntro: 'Every pick, including the ones that lost and the ones that never filled.',
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
      'Nothing is removed retroactively. A pick published in error is marked void with a reason, and still shown.',
      'The methodology version that produced each pick is recorded with it, so a formula change cannot silently rewrite past results.',
      'Sample-size warnings stay up until a horizon has at least 30 closed positions.',
    ],
  },

  /* news */
  news: {
    title: 'News',
    intro:
      'Headlines matched to the ranked universe. Sentiment is a lexicon score, not a language model, and it is weakly predictive at best — it is one input among many, shown here so you can judge it yourself.',
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
      'A daily digest when a board changes, and a same-session notice when a published pick hits its stop. Both need a mail provider and an unsubscribe mechanism that actually works, neither of which is wired up.',
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
      'StockPulse computes four stock rankings a day for the US and Korean markets, using a scoring rule set that is published in full before it is applied. Every pick it has ever published is tracked to its exit and reported, including the ones that lost.',
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
    alerts: '알림',
    about: '소개',
    disclaimer: '면책 고지',
  },
  theme: { label: '테마', light: '라이트', dark: '다크', system: '시스템', toggle: '색상 테마 전환' },
  langSwitch: 'View in English',
  langSwitchShort: 'English',
  menu: '메뉴',

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
  },

  perf: {
    title: '성과 검증',
    intro:
      '발행된 모든 추천은 발행 시점에 추가 전용(append-only) 원장에 기록되고, 공개된 규칙에 따라 청산됩니다. 사후에 삭제하지 않습니다. 오류로 발행된 건은 사유와 함께 무효(void)로 표시하고 그대로 남겨둡니다.',
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
      'StockPulse는 미국과 한국 시장을 대상으로 매일 4종의 종목 순위를 계산합니다. 점수 산식은 적용 전에 전문을 공개합니다. 발행한 모든 추천은 청산 시점까지 추적해 손실 건을 포함하여 공개합니다.',
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
