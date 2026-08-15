/**
 * Copy for the per-horizon landing pages (/rankings/<market>-<horizon>/).
 *
 * These pages exist because the site had eighteen URLs and none of them
 * targeted a query anyone types. They are not doorway pages: each one carries
 * the board it is about plus original framing that appears nowhere else on the
 * site — what the horizon screens for, how to read its levels, and what it
 * cannot tell you. The last of those matters most; a landing page for a stock
 * screen that only sells the screen is the thing the publisher policies call
 * get-rich-quick framing.
 */

import type { HorizonId, Locale, MarketId } from '../config';

export const HORIZON_SLUG: Record<HorizonId, string> = {
  ultra_short: 'ultra-short',
  mid_term: 'mid-term',
  long_term: 'long-term',
  ultra_long: 'ultra-long',
};

export const MARKET_SLUG: Record<MarketId, string> = { US: 'us', KR: 'korea' };

export function boardSlug(market: MarketId, horizon: HorizonId): string {
  return `rankings/${MARKET_SLUG[market]}-${HORIZON_SLUG[horizon]}`;
}

export function parseBoardSlug(slug: string): { market: MarketId; horizon: HorizonId } | null {
  for (const [m, ms] of Object.entries(MARKET_SLUG) as [MarketId, string][]) {
    for (const [h, hs] of Object.entries(HORIZON_SLUG) as [HorizonId, string][]) {
      if (slug === `${ms}-${hs}`) return { market: m, horizon: h };
    }
  }
  return null;
}

interface Copy {
  /** ≤60 display units including the brand suffix added by the layout. */
  title: string;
  description: string;
  h1: string;
  screensFor: string[];
  reading: string[];
  cannot: string[];
}

type HorizonCopy = Record<Locale, Copy>;

const MARKET_NAME: Record<MarketId, Record<Locale, string>> = {
  US: { en: 'US', ko: '미국' },
  KR: { en: 'Korea', ko: '한국' },
};

/** Market-specific paragraph, appended to every horizon page for that market. */
export const MARKET_NOTE: Record<MarketId, Record<Locale, string>> = {
  US: {
    en:
      'The US universe is filtered before any scoring: a minimum dollar volume and price floor remove the illiquid microcaps that otherwise dominate every ratio-based screen, because a small denominator mechanically produces a large number. Fundamentals come from the SEC XBRL company-facts API and are keyed on the filing date rather than the fiscal period end, so a company whose quarter ended in June but filed in August contributes nothing to a July score. That single choice is the difference between a backtest and a fantasy.',
    ko:
      '미국 유니버스는 점수 계산 전에 먼저 걸러집니다. 최소 거래대금과 주가 하한을 적용해, 비율 기반 스크리너의 상위를 항상 차지하는 비유동성 초소형주를 제거합니다. 분모가 작으면 비율은 기계적으로 커지기 때문입니다. 재무 데이터는 SEC XBRL company-facts API에서 가져오며 회계기간 종료일이 아니라 공시 제출일을 기준으로 합니다. 6월에 분기가 끝났지만 8월에 제출한 기업은 7월 점수에 아무런 기여를 하지 않습니다. 이 한 가지 선택이 백테스트와 환상을 가릅니다.',
  },
  KR: {
    en:
      'The Korean universe carries two constraints the US one does not. KRX applies a ±30% daily price limit, so a stock that closes at the limit has a censored price: it is where trading stopped, not where the market cleared, and every level derived from it understates the move. Rows in that state are flagged. Korean fundamentals are also shallower — the keyless sources give a cross-sectional snapshot and a few years of history rather than a decade of audited statements — which is why the long-horizon Korean boards carry a lower-confidence badge and the ultra-long Korean board is not published at all.',
    ko:
      '한국 유니버스에는 미국에 없는 제약이 두 가지 있습니다. KRX는 일일 ±30% 가격제한폭을 적용하므로, 상한가나 하한가로 마감한 종목의 종가는 절단된 값입니다. 시장이 청산된 가격이 아니라 거래가 멈춘 가격이며, 그로부터 계산된 모든 수준은 실제 움직임을 축소해서 보여줍니다. 해당 종목에는 플래그를 표시합니다. 한국 재무 데이터는 깊이도 얕습니다. 키 없이 접근 가능한 소스는 10년치 감사 재무제표가 아니라 단면 스냅샷과 몇 년치 이력만 제공합니다. 한국 장기 순위표에 낮은 신뢰도 배지가 붙고, 한국 초장기 순위표를 아예 발행하지 않는 이유입니다.',
  },
};

export const HORIZON_COPY: Record<HorizonId, HorizonCopy> = {
  ultra_short: {
    en: {
      title: '{market} 1–5 Day Stock Rankings (Ultra Short)',
      description:
        'The ten {market} stocks ranking highest today on a published 1–5 day momentum rule set — relative volume, gap quality, volatility expansion — with entry zone, ATR stop and target band for each.',
      h1: '{market} ultra-short stock rankings — 1 to 5 days',
      screensFor: [
        'Momentum ignition: relative volume measured against a 60-day median rather than a mean, so one earnings-day spike three weeks ago does not permanently reset the baseline.',
        'Volatility expansion — the ratio of short-window to long-window true range, which identifies stocks whose ordinary daily movement is widening rather than stocks that are simply volatile.',
        'Gap quality, which separates a gap that held and extended from one that filled by lunchtime. The direction of the close relative to the gap is the whole signal.',
        'Trend position, so the list is not a collection of falling knives that happen to be busy.',
      ],
      reading: [
        'The entry zone is a band, not a price: close minus a quarter ATR to close plus four-tenths of an ATR. If the next session never trades inside it, the audit records the row as never filled and it earns nothing — that is a real outcome and it is counted.',
        'The stop is the tighter of 1.5 ATR below the close and just under the session low. It scales with the stock, which is why a utility and a biotech on the same list have very different distances to their stops.',
        'The three targets are ATR multiples (1.0×, 1.8×, 3.0×), and the audit closes on the base target, the stop, or the fifth session — whichever comes first. A session whose range contains both stop and target is always resolved as the stop.',
      ],
      cannot: [
        'It cannot tell you the stock will go up. Rank 1 means it scored highest on this formula against this universe today, which is a much smaller statement than it appears.',
        'It cannot be acted on intraday. Everything here is end-of-day; the earliest actionable moment is the next session open, and the audit fills at that session\'s (open + close) ÷ 2 to reflect that honestly.',
        'It has no view on news that breaks after the close. A row can be invalidated overnight by an event no part of this system has seen.',
        'Turnover on this board runs near 85% a month by design. If you want stability, this is the wrong horizon, and the 30-day turnover figure above the table is there so you can check that claim rather than take it.',
      ],
    },
    ko: {
      title: '{market} 초단기 종목 순위 (1~5일)',
      description:
        '공개된 1~5일 모멘텀 규칙에서 오늘 가장 높은 점수를 받은 {market} 10종목입니다. 상대거래량, 갭 품질, 변동성 확대를 기준으로 하며 종목별 진입 구간, ATR 손절가, 3단계 목표 구간을 함께 제시합니다. 예측이 아닌 기계적 산출물입니다.',
      h1: '{market} 초단기 종목 순위 — 1~5일',
      screensFor: [
        '모멘텀 점화: 상대거래량을 평균이 아니라 60일 중앙값 대비로 측정합니다. 3주 전 실적 발표일의 거래량 급증 한 번이 기준선을 영구히 올려버리지 않도록 하기 위함입니다.',
        '변동성 확대 — 단기 실제 범위와 장기 실제 범위의 비율입니다. 단순히 변동성이 큰 종목이 아니라, 일상적인 일간 움직임이 넓어지고 있는 종목을 찾아냅니다.',
        '갭 품질. 갭을 유지하고 확장한 경우와 점심 무렵 갭을 메운 경우를 구분합니다. 갭 대비 종가의 방향이 신호의 전부입니다.',
        '추세 위치. 목록이 그저 거래가 활발한 하락 종목 모음이 되지 않도록 합니다.',
      ],
      reading: [
        '진입 구간은 하나의 가격이 아니라 구간입니다. 종가 −0.25 ATR부터 종가 +0.40 ATR까지입니다. 다음 거래일에 이 구간 안에서 거래되지 않으면 성과 검증은 미체결로 기록하고 수익도 손실도 없습니다. 이것도 실제 결과이며 그대로 집계합니다.',
        '손절가는 종가 −1.5 ATR과 당일 저가 바로 아래 중 더 가까운 쪽입니다. 종목 자체의 변동성에 비례하므로, 같은 목록에 있는 유틸리티와 바이오 종목의 손절 폭은 크게 다릅니다.',
        '목표가 3단계는 ATR 배수(1.0배, 1.8배, 3.0배)입니다. 성과 검증은 기본 목표 도달, 손절, 또는 5거래일 경과 중 먼저 오는 것으로 청산합니다. 하루 안에 손절가와 목표가가 모두 포함된 경우에는 항상 손절로 처리합니다.',
      ],
      cannot: [
        '주가가 오른다고 말해주지 않습니다. 1위는 오늘 이 유니버스에서 이 산식으로 가장 높은 점수를 받았다는 뜻이며, 보이는 것보다 훨씬 작은 주장입니다.',
        '장중에 실행할 수 없습니다. 모든 데이터는 종가 기준이며 빨라야 다음 거래일 시가부터 실행 가능합니다. 성과 검증도 그 세션의 (시가 + 종가) ÷ 2로 체결을 가정해 이를 정직하게 반영합니다.',
        '장 마감 후 발생한 뉴스는 반영하지 않습니다. 이 시스템이 보지 못한 이벤트로 하룻밤 사이에 무효가 될 수 있습니다.',
        '이 순위표의 월간 회전율은 설계상 85% 안팎입니다. 안정성을 원한다면 잘못된 기간입니다. 표 위의 30일 회전율 수치는 그 주장을 그대로 믿지 말고 직접 확인하라고 표시해 둔 것입니다.',
      ],
    },
  },

  mid_term: {
    en: {
      title: '{market} 1–2 Month Stock Rankings (Mid Term)',
      description:
        'The ten {market} stocks ranking highest on a 1–2 month rule set combining trend alignment, realized earnings drift, money flow and sector strength — each with entry zone, stop and target band.',
      h1: '{market} mid-term stock rankings — 1 to 2 months',
      screensFor: [
        'Trend alignment across multiple moving averages, which is a filter on whether the market already agrees, not a prediction that it will continue.',
        'Realized post-earnings drift. There are no analyst estimates in this system, so revision momentum is unavailable and the board substitutes the measured drift after an actual surprise — a real downgrade from the ideal specification, stated rather than hidden.',
        'Money flow, read from on-balance volume while price consolidates, which is the closest observable proxy for accumulation without order-book data.',
        'Sector strength at a 6–12 month lookback rather than 20 days, because a 20-day sector lookback sits inside the documented short-term reversal window and would systematically buy what is about to mean-revert.',
      ],
      reading: [
        'Entry zone, stop and targets are ATR-scaled exactly as on the ultra-short board, but the holding window is up to 45 sessions and the exit-rank threshold is 16 rather than 12 — an incumbent has to fall further before it is displaced.',
        'A challenger must beat an incumbent by more than 0.15 standard deviations of the score distribution to take its place. Ties go to the incumbent, which kills the shuffle-churn that makes a list look busy without being informative.',
        'Expected turnover is roughly 35% a month. The figure above the table is the realized number, so you can check whether "stable" is actually being delivered.',
      ],
      cannot: [
        'It cannot see an analyst revision cycle, a guidance change made on a call but not filed, or anything else that has not reached a public document.',
        'It cannot distinguish a genuine earnings surprise from an accounting one. The drift factor reads the reported number.',
        'It does not model position sizing or correlation with anything you already own. Two names on this list can be the same bet.',
        'Sample sizes on this horizon accumulate slowly. Check the closed-position count on the performance page before treating any statistic from it as evidence.',
      ],
    },
    ko: {
      title: '{market} 중기 종목 순위 (1~2개월)',
      description:
        '추세 정렬, 실현 실적 드리프트, 자금 흐름, 섹터 강도를 결합한 1~2개월 규칙에서 가장 높은 점수를 받은 {market} 10종목. 진입 구간·손절·목표 구간을 함께 제공합니다.',
      h1: '{market} 중기 종목 순위 — 1~2개월',
      screensFor: [
        '여러 이동평균선에 걸친 추세 정렬. 시장이 이미 동의하고 있는지를 보는 필터이지, 그것이 계속되리라는 예측이 아닙니다.',
        '실현된 실적 발표 후 드리프트. 이 시스템에는 애널리스트 추정치가 없어 추정치 수정 모멘텀을 쓸 수 없으므로, 실제 서프라이즈 이후 측정된 드리프트로 대체합니다. 이상적인 사양 대비 실질적인 하향이며, 감추지 않고 명시합니다.',
        '자금 흐름. 주가가 횡보하는 동안의 OBV로 읽습니다. 호가 데이터 없이 기관 매집에 가장 근접한 관측 가능한 대리 지표입니다.',
        '섹터 강도는 20일이 아니라 6~12개월 기준입니다. 20일 섹터 룩백은 문헌으로 확인된 단기 반전 구간 안에 들어가므로, 곧 평균 회귀할 대상을 체계적으로 사게 됩니다.',
      ],
      reading: [
        '진입 구간, 손절, 목표가는 초단기 순위표와 동일하게 ATR에 비례합니다. 다만 보유 기간은 최대 45거래일이고 이탈 순위 기준은 12위가 아니라 16위입니다. 기존 종목이 더 많이 밀려야 교체됩니다.',
        '도전 종목이 기존 종목을 밀어내려면 점수 분포 표준편차의 0.15배를 초과해 앞서야 합니다. 동점이면 기존 종목이 유지됩니다. 정보량 없이 목록만 분주해 보이게 만드는 잦은 교체를 막기 위한 규칙입니다.',
        '예상 회전율은 월 35% 안팎입니다. 표 위의 수치는 실현된 값이므로 "안정적"이라는 말이 실제로 지켜지는지 직접 확인할 수 있습니다.',
      ],
      cannot: [
        '애널리스트 추정치 수정 사이클, 컨퍼런스콜에서 언급됐지만 공시되지 않은 가이던스 변경 등 공개 문서에 도달하지 않은 정보는 볼 수 없습니다.',
        '진짜 실적 서프라이즈와 회계상 서프라이즈를 구분하지 못합니다. 드리프트 팩터는 보고된 숫자를 읽을 뿐입니다.',
        '포지션 크기나 이미 보유한 자산과의 상관관계를 고려하지 않습니다. 이 목록의 두 종목이 사실상 같은 베팅일 수 있습니다.',
        '이 기간의 표본은 천천히 쌓입니다. 여기서 나온 통계를 근거로 삼기 전에 성과 페이지의 청산 완료 건수를 확인하십시오.',
      ],
    },
  },

  long_term: {
    en: {
      title: '{market} 1–2 Year Stock Rankings (Long Term)',
      description:
        'The ten {market} companies ranking highest on growth quality, return on invested capital, free cash flow conversion, valuation and the Piotroski F-score — with a fair-value band instead of a price target.',
      h1: '{market} long-term stock rankings — 1 to 2 years',
      screensFor: [
        'Growth quality rather than growth rate: revenue growth that converts into operating income and then into cash, which excludes the companies growing the top line by buying it.',
        'Return on invested capital, not return on equity. ROE is inflated by leverage, so a heavily indebted company can post an excellent ROE while destroying capital; ROIC does not have that failure mode.',
        'Free cash flow conversion against net income, which is the most direct available check on whether reported earnings are real.',
        'The Piotroski F-score as a nine-point accounting-quality gate, and a valuation term so the board is not simply a list of expensive quality.',
      ],
      reading: [
        'There is no price stop on this board, and that is deliberate. A 15% drawdown is noise over a two-year holding period; a broken thesis is not. Each row therefore publishes explicit thesis-invalidation conditions — three consecutive years of declining ROIC, gross margin below its ten-year 20th percentile, net debt to EBITDA above 3.5 — and the position closes when one becomes true.',
        'The three target tiers are a discounted fair-value band under conservative, base and optimistic assumptions for growth, margin and exit multiple. It is a range produced by stated assumptions, not a price call.',
        'The exit-rank threshold is 20 and the minimum hold is 21 sessions, so expected turnover is around 10% a month.',
      ],
      cannot: [
        'It cannot value a business. A screen that ranks on published ratios is not a discounted cash flow model and does not pretend to be one.',
        'It cannot see management quality, competitive dynamics, regulatory exposure, or anything else that does not appear in a filed statement.',
        'It cannot warn you about a thesis that breaks in a way the invalidation list does not name. The list is the rules written in advance, which makes it honest; it does not make it complete.',
        'The audit for this horizon will carry a small-sample warning for years, because a two-year holding period produces closed positions at the rate of a two-year holding period. That is the honest state of affairs, not a defect.',
      ],
    },
    ko: {
      title: '{market} 장기 종목 순위 (1~2년)',
      description:
        '성장의 질, 투하자본이익률, 잉여현금흐름 전환율, 밸류에이션, 피오트로스키 F 스코어에서 가장 높은 점수를 받은 {market} 10개 기업. 목표주가 대신 적정가치 구간을 제시합니다.',
      h1: '{market} 장기 종목 순위 — 1~2년',
      screensFor: [
        '성장률이 아니라 성장의 질. 매출 성장이 영업이익으로, 다시 현금으로 전환되는지를 봅니다. 인수로 외형만 키운 기업은 걸러집니다.',
        '자기자본이익률(ROE)이 아니라 투하자본이익률(ROIC). ROE는 레버리지로 부풀려지므로 부채가 많은 기업이 자본을 파괴하면서도 훌륭한 ROE를 기록할 수 있습니다. ROIC에는 그런 실패 방식이 없습니다.',
        '순이익 대비 잉여현금흐름 전환율. 보고된 이익이 실제인지 확인할 수 있는 가장 직접적인 지표입니다.',
        '회계 품질 게이트로서의 피오트로스키 F 스코어(9점 만점), 그리고 밸류에이션 항목. 단순히 비싼 우량주 목록이 되지 않도록 합니다.',
      ],
      reading: [
        '이 순위표에는 가격 손절이 없으며, 의도된 설계입니다. 2년 보유 관점에서 15% 하락은 노이즈이지만 투자 논리의 훼손은 다릅니다. 각 종목은 논리 훼손 조건을 명시적으로 발행합니다. ROIC 3년 연속 하락, 매출총이익률이 10년 20퍼센타일 미만, 순부채/EBITDA 3.5배 초과 등이며, 하나라도 성립하면 청산합니다.',
        '목표가 3단계는 성장률·마진·청산 배수에 대한 보수적·기본·낙관적 가정으로 산출한 할인 적정가치 구간입니다. 명시된 가정이 만들어낸 범위이지 목표주가가 아닙니다.',
        '이탈 순위 기준은 20위, 최소 보유는 21거래일이므로 예상 회전율은 월 10% 안팎입니다.',
      ],
      cannot: [
        '기업 가치를 평가하지 못합니다. 공개된 재무 비율로 순위를 매기는 스크리너는 현금흐름할인 모델이 아니며 그런 척하지도 않습니다.',
        '경영진의 역량, 경쟁 구도, 규제 노출 등 공시 서류에 나타나지 않는 것은 볼 수 없습니다.',
        '논리 훼손 목록에 없는 방식으로 투자 논리가 깨지는 경우에는 경고하지 못합니다. 이 목록은 사전에 문서화한 규칙이라 정직하지만, 그것이 완전하다는 뜻은 아닙니다.',
        '이 기간의 성과 검증은 앞으로 수년간 표본 부족 경고를 달고 있을 것입니다. 2년 보유 전략은 2년 보유 전략의 속도로 청산 건수가 쌓이기 때문입니다. 결함이 아니라 사실 그대로입니다.',
      ],
    },
  },

  ultra_long: {
    en: {
      title: '{market} 5–10 Year Stock Rankings (Ultra Long)',
      description:
        'Wide-moat {market} compounders ranked on moat strength, cash flow durability, reinvestment runway, balance sheet strength and shareholder yield — with a compounding scenario band, not a price target.',
      h1: '{market} ultra-long stock rankings — 5 to 10 years',
      screensFor: [
        'Moat strength inferred from what the accounts actually show: gross margin stability across a full cycle, pricing power that survives an input-cost shock, and returns that do not decay toward the cost of capital.',
        'Cash flow durability — how much of a decade of free cash flow survives the worst two years in it.',
        'Reinvestment runway, because a business that compounds at a high rate on a shrinking capital base is a bond, not a compounder.',
        'Balance sheet strength and shareholder yield, so leverage is not doing the work that operations should be doing.',
      ],
      reading: [
        'There is no stop and there are no price targets. A five-to-ten year price target is a fiction, and printing one would be the least defensible number on this site.',
        'What the three tiers show instead is a compounding scenario band: what the business arrives at under stated assumptions for revenue growth, margin and exit multiple. It says "if these assumptions hold, this is the arithmetic" and nothing whatsoever about whether they will hold.',
        'Review triggers rather than exits: three consecutive years of ROIC decline, gross margin below its ten-year 20th percentile, or net debt to EBITDA above 3.5.',
        'Expected turnover is about 4% a month, and the minimum hold is 63 sessions.',
      ],
      cannot: [
        'It cannot forecast a decade. Nothing can, and any tool that claims to is selling something.',
        'It cannot price in technological displacement, which is the way most wide moats actually end.',
        'It requires ten years of tagged annual statements to score a company at all, which is why this board is published for the US and not for Korea — the keyless Korean sources do not go back far enough, and guessing would be worse than an empty board.',
        'Its audit record is the thinnest on the site by an enormous margin and will stay that way for most of a decade.',
      ],
    },
    ko: {
      title: '{market} 초장기 종목 순위 (5~10년)',
      description:
        '해자의 강도, 현금흐름 지속성, 재투자 여력, 재무 건전성, 주주환원율로 평가한 {market} 복리 성장 기업. 목표주가가 아니라 복리 성장 시나리오 구간을 제시합니다.',
      h1: '{market} 초장기 종목 순위 — 5~10년',
      screensFor: [
        '재무제표가 실제로 보여주는 것으로부터 추론한 해자의 강도. 한 사이클 전체에 걸친 매출총이익률 안정성, 원가 충격을 견디는 가격 결정력, 자본비용 수준으로 수렴하지 않는 수익률입니다.',
        '현금흐름 지속성 — 10년치 잉여현금흐름 중 가장 나빴던 2년을 통과하고 남는 비중입니다.',
        '재투자 여력. 자본 기반이 줄어드는데 높은 수익률로 복리 성장하는 기업은 복리 성장주가 아니라 채권입니다.',
        '재무 건전성과 주주환원율. 영업이 해야 할 일을 레버리지가 대신하고 있지 않은지 확인합니다.',
      ],
      reading: [
        '손절도 목표주가도 없습니다. 5~10년 목표주가는 허구에 가까우며, 그것을 인쇄한다면 이 사이트에서 가장 방어하기 어려운 숫자가 될 것입니다.',
        '대신 3단계가 보여주는 것은 복리 성장 시나리오 구간입니다. 매출 성장률·마진·청산 배수에 대한 명시된 가정 하에서 기업이 도달하는 지점입니다. "이 가정이 유지된다면 계산은 이렇게 된다"는 뜻이며, 그 가정이 유지될지에 대해서는 아무 말도 하지 않습니다.',
        '청산이 아니라 재검토 트리거를 둡니다. ROIC 3년 연속 하락, 매출총이익률이 10년 20퍼센타일 미만, 순부채/EBITDA 3.5배 초과입니다.',
        '예상 회전율은 월 4% 안팎이고 최소 보유는 63거래일입니다.',
      ],
      cannot: [
        '10년을 예측하지 못합니다. 어떤 도구도 못 하며, 할 수 있다고 주장하는 도구는 무언가를 팔고 있는 것입니다.',
        '기술적 대체를 반영하지 못합니다. 넓은 해자가 실제로 무너지는 방식은 대개 그것입니다.',
        '기업을 평가하려면 10년치 태깅된 연간 재무제표가 필요합니다. 이 순위표를 미국에만 발행하고 한국에는 발행하지 않는 이유입니다. 키 없이 접근 가능한 한국 소스는 그만큼 거슬러 올라가지 않으며, 추측하는 것보다 비워 두는 편이 낫습니다.',
        '이 기간의 검증 기록은 사이트에서 압도적으로 가장 얇으며, 앞으로 10년 가까이 그 상태가 유지될 것입니다.',
      ],
    },
  },
};

export function copyFor(market: MarketId, horizon: HorizonId, lang: Locale) {
  const c = HORIZON_COPY[horizon][lang];
  const m = MARKET_NAME[market][lang];
  const sub = (s: string) => s.replace(/\{market\}/g, m);
  return {
    title: sub(c.title),
    description: sub(c.description),
    h1: sub(c.h1),
    screensFor: c.screensFor,
    reading: c.reading,
    cannot: c.cannot,
    marketNote: MARKET_NOTE[market][lang],
  };
}

export const SECTION_HEADINGS: Record<Locale, { screensFor: string; reading: string; cannot: string; market: string; more: string; record: string }> = {
  en: {
    screensFor: 'What this board screens for',
    reading: 'How to read the entry, stop and targets',
    cannot: 'What it cannot tell you',
    market: 'What is specific to this market',
    more: 'Related explainers',
    record: 'The actual record for this horizon',
  },
  ko: {
    screensFor: '이 순위표가 걸러내는 것',
    reading: '진입·손절·목표가를 읽는 법',
    cannot: '알려주지 못하는 것',
    market: '이 시장에만 해당하는 것',
    more: '관련 해설',
    record: '이 기간의 실제 성과 기록',
  },
};
