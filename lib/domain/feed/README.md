<!--
이 폴더는 FeedPost와 모델/시장/운영 인사이트 피드의 타입 경계를 맡는다.
피드는 정보성 설명 공간이며 수익 보장, 개인별 투자 조언, 최종 법률 판단을 담지 않는다.
-->

# Feed Domain

Owns:

- `FeedPost`
- feed post type naming
- informational, review, risk-note post boundaries

Rules:

- Feed content must be informational and contextual.
- Do not guarantee returns or encourage the user to trade securities.
- Link risk and disclosure language to compliance review when wording becomes sensitive.
- Keep feed UI rendering in `components/invest-model`, not in this folder.
