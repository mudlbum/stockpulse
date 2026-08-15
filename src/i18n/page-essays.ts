/**
 * Original prose for the tool pages.
 *
 * Kept out of ui.ts because it is long-form content rather than interface
 * strings, and because it needs to be reviewed as writing. Each essay answers
 * the same three questions: what this page is, how to read it, and when it
 * misleads you. The third section is the one that matters — a data page that
 * only explains its own strengths is marketing.
 */

import type { Locale } from '../config';

export interface EssaySection {
  h: string;
  p: string[];
}

type Essay = Record<Locale, { heading: string; sections: EssaySection[] }>;

export const ESSAYS: Record<'simulator' | 'sectors' | 'news' | 'performance' | 'alerts', Essay> = {
  simulator: {
    en: {
      heading: 'How to use this simulator, and what it will not tell you',
      sections: [
        {
          h: 'What this page does',
          p: [
            'The simulator takes an amount, splits it evenly across the ten entries on a board, and shows you the arithmetic that follows: how many whole shares each slice buys at the midpoint of the published entry zone, what is left uninvested because shares are indivisible, and what the total exposure would be if every stop on the board triggered at once. Nothing is fetched and nothing is sent — the calculation runs in the page, from the same JSON the leaderboard was built from.',
            'The aggregate stop-loss figure is the one worth sitting with. It is the sum of (entry − stop) × shares across the positions that have a price stop, and on a ten-position ultra-short board it is routinely a larger number than people expect from a set of individually modest-looking stops. Seeing it as one figure rather than ten is the point of the exercise.',
          ],
        },
        {
          h: 'How to read the outcome scenarios',
          p: [
            'Each row lets you assume an outcome — stop, conservative, base, bull, or unchanged — and the totals update. This is not a probability model. It does not weight the scenarios, because assigning probabilities to them would be inventing information the rule set does not have. It answers a narrower question: if these things happened, what would the arithmetic be.',
            'The commission input models a round-trip cost in basis points on both sides. It is the only cost modelled here. Spread, slippage, taxes, borrowing costs and currency movement are all excluded, and on a short-horizon board with frequent turnover those are not rounding errors.',
          ],
        },
        {
          h: 'When it misleads',
          p: [
            'It assumes you fill at the midpoint of the entry zone. The performance audit does not assume that — it only records a fill when the next session\'s (open + close) ÷ 2 actually lands inside the zone, and roughly one entry in ten never fills at all. The simulator quietly assumes every position gets filled, which makes any scenario it shows more favourable than the audited reality.',
            'It also assumes stops execute at the stop price. A gap through a stop fills below it, sometimes far below, and the Korean boards carry an additional hazard: a stock locked at the ±30% daily limit cannot be exited at any price until it unlocks.',
            'Finally, equal weighting across ten names is not diversification if several of them are the same bet. The board applies sector and correlation caps before publication, but a cap of three names per sector still permits three correlated positions.',
          ],
        },
      ],
    },
    ko: {
      heading: '이 시뮬레이터 사용법과 알려주지 않는 것',
      sections: [
        {
          h: '이 페이지가 하는 일',
          p: [
            '시뮬레이터는 입력한 금액을 순위표의 10종목에 균등 배분하고 그에 따른 계산을 보여줍니다. 공개된 진입 구간의 중간값으로 각 배분금이 몇 주를 살 수 있는지, 주식은 정수 단위라 얼마가 남는지, 모든 손절이 동시에 실행되면 총 노출이 얼마인지를 계산합니다. 아무것도 가져오지 않고 아무것도 전송하지 않습니다. 리더보드를 만든 것과 같은 JSON으로 페이지 안에서 계산합니다.',
            '눈여겨볼 값은 손절 시 총 노출입니다. 가격 손절이 있는 포지션의 (진입가 − 손절가) × 수량 합계이며, 10종목 초단기 순위표에서는 개별 손절 폭이 작아 보여도 합계는 예상보다 훨씬 큰 경우가 많습니다. 열 개로 흩어진 숫자를 하나로 보는 것이 이 계산의 목적입니다.',
          ],
        },
        {
          h: '결과 시나리오를 읽는 법',
          p: [
            '각 종목마다 손절, 보수적, 기본, 낙관적, 변동 없음 중 하나를 가정하면 합계가 갱신됩니다. 확률 모형이 아닙니다. 시나리오에 가중치를 두지 않는데, 확률을 부여하는 것은 규칙이 갖고 있지 않은 정보를 지어내는 일이기 때문입니다. 이 도구는 더 좁은 질문에 답합니다. 이런 일이 일어난다면 계산은 어떻게 되는가.',
            '수수료 입력값은 매수·매도 양쪽에 bp 단위 왕복 비용을 반영합니다. 여기서 모형화한 비용은 그것뿐입니다. 호가 스프레드, 슬리피지, 세금, 차입 비용, 환율 변동은 모두 제외되어 있으며, 회전율이 높은 단기 순위표에서 이들은 반올림 오차가 아닙니다.',
          ],
        },
        {
          h: '어떤 경우에 오해를 부르는가',
          p: [
            '진입 구간의 중간값에 체결된다고 가정합니다. 성과 검증은 그렇게 가정하지 않습니다. 다음 거래일의 (시가 + 종가) ÷ 2가 실제로 구간 안에 들어올 때만 체결로 기록하며, 대략 열 건 중 한 건은 아예 체결되지 않습니다. 시뮬레이터는 모든 포지션이 체결된다고 조용히 가정하므로, 여기서 보여주는 어떤 시나리오도 검증된 현실보다 유리합니다.',
            '손절도 손절가에 체결된다고 가정합니다. 갭 하락으로 손절가를 뚫으면 그 아래에서, 때로는 훨씬 아래에서 체결됩니다. 한국 순위표에는 위험이 하나 더 있습니다. 일일 ±30% 제한폭에 걸린 종목은 제한이 풀릴 때까지 어떤 가격에도 청산할 수 없습니다.',
            '마지막으로, 10종목 균등 배분은 그중 여럿이 사실상 같은 베팅이라면 분산이 아닙니다. 순위표는 발행 전에 섹터와 상관관계 상한을 적용하지만, 섹터당 3종목 상한은 상관관계가 높은 3종목을 여전히 허용합니다.',
          ],
        },
      ],
    },
  },

  sectors: {
    en: {
      heading: 'Reading the sector map',
      sections: [
        {
          h: 'What the treemap shows',
          p: [
            'Each tile is a GICS sector. Its area is that sector\'s share of total market capitalisation in the selected market, and its colour is the sector\'s return over the window you choose — one day, five days or twenty. The two encodings answer different questions: area tells you where the money already is, colour tells you which way it moved.',
            'Area and colour deliberately do not agree. A large grey tile is a sector that dominates the index and did nothing; a small dark-green tile is a strong move in a corner of the market too small to affect the index. Reading only the colour will consistently overstate how much of the market a move represents.',
          ],
        },
        {
          h: 'Breadth, and why it is in the table',
          p: [
            'The table under the map carries a breadth column: the share of that sector\'s members that advanced. It is the check on the headline return. A sector up 2% with 30% breadth is two or three large names carrying an index, which is a different situation from a sector up 2% with 80% breadth, even though the treemap paints both the same colour.',
            'The table is not a fallback for the map — it is the same data in a form that reads correctly without colour, with a screen reader, and when you need the actual numbers rather than an impression.',
          ],
        },
        {
          h: 'What it cannot tell you',
          p: [
            'Sector returns at short lookbacks are close to noise. The documented short-term reversal effect sits inside the 20-day window, which is why the ranking formulas use sector strength at six to twelve months rather than at one to twenty days. This page is a description of what happened, not an input the boards act on at these windows.',
            'GICS classification also flattens real businesses. A company with a large cloud division may sit in a sector whose average constituent has nothing in common with it, and a conglomerate is filed under one label regardless of where its earnings come from.',
            'Everything here is end-of-day and reflects the close of the sessions named above each map, not the current tape.',
          ],
        },
      ],
    },
    ko: {
      heading: '섹터 지도 읽는 법',
      sections: [
        {
          h: '트리맵이 보여주는 것',
          p: [
            '각 타일은 GICS 섹터입니다. 면적은 해당 시장 전체 시가총액에서 그 섹터가 차지하는 비중이고, 색상은 선택한 기간(1일, 5일, 20일)의 수익률입니다. 두 표현은 서로 다른 질문에 답합니다. 면적은 돈이 이미 어디에 있는지를, 색상은 어느 방향으로 움직였는지를 알려줍니다.',
            '면적과 색상은 의도적으로 일치하지 않습니다. 크고 회색인 타일은 지수를 좌우하지만 거의 움직이지 않은 섹터이고, 작고 진한 녹색 타일은 지수에 영향을 주기엔 너무 작은 구석에서 일어난 강한 움직임입니다. 색상만 보면 그 움직임이 시장에서 차지하는 비중을 계속 과대평가하게 됩니다.',
          ],
        },
        {
          h: '상승 비율을 표에 함께 두는 이유',
          p: [
            '지도 아래 표에는 상승 비율 열이 있습니다. 해당 섹터 구성 종목 중 상승한 종목의 비율이며, 대표 수익률을 검증하는 값입니다. 상승 비율 30%로 2% 오른 섹터는 대형주 두세 종목이 지수를 끌어올린 것이고, 상승 비율 80%로 2% 오른 섹터와는 전혀 다른 상황입니다. 트리맵은 둘을 같은 색으로 칠합니다.',
            '표는 지도의 대체재가 아니라 같은 데이터입니다. 색상 없이도, 스크린 리더로도 정확히 읽히고, 인상이 아니라 실제 숫자가 필요할 때 쓰는 형태입니다.',
          ],
        },
        {
          h: '알려주지 못하는 것',
          p: [
            '짧은 기간의 섹터 수익률은 노이즈에 가깝습니다. 문헌으로 확인된 단기 반전 효과가 20일 구간 안에 들어가기 때문에, 순위 산식은 1~20일이 아니라 6~12개월 기준의 섹터 강도를 사용합니다. 이 페이지는 무슨 일이 있었는지에 대한 설명이지, 이 기간 단위로 순위표가 반응하는 입력값이 아닙니다.',
            'GICS 분류는 실제 사업을 뭉뚱그리기도 합니다. 큰 클라우드 사업부를 가진 기업이 평균 구성 종목과 공통점이 거의 없는 섹터에 속할 수 있고, 복합기업은 이익이 어디서 나오든 하나의 라벨로 분류됩니다.',
            '모든 데이터는 종가 기준이며 각 지도 위에 표시된 거래일의 종가를 반영합니다. 현재 시세가 아닙니다.',
          ],
        },
      ],
    },
  },

  news: {
    en: {
      heading: 'How the news feed is built, and how much to trust it',
      sections: [
        {
          h: 'What is on this page',
          p: [
            'Headlines from a fixed set of public business feeds, matched to the tickers in the ranked universe. A story appears here because it names a company on one of the boards, not because an editor judged it important. The clustering at the top groups stories that several outlets ran on the same subject, which is a rough but useful filter: something two or three newsrooms independently decided to cover is more likely to have mattered.',
            'Each item carries a sentiment label. That label comes from a lexicon — a list of terms with signed weights — not from a language model.',
          ],
        },
        {
          h: 'How much the sentiment score is worth',
          p: [
            'Not much, and the site says so rather than dressing it up. A lexicon cannot read negation reliably, cannot tell a company beating expectations from a company beating a competitor, and has no idea whether "cuts" refers to costs or to guidance. It is one weakly-weighted input among many in the ultra-short formula and it is shown here so you can judge it against the headline it scored.',
            'The evidence terms displayed with each score are the words that actually produced it. If they look like a poor summary of the headline, they are — and that is the honest state of a lexicon, visible rather than hidden behind a number.',
          ],
        },
        {
          h: 'Coverage gaps, stated plainly',
          p: [
            'The feed health panel lists every source and whether it responded on the last pipeline run. A failing feed does not get imputed or backfilled: its contribution is removed, and the affected rows are flagged as having partial data. This means coverage is uneven across days and markets, and a stock with no headlines here may simply be one this set of feeds does not cover.',
            'There is no paywalled or subscription-only reporting in this set, no earnings-call transcripts, and no regulatory filings feed. Absence of news on this page is not evidence that nothing happened.',
          ],
        },
      ],
    },
    ko: {
      heading: '뉴스 피드가 만들어지는 방식과 신뢰도',
      sections: [
        {
          h: '이 페이지에 있는 것',
          p: [
            '정해진 공개 경제 뉴스 피드에서 수집한 헤드라인을, 순위 유니버스의 종목 코드에 매칭한 것입니다. 편집자가 중요하다고 판단해서가 아니라 순위표에 있는 기업을 언급했기 때문에 여기 나타납니다. 상단의 클러스터는 여러 매체가 같은 사안을 보도한 기사를 묶은 것으로, 거칠지만 유용한 필터입니다. 두세 개 편집국이 독립적으로 다루기로 한 사안은 실제로 중요했을 가능성이 높습니다.',
            '각 기사에는 감성 라벨이 붙습니다. 이 라벨은 언어 모델이 아니라 사전, 즉 부호가 있는 가중치를 가진 단어 목록에서 나옵니다.',
          ],
        },
        {
          h: '감성 점수의 가치',
          p: [
            '크지 않습니다. 그리고 이 사이트는 그것을 포장하지 않고 그대로 밝힙니다. 사전 방식은 부정 표현을 안정적으로 읽지 못하고, 기업이 기대치를 넘어선 것과 경쟁사를 앞선 것을 구분하지 못하며, "삭감"이 비용을 가리키는지 가이던스를 가리키는지 알지 못합니다. 초단기 산식에서 낮은 가중치를 가진 여러 입력 중 하나이며, 점수를 매긴 헤드라인과 나란히 놓고 직접 판단하시라고 여기에 표시합니다.',
            '점수와 함께 표시되는 근거 키워드는 실제로 그 점수를 만들어낸 단어들입니다. 헤드라인 요약으로서 부실해 보인다면 실제로 부실한 것이며, 숫자 뒤에 감추지 않고 드러낸 사전 방식의 정직한 상태입니다.',
          ],
        },
        {
          h: '커버리지의 공백',
          p: [
            '피드 상태 패널은 모든 소스와 마지막 실행에서의 응답 여부를 보여줍니다. 실패한 피드는 추정하거나 채워 넣지 않고 기여분을 제거하며, 영향을 받은 종목에는 데이터 일부 누락 플래그를 표시합니다. 따라서 커버리지는 날짜와 시장에 따라 고르지 않으며, 여기에 헤드라인이 없는 종목은 단지 이 피드 세트가 다루지 않는 종목일 수 있습니다.',
            '이 세트에는 유료 구독 전용 보도, 실적 발표 콜 전문, 공시 피드가 포함되어 있지 않습니다. 이 페이지에 뉴스가 없다는 것은 아무 일도 없었다는 증거가 아닙니다.',
          ],
        },
      ],
    },
  },

  performance: {
    en: {
      heading: 'How to read this audit',
      sections: [
        {
          h: 'Why the control column exists',
          p: [
            'A win rate on its own is close to meaningless. In a rising market, entries drawn at random from a large-cap universe post a good win rate, and any screen that is long-only will look skilful for the same reason the index does. Every win rate on this page therefore appears beside the win rate of a random-selection control drawn from the same universe on the same dates, and every mean return appears beside the same-period return of the benchmark.',
            'If the control column is close to the strategy column, the honest reading is that the rule set did not add anything over that sample. The layout makes that comparison structural so it cannot be quietly dropped.',
          ],
        },
        {
          h: 'The fill convention, and the never-filled count',
          p: [
            'An entry is only recorded as filled if the next session\'s average of open and close lands inside the published entry zone. Otherwise it is recorded as never filled, earns nothing, and is excluded from the return statistics — but it is still counted and displayed, because the count of unreachable entries is part of the honest picture. Assuming a fill at the published close would flatter every number here, since the ranking is computed from that close.',
            'Exits are mechanical: the stop, the base target, a forced-exit trigger, or the maximum holding period, whichever comes first. A session whose range contains both the stop and the target is always resolved as the stop.',
          ],
        },
        {
          h: 'What this record cannot support',
          p: [
            'Sample size is the binding constraint, not the arithmetic. Where a horizon has fewer than thirty closed positions the page says so, and the long-horizon boards will carry that warning for years — a two-year holding period produces closed positions at the rate of a two-year holding period.',
            'The equity curve is an equal-weight portfolio of filled entries with modelled costs. It is not a return you could have earned: it assumes simultaneous execution across every filled entry, no capital constraint, and no tax.',
            'Past results here describe what a published rule produced on past dates. They are not a projection, and a good stretch on this page is not evidence the next one will be.',
          ],
        },
      ],
    },
    ko: {
      heading: '이 검증 기록을 읽는 법',
      sections: [
        {
          h: '대조군 열이 있는 이유',
          p: [
            '승률만 놓고 보면 거의 의미가 없습니다. 상승장에서는 대형주 유니버스에서 무작위로 뽑아도 승률이 좋게 나오며, 롱 전용 전략은 지수가 그렇듯 같은 이유로 실력 있어 보입니다. 그래서 이 페이지의 모든 승률 옆에는 같은 날짜, 같은 유니버스에서 무작위로 뽑은 대조군의 승률이 있고, 모든 평균 수익률 옆에는 같은 기간 벤치마크 수익률이 있습니다.',
            '대조군 수치가 전략 수치와 가깝다면, 그 표본에서는 규칙이 아무것도 더하지 못했다고 읽는 것이 정직합니다. 이 비교를 조용히 뺄 수 없도록 레이아웃 자체에 고정해 두었습니다.',
          ],
        },
        {
          h: '체결 가정과 미체결 건수',
          p: [
            '다음 거래일의 시가와 종가 평균이 공개된 진입 구간 안에 들어올 때만 체결로 기록합니다. 그렇지 않으면 미체결로 기록하고 수익도 없으며 수익률 통계에서 제외합니다. 다만 건수는 그대로 집계하고 표시하는데, 도달 불가능했던 건수 자체가 정직한 그림의 일부이기 때문입니다. 공개된 종가에 체결된다고 가정하면 모든 수치가 좋아 보이게 되는데, 순위 자체가 그 종가로 계산되었기 때문입니다.',
            '청산은 기계적입니다. 손절, 기본 목표, 강제 청산 트리거, 최대 보유 기간 중 먼저 오는 것으로 종료합니다. 하루 범위에 손절가와 목표가가 모두 포함되면 항상 손절로 처리합니다.',
          ],
        },
        {
          h: '이 기록이 뒷받침하지 못하는 것',
          p: [
            '제약은 계산이 아니라 표본 크기입니다. 청산 완료가 30건 미만인 기간에는 그 사실을 페이지에 표시하며, 장기 순위표는 앞으로 수년간 그 경고를 달고 있을 것입니다. 2년 보유 전략은 2년 보유 전략의 속도로 청산 건수가 쌓입니다.',
            '자산 곡선은 체결된 종목의 동일가중 포트폴리오에 모형화한 비용을 반영한 것입니다. 실제로 얻을 수 있었던 수익률이 아닙니다. 모든 체결 종목의 동시 실행, 자본 제약 없음, 세금 없음을 가정합니다.',
            '여기의 과거 결과는 공개된 규칙이 과거 날짜에 만들어낸 것을 설명합니다. 전망이 아니며, 이 페이지의 좋은 구간이 다음 구간도 그러리라는 증거가 되지 않습니다.',
          ],
        },
      ],
    },
  },

  alerts: {
    en: {
      heading: 'Following the boards without an account',
      sections: [
        {
          h: 'What the feeds actually contain',
          p: [
            'The rankings JSON is the complete board state, not a summary: every row with its score, factor z-scores, entry zone, stop, target band, risk gauge, data-completeness fraction and flags, plus the regime state per market and the just-missed list with the constraint that displaced each name. It is the same file the pages on this site are built from, so there is nothing in the interface that is not in the feed.',
            'The RSS feed carries one item per published article and one per board update, each pointing at its own URL rather than a fragment of the home page, so a reader can actually distinguish them.',
          ],
        },
        {
          h: 'Polling it sensibly',
          p: [
            'The files are static and served with normal HTTP caching, so a conditional request costs a 304 when nothing has changed. Check the top-level `generatedAt` timestamp before parsing the rest; it moves only when the pipeline has published a new run, which is at most once per session per market.',
            'There is no rate limit beyond whatever the static host imposes, no key, and no account. There is also no uptime commitment: this is a static site and the feeds are as available as the host is.',
          ],
        },
        {
          h: 'Why the email form is switched off',
          p: [
            'Email alerts need a mail provider, a working unsubscribe path, and a lawful basis for storing an address — none of which exist yet. A form that accepts an address and quietly discards it is worse than no form, so the input and the button are disabled rather than decorative.',
            'The same reasoning applies to the alerts themselves. A same-session notice that a published stop was breached is only useful if it is reliable, and a notification system that misses events trains you to stop trusting it.',
          ],
        },
      ],
    },
    ko: {
      heading: '계정 없이 순위표를 구독하는 방법',
      sections: [
        {
          h: '피드에 실제로 들어 있는 것',
          p: [
            '순위 JSON은 요약이 아니라 순위표 전체 상태입니다. 각 종목의 점수, 팩터 z 점수, 진입 구간, 손절가, 목표 구간, 위험도, 데이터 완전성 비율, 플래그와 함께 시장별 국면 상태, 그리고 어떤 제약으로 탈락했는지가 명시된 탈락 종목 목록까지 포함합니다. 이 사이트의 페이지를 만드는 것과 같은 파일이므로, 화면에 있는데 피드에 없는 정보는 없습니다.',
            'RSS 피드는 발행된 글마다 하나, 순위표 갱신마다 하나의 항목을 제공하며 각각 홈 페이지의 앵커가 아니라 자체 URL을 가리킵니다. 구독자가 실제로 구분할 수 있습니다.',
          ],
        },
        {
          h: '합리적으로 폴링하는 법',
          p: [
            '파일은 정적이고 일반적인 HTTP 캐싱으로 제공되므로, 변경이 없으면 조건부 요청은 304로 끝납니다. 나머지를 파싱하기 전에 최상위 `generatedAt` 값을 먼저 확인하십시오. 이 값은 파이프라인이 새 결과를 발행했을 때만 바뀌며, 시장별로 하루 한 번을 넘지 않습니다.',
            '정적 호스트가 부과하는 제한 외에 별도의 호출 제한, API 키, 계정은 없습니다. 가용성 보장도 없습니다. 정적 사이트이므로 호스트가 살아 있는 만큼만 제공됩니다.',
          ],
        },
        {
          h: '이메일 양식을 꺼 둔 이유',
          p: [
            '이메일 알림에는 메일 발송 제공자, 실제로 작동하는 수신거부 경로, 주소를 저장할 적법 근거가 필요하며 셋 다 아직 없습니다. 주소를 받는 척하고 조용히 버리는 양식은 없느니만 못하므로, 입력란과 버튼을 장식이 아니라 실제로 비활성화해 두었습니다.',
            '알림 자체에도 같은 논리가 적용됩니다. 발행된 손절가가 이탈되었다는 당일 알림은 신뢰할 수 있을 때만 유용하며, 이벤트를 놓치는 알림 시스템은 결국 신뢰하지 않도록 학습시킵니다.',
          ],
        },
      ],
    },
  },
};
