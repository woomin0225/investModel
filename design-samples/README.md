# Design Samples

<!--
이 폴더는 investModel의 디자인 참고 이미지와 분석 결과를 보관하는 공간입니다.
사용자는 원본 캡처를 넣고, Codex는 선택된 이미지를 기준으로 design-harness를 갱신합니다.
-->

## Folder Structure

```text
design-samples/
  raw/
    사용자가 자유롭게 넣는 원본 캡처 이미지
  selected/
    실제 디자인 기준으로 삼을 선별 이미지
  analyzed/
    Codex가 작성한 이미지 분석 결과, 색상/레이아웃/컴포넌트 요약
```

## How To Use

1. 참고하고 싶은 앱/웹 화면 캡처를 `raw/`에 넣는다.
2. 프로젝트 디자인 기준으로 삼을 이미지만 `selected/`에 복사한다.
3. Codex에게 `visual-seed-from-screenshot` 스킬로 `selected/` 이미지를 분석하라고 요청한다.
4. 분석 결과는 `analyzed/`에 저장하고, 필요한 내용만 `harness/design-harness.md`에 반영한다.

## Rules

- 브랜드 의도, 톤, 철학처럼 이미지에서 직접 확인할 수 없는 내용은 임의로 작성하지 않는다.
- 로고, 캐릭터, 일러스트처럼 저작권/상표 문제가 생길 수 있는 요소는 그대로 복제하지 않는다.
- 투자 앱 특성상 위험 정보, 손실 가능성, 모델 운용 범위가 UI에서 숨겨지지 않게 한다.

