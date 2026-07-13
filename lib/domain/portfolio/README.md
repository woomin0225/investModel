<!--
이 폴더는 MockDeposit, Portfolio, AllocationDecision, TradeIntent처럼 mock 자금과 주문 전 시뮬레이션 경계를 맡는다.
실제 입금, 실제 계좌 연결, 실제 주문 실행은 이 폴더의 초기 MVP 범위가 아니다.
-->

# Portfolio Domain

Owns:

- `MockDeposit`
- `Portfolio`
- `AllocationDecision`
- `TradeIntent`
- portfolio and pre-order simulation statuses

Rules:

- Every money-like field must clearly indicate mock or simulated context.
- `TradeIntent` is never a broker order, execution, fill, or live trading instruction.
- Do not add payment, banking, withdrawal, brokerage account, or real order execution logic here.
- If real financial operation work appears necessary, stop and record an Issue first.
