<!--
이 폴더는 InvestmentModel, ModelVersion, PortfolioMandate, ModelRiskProfile처럼 AI 투자 모델 자체의 공개 단위와 버전 경계를 맡는다.
UI, DB query, 외부 API 호출은 이 폴더에 넣지 않는다.
-->

# Models Domain

Owns:

- `InvestmentModel`
- `ModelVersion`
- `ModelRiskProfile`
- `PortfolioMandate`
- model status and visibility naming

Rules:

- Use canonical names from `harness/domain-contract-harness.md`.
- Do not rename `InvestmentModel` to Strategy, Bot, or Advisor.
- Do not put React components, database queries, or external API calls here.
- Keep user-editable investment preferences out of this folder; mandate belongs to the model, not the user.
