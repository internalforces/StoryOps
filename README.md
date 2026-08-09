# StoryOps

장편 서사의 **초안·정본·인물·설정·연속성 검수**를 한곳에서 관리하는 로컬 우선 콘텐츠 운영 도구입니다.

[라이브 데모](https://internalforces.github.io/StoryOps/) · [1분 12초 시연 영상](docs/demo/storyops-demo.mp4) · [아키텍처](docs/ARCHITECTURE.md) · [문제 해결 사례](docs/CASE-STUDY.md) · [평가 보고서](docs/EVALUATION.md)

![StoryOps 연속성 검사 화면](docs/demo/04-continuity.png)

## 구현 범위

- 작품·회차·인물·설정 생성/조회/수정/삭제
- 초안/정본 상태와 공개/비공개 범위 관리
- 설정과 근거 정본 회차 연결
- 원고 문장 분할과 관련 설정 검색
- 구조화된 충돌 후보, 신뢰도, 근거 회차 출력
- 오류 승인·오탐 처리와 브라우저 내 영속 저장
- 충돌/정상 회귀셋, 정확도·재현율·Hit@5·MRR·속도·비용 측정
- 원본 백업, 회차 분할, 안정 ID, 공개/비공개 데이터 파이프라인
- Vitest 자동 테스트와 GitHub Pages 자동 배포

## 빠른 시작

```bash
npm install
npm run dev
```

테스트와 운영 빌드:

```bash
npm test
npm run build
```

## 비공개 원고 가져오기

실제 원고는 저장소에 포함되지 않습니다. 저장소의 상위 폴더에 `웹소설/`, `등장인물/`이 있을 때 다음 명령으로 로컬 전용 데이터를 생성합니다.

```bash
npm run import:private -- ..
```

가져오기는 완성본과 초안을 회차별로 분할하고 `private/data/manifest.private.json`을 생성합니다. `private/`는 Git에서 제외됩니다. 자세한 규칙은 [데이터 관리 원칙](docs/DATA-GOVERNANCE.md)을 참고하세요.

## 기술 구성

- React + TypeScript + Vite
- 설명 가능한 한글 토큰/2-gram 검색과 규칙 기반 충돌 후보 생성
- localStorage 기반 데모 CRUD 및 검수 상태 저장
- Vitest 회귀 테스트
- GitHub Actions + GitHub Pages

현재 공개 데모는 API 키와 서버 비용 없이 동작하는 결정론적 기준선입니다. 프로덕션 확장안은 [아키텍처 문서](docs/ARCHITECTURE.md)에 정리했습니다.
