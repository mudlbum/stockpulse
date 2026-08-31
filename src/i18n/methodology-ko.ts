/**
 * Korean summary of docs/METHODOLOGY.md.
 *
 * The full document is published in English on both language versions of the
 * page — a translated formula is a formula you now have to keep in sync twice,
 * and a drifted formula is worse than an English one. What IS translated is
 * everything a reader needs to decide whether to trust the thing: the section
 * headings, the five design principles (§0) in full, and the known limitations
 * (§10) in full. Deep derivations stay in English under Korean captions.
 */

export const KO_SECTION_TITLES: { n: string; ko: string; en: string }[] = [
  { n: '0', ko: '설계 원칙', en: 'Design principles' },
  { n: '1', ko: '유니버스 구성', en: 'Universe construction' },
  { n: '2', ko: '팩터 정규화 — 모든 모델에 공통', en: 'Factor normalization' },
  { n: '3', ko: '초단기 — 1~5일', en: 'Ultra Short Term' },
  { n: '4', ko: '중기 — 1~2개월', en: 'Mid Term' },
  { n: '5', ko: '장기 — 1~2년', en: 'Long Term' },
  { n: '6', ko: '초장기 — 5~10년', en: 'Ultra Long Term' },
  { n: '7', ko: '순위 안정성(히스테리시스)', en: 'Rank stability (hysteresis)' },
  { n: '8', ko: '상위 10종목 분산 제약', en: 'Diversification constraints' },
  { n: '9', ko: '성과 검증 — 신뢰의 근거', en: 'Performance audit' },
  { n: '10', ko: '알려진 한계', en: 'Known limitations' },
  { n: '11', ko: '변경 관리', en: 'Change control' },
];

export const KO_PRINCIPLES: { id: string; h: string; p: string }[] = [
  {
    id: 'P1',
    h: '모든 팩터는 절대값이 아니라 횡단면으로 점수화합니다.',
    p: '"RVOL 2.5 이상"은 점수가 아니라 필터입니다. RVOL 2.5와 감성 +0.4는 단위도, 척도도, 분포도 다르므로 그대로 더할 수 없습니다. 모든 팩터는 가중치를 매기기 전에 그날 유니버스 안에서 횡단면 z 점수로 바꿉니다. 지표를 그냥 가중합하는 방식을 바로잡는, 가장 중요한 한 가지입니다.',
  },
  {
    id: 'P2',
    h: '시점 기준 데이터만 사용하며, 미래 정보를 참조하지 않습니다.',
    p: '특정 날짜 D의 점수에는 공시 시각이 D 이전인 데이터만 쓸 수 있습니다. 재무 데이터는 회계기간 종료일이 아니라 SEC에 실제로 접수된 날(filed)을 기준으로 합니다. 2분기가 6월 30일에 끝났어도 8월 5일에 제출한 기업이라면, 8월 5일 이전 날짜의 점수에는 전혀 반영되지 않습니다. 이 원칙을 어기는 것이 백테스트에서 꿈 같은 수익률이 나오는 가장 흔한 경로입니다.',
  },
  {
    id: 'P3',
    h: '청산 규칙을 진입보다 먼저 확정합니다.',
    p: '순위표에 올리는 모든 종목은 손절가, 목표 구간, 최대 보유 기간이라는 기계적 청산 규칙과 함께 발행합니다. 성과 검증은 오직 그 규칙으로만 포지션을 닫습니다. 재량도, "조금 일렀을 뿐"이라는 변명도, 슬쩍 지우는 일도 없습니다.',
  },
  {
    id: 'P4',
    h: '데이터 완전성이 편입 자격을 결정합니다.',
    p: '해당 투자 기간의 팩터 입력값이 두 개 이상 비어 있는 종목은 점수가 아무리 높아도 순위에 넣지 않습니다. 빈 값을 평균으로 채우는 것은 있지도 않은 순위를 슬그머니 만들어 내는 일입니다.',
  },
  {
    id: 'P5',
    h: '스크리너 결과이지 예측이 아닙니다.',
    p: '이 목록은 "오늘 이 규칙에서 점수가 가장 높았다"고 말할 뿐 "오를 것이다"라고 말하지 않습니다. 이 구분은 모든 페이지의 문구로 지켜지고 있으며, 동시에 그냥 사실이기도 합니다.',
  },
];

export const KO_LIMITATIONS: string[] = [
  '장중 데이터도 시간외 데이터도 없습니다. 전부 종가 기준입니다. 장 마감 뒤 발행하는 1~5일 순위는 빨라야 다음 거래일 시가부터 실행할 수 있고, 성과 검증의 체결 가정도 이를 그대로 반영합니다.',
  '헤드라인 감성 분석은 약합니다. 언어 모델이 아니라 단어 사전으로 매긴 값이고, 설령 언어 모델을 쓴다 해도 이 정도 투자 기간에서는 예측력이 약합니다.',
  '애널리스트 추정치가 없습니다. 그래서 중기 전략은 추정치 상향·하향 모멘텀 대신 이미 발표된 실적의 드리프트를 씁니다. 이상적인 설계에 견주면 실질적인 후퇴입니다.',
  '한국은 인증 없이 받아 쓸 수 있는 재무제표 소스가 아예 없습니다. 키가 없으면 시가총액과 주가만 확보되므로 초단기 순위표만 산출되고, 나머지 셋은 빈 표 대신 그 이유를 밝힙니다. DART 오픈API 키(무료)를 설정하면 금융감독원 전자공시의 감사받은 재무제표(2015년 이후)를 읽어 네 순위표 모두 산출됩니다.',
  '다중 검정 문제가 있습니다. 투자 기간 4개 × 팩터 수십 개 × 시장 2개는 탐색 공간이 넓습니다. 가중치는 이 데이터에 맞춰 최적화한 것이 아니라 공개된 문헌에서 끌어냈습니다. 과적합은 피했지만 그만큼 다듬지 않았다는 뜻이고, 이는 의도한 맞바꿈입니다.',
  '유동성 필터 구조상 유니버스는 대형주에 편향되어 있습니다. 소형주 기회는 체계적으로 범위 밖에 있습니다.',
  '공매도 전략이 없습니다. 모든 목록이 매수 전용입니다. 하락장에서 정답은 흔히 "아무것도 하지 않는 것"인데, 국면 배수가 그 말을 대신할 수 있는 유일한 장치입니다.',
];

export const KO_NOTES = {
  fullDocNote:
    '아래 전문은 파이프라인이 실제로 구현하고 있는 영어 원문입니다. 산식과 계수는 번역하지 않고 원문 그대로 싣습니다. 번역본과 원문이 갈라지는 순간 어느 쪽이 실제 코드인지 알 수 없게 되기 때문입니다.',
  principlesHeading: '§0 설계 원칙(전문 번역)',
  limitationsHeading: '§10 알려진 한계(전문 번역)',
  sectionsHeading: '문서 구성',
  fullHeading: '전체 문서 (영문 원본)',
};
