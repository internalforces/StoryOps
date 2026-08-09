# 데이터 관리 원칙

StoryOps 저장소는 공개 코드와 비공개 원고를 물리적으로 분리한다.

## 저장 위치

| 구분 | 위치 | Git 추적 | 내용 |
|---|---|---:|---|
| 원본 백업 | `private/backups/` | 아니요 | 원고·설정·이미지의 날짜별 압축본과 체크섬 |
| 분할 원고 | `private/data/episodes/` | 아니요 | 회차·상태별 Markdown |
| 비공개 색인 | `private/data/manifest.private.json` | 아니요 | 원본 파일명, 해시, 크기, 안정 ID |
| 공개 데이터 | `public/data/` | 예 | 원문이 없는 집계와 합성 데모 데이터 |

## 안정 ID 규칙

- 작품: `joseon-future`
- 정본 회차: `joseon-future-ep-0001-canon`
- 초안 회차: `joseon-future-ep-0001-draft`
- 참고 문서: `joseon-future-ref-<정규화된-문서명>`

회차 내용이 수정되어도 ID는 유지하며, 변경 감지는 SHA-256으로 수행한다.

## 재실행

저장소 루트에서 `npm run import:private -- ..`를 실행한다. 가져오기는 원본을 수정하지 않으며 `private/`와 공개 집계 파일만 갱신한다.

## 공개 전 점검

1. `git status --short`에서 `private/`가 보이지 않는지 확인한다.
2. `git grep`으로 실제 인물명이나 원고 문장이 포함되지 않았는지 확인한다.
3. 공개 데모에는 합성 데이터만 사용한다.
