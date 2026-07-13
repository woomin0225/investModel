<!--
이 폴더는 SignalEvent와 시장/뉴스/트래픽 기반 관찰 신호의 타입 경계를 맡는다.
SignalEvent는 매수, 매도, 보유, 리밸런싱 추천이 아니라 모델 분석 입력이다.
-->

# Signals Domain

Owns:

- `SignalEvent`
- `SignalEventType`
- signal source and data-context naming
- unavailable market/news data state labels

Rules:

- Signals describe observed input only.
- Do not create `TradeIntent` directly from this folder.
- Do not phrase signal names as buy, sell, hold, or rebalance recommendations.
- External market/news API integration requires a separate task and secret/API review.
