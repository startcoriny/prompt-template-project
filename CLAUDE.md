# 📌 Project: Prompt Template Library

이 프로젝트는 "상황별 AI 프롬프트 템플릿 라이브러리"를 구축하는 것을 목표로 한다.

사용자는 카테고리를 선택하고, 해당 상황에 맞는 프롬프트 템플릿을 선택한 뒤,
변수를 입력하여 최종 프롬프트를 생성할 수 있어야 한다.

---

# 🎯 Core Goals

- 카테고리 기반 프롬프트 템플릿 관리
- 템플릿 변수 치환 기능 제공
- 확장 가능한 구조 설계 (JSON → DB)
- 실전 활용 가능한 프롬프트 품질 유지
- 작업 자동 기록 (Notion)
- PR 초안 자동 생성 (GitHub)

---

# 🧠 Coding Principles

- MVP 중심으로 구현한다 (과한 설계 금지)
- 복잡한 아키텍처보다 이해 가능한 구조를 우선한다
- 모든 기능은 "왜 필요한지" 기준으로 추가한다
- 초보자도 이해할 수 있도록 코드 작성
- 함수는 단일 책임 원칙을 최대한 따른다

---

# 📁 Project Structure Rules

- src/: 실제 로직
- data/: JSON 기반 샘플 데이터
- templates/: 프롬프트 템플릿 정의
- utils/: 공통 함수 (예: 변수 치환)
- README.md: 실행 방법 및 설명

---

# 🧩 Prompt Template Rules

모든 템플릿은 아래 구조를 따른다.

1. 역할 (Role)
2. 상황 (Context)
3. 입력값 (Variables)
4. 제약조건 (Constraints)
5. 출력형식 (Format)

---

# 🛠 Template Processing Rules

- 변수는 {{variable}} 형태로 정의한다
- 변수 치환은 반드시 안전하게 처리한다
- 누락된 변수는 명확한 에러 메시지를 반환한다

---

# 📊 Logging (Notion Integration)

모든 작업이 끝나면 아래 형식으로 작업 로그 초안을 생성한다.

## Format

- 날짜
- 작업 요약
- 변경된 파일
- 주요 변경 내용
- 추가된 기능
- 남은 작업 (TODO)

## Rules

- 반드시 구조화된 형태로 작성한다
- 불필요한 장황한 설명 금지
- 핵심 위주로 간결하게 작성
- Notion 업로드는 사용자 승인 후 진행

---

# 🔀 GitHub PR Rules

PR 생성 시 아래 규칙을 따른다.

## PR Title

- feat: 기능 추가
- fix: 버그 수정
- refactor: 구조 개선

## PR Description

- 무엇을 변경했는지
- 왜 변경했는지
- 어떤 방식으로 구현했는지

## Rules

- PR은 자동 생성하지 않는다
- 항상 "초안"만 생성한다
- 사용자 승인 후에만 실제 PR 생성

---

# 🌿 Git Branch Rules

## Branch Base Rule

- 모든 브랜치는 main에서 생성한다
- main 브랜치에 직접 커밋하지 않는다

## Branch Naming Rule

- feat/{기능-또는-작업내용}
- fix/{버그-또는-수정내용}
- refactor/{구조-개선내용}
- chore/{기타-작업}

## Rules

- 소문자 + kebab-case 사용
- 브랜치 이름만 보고 작업 목적을 알 수 있어야 한다
- 하나의 브랜치는 하나의 작업만 담당한다

## Merge Rule

- 작업 완료 후 PR 초안 생성
- 사용자 승인 후 main으로 병합
- squash merge 사용 권장

---

# ⚠️ Safety Rules

- 자동 실행 금지 (항상 사용자 확인 필요)
- 외부 API 호출은 명확한 목적이 있을 때만 수행
- destructive action (삭제, overwrite 등)은 반드시 확인 요청

---

# 🚀 Workflow Rules

작업 흐름은 반드시 아래 순서를 따른다.

1. 요구사항 이해
2. 작업 계획 제시
3. 사용자 확인
4. 코드 작성
5. 결과 설명
6. 작업 로그 생성 (Notion용)

- 같은 날에 한 작업이라면 그 날짜에 그냥 내용 다 몰아서 생성 및 추가

7. PR 초안 생성 (GitHub용)

---

# 🧪 Development Strategy

- 작은 단위로 기능 구현
- 각 기능은 테스트 가능하게 작성
- 한 번에 많은 파일을 수정하지 않는다
- 변경 이유를 항상 설명한다

---

# 💡 Output Style

- markdown 기반으로 설명
- 코드블럭 적극 사용
- 필요 시 표 형태 사용
- 장황한 설명보다 구조화된 답변 우선

---

# 📌 Important Mindset

이 프로젝트는 단순 CRUD 서비스가 아니다.

"좋은 프롬프트를 구조화하고 재사용 가능하게 만드는 시스템"이다.

항상 아래 기준을 유지한다.

- 재사용 가능성
- 명확성
- 일관성
- 확장성

# 🧭 Architecture Direction

- Layered Architecture 사용
- Controller / Service / Data 분리
- Template 처리 로직은 Service 레이어에 위치
