# StoryOps

> 120화 장편 원고의 초안·정본 240개 버전을 구조화하고, 설정 근거를 추적해 새 원고의 연속성 오류 후보를 제시하는 로컬 우선 검수 도구

[![CI](https://github.com/internalforces/StoryOps/actions/workflows/ci.yml/badge.svg)](https://github.com/internalforces/StoryOps/actions/workflows/ci.yml)
[![GitHub Pages](https://github.com/internalforces/StoryOps/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/internalforces/StoryOps/actions/workflows/deploy-pages.yml)

[**라이브 데모**](https://internalforces.github.io/StoryOps/) · [72초 시연 영상](docs/demo/storyops-demo.mp4) · [문제 해결 사례](docs/CASE-STUDY.md) · [v1→v2 평가](docs/EVALUATION.md)

![StoryOps 연속성 검사 화면](docs/demo/04-continuity.png)

## 30초 요약

| 문제 | 내가 만든 것 | 검증된 결과 |
|---|---|---|
| 35개 문서에 초안·정본·설정이 혼재 | 회차 분할, 안정 ID, 비공개 매니페스트 | 120화·240버전, 설정 후보 81건, 분할 경고 0 |
| 설정 충돌의 근거를 찾기 어려움 | 한글 검색, 별칭 정규화, 근거 회차 연결 | 합성 회귀셋 검색 Hit@5 100% |
| 회상·거짓말을 오류로 단정 | 시간축·화자·기억 신뢰도를 판정 입력으로 분리 | 알려진 70건 회귀셋 14/70 → 70/70 |
| 실제 원고를 공개할 수 없음 | 로컬 저장, 원문·공개 합성 데이터 분리 | 공개된 실제 원문 0건 |

`70/70`은 알려진 7개 실패 유형을 다시 놓치지 않는지 보는 **회귀 결과**입니다. 실제 원고 전체에 대한 일반화 정확도로 주장하지 않습니다.

## 핵심 사용 흐름

1. 원고를 회차·초안·정본으로 분할하고 안정 ID를 부여합니다.
2. 참고 문서의 제목을 설정 후보로 연결하고, 작가가 정본·별칭·충돌 표현을 확정합니다.
3. 새 원고를 문장별로 나누고 관련 설정과 근거 회차를 검색합니다.
4. `rule-v2`가 직접·간접 충돌을 제시하고, 회상·거짓말·불확실한 기억은 `문맥 필요`로 분리합니다.
5. 작가가 오류·문맥·오탐을 최종 판정하고 결과를 기기 안에 저장합니다.

운영 현황의 **120화 규모 데모**를 누르면 120개 회차·240개 초안/정본 버전으로 전체 흐름을 확인할 수 있습니다.

## v1에서 v2로

| 지표 | rule-v1 | rule-v2 |
|---|---:|---:|
| 전체 통과 | 14/70 | 70/70 |
| 충돌 재현율 | 24% | 100% |
| 충돌 오탐 | 10건 | 0건 |
| 문맥 식별 | 0/30 | 30/30 |
| 검색 Hit@5 | 100% | 100% |

v2의 주요 변경은 설정별 별칭·의미 패턴, 정상적인 시간 변화, 화자의 기만 의도, 기억 신뢰도를 각각 독립 입력으로 취급한 것입니다. 자세한 유형별 결과와 한계는 [평가 보고서](docs/EVALUATION.md)에 있습니다.

## 기술과 품질

- React 19 + TypeScript 7 + Vite 8
- 설명 가능한 한글 토큰/2-gram 검색과 `rule-v1`/`rule-v2` 비교 평가
- IndexedDB 우선 저장, 기존 `localStorage` 데이터 마이그레이션과 폴백
- 120화·240버전 합성 규모 검증 시나리오
- Vitest 18개 단위·회귀·워크플로 테스트
- GitHub Actions CI + GitHub Pages
- 외부 API 비용 $0, 원고와 판정 결과는 브라우저 밖으로 전송하지 않음

## 빠른 시작

Node.js 22 이상이 필요합니다.

```bash
git clone https://github.com/internalforces/StoryOps.git
cd StoryOps
npm ci
npm run dev
```

```bash
npm test
npm run build
```

## 비공개 원고 가져오기

실제 원고는 저장소에 포함되지 않습니다. 상위 폴더에 `웹소설/`, `등장인물/`이 있을 때 다음 명령으로 로컬 전용 데이터를 만듭니다.

```bash
npm run import:private -- ..
```

가져오기는 원고를 회차별로 분할하고, 참고 문서의 제목을 설정 후보로 만든 뒤 `private/data/manifest.private.json`을 생성합니다. 사용자가 파일을 직접 선택해야만 작품·회차·후보 메타데이터가 IndexedDB에 저장됩니다. 원문, 원본 파일명, 해시, 로컬 경로는 앱 데이터로 보존하지 않습니다.

## 문서

- [문제 해결 사례](docs/CASE-STUDY.md): 역할, 제약, 대안, v1 실패와 v2 결과
- [평가 보고서](docs/EVALUATION.md): 7개 실패 유형, v1/v2 비교, 일반화 한계
- [아키텍처](docs/ARCHITECTURE.md): 데이터 경계, 로컬 저장, 판정 파이프라인
- [데이터 관리 원칙](docs/DATA-GOVERNANCE.md): 비공개 데이터와 공개 검증 절차
- [시연 가이드](docs/DEMO.md): 1~2분 데모 동선

## 라이선스

현재 저장소에는 오픈 소스 라이선스가 지정되어 있지 않습니다. 코드는 공개 열람할 수 있지만 별도 허가 없이 복제·배포·상업적 이용할 수 없습니다.
