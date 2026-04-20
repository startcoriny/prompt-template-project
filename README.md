# Prompt Template Library

상황별 AI 프롬프트 템플릿을 카테고리로 관리하고, 변수를 입력해 완성된 프롬프트를 생성하는 서비스입니다.
브라우저 UI와 REST API를 모두 제공합니다.

---

## 설치

```bash
npm install
```

## 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 필요한 값을 입력합니다.

| 변수                 | 필수 | 설명                            |
| -------------------- | ---- | ------------------------------- |
| `PORT`               | 선택 | 서버 포트 (기본값: 3000)        |
| `NOTION_API_KEY`     | 추후 | Notion 연동 API 키              |
| `NOTION_DATABASE_ID` | 추후 | 작업 로그를 기록할 Notion DB ID |
| `GITHUB_TOKEN`       | 추후 | PR 초안 생성용 GitHub 토큰      |
| `GITHUB_REPO`        | 추후 | 대상 저장소 (`owner/repo`)      |

> `.env` 파일은 git에 커밋되지 않습니다. `.env.example`을 참고하세요.

## 실행

```bash
# 개발 서버 (파일 변경 시 자동 재시작)
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

서버 기본 포트: `http://localhost:4000` (`.env`의 `PORT` 값에 따라 변경됩니다)

## 테스트

```bash
npm test
```

---

## Web UI

브라우저에서 `http://localhost:4000` 에 접속하면 웹 인터페이스를 사용할 수 있습니다.

두 가지 모드를 탭으로 전환하며 사용할 수 있습니다.

### 완성형 템플릿 모드

미리 작성된 템플릿에 변수를 입력해 프롬프트를 즉시 생성합니다.

1. 상단 탭에서 **완성형 템플릿** 선택
2. 카테고리 선택 (학습, 회의, 코딩, 글쓰기, 면접, 여행, 요리)
3. 좌측 목록에서 템플릿 선택
4. 예시 입력값 확인 후 변수 입력
5. **프롬프트 생성** 클릭 → 결과 복사

### 조합형 프롬프트 모드

프레임워크 + 기법 + 패턴을 자유롭게 조합해 나만의 프롬프트 구조를 만듭니다.

1. 상단 탭에서 **조합형 프롬프트** 선택
2. 카테고리 선택 → 권장 조합이 자동으로 설정됨
3. **프레임워크** 선택 (5W1H, MECE, STAR, AIDA)
   - 프레임워크 설명과 기대 효과가 표시됨
   - 5W1H·STAR 선택 시 **프레임워크 추가 입력값** 섹션이 나타남 (선택 항목)
4. **기법** / **패턴** 칩 선택 (다중 선택 가능, 권장 항목 자동 선택됨)
5. **기본 입력값** 입력 (카테고리별 필수/선택 변수)
6. 유효하지 않은 조합은 실시간으로 오류 표시
7. **프롬프트 생성** 클릭 → 결과 복사

#### 프레임워크 추가 입력값

일부 프레임워크는 세부 입력값을 추가로 받습니다. 입력한 항목만 프롬프트에 반영되며, 비워두면 자동으로 제외됩니다.

| 프레임워크 | 추가 입력값 |
|------------|------------|
| 5W1H | 누가 / 무엇을 / 언제 / 어디서 / 왜 / 어떻게 |
| STAR | 상황 / 과제 / 행동 / 결과 |

---

## API

### 카테고리

```
GET /categories
```

---

### 템플릿

```
GET /templates
GET /templates?category=meeting
GET /templates/:id
POST /templates/:id/render
```

**렌더링 요청 예시**

```json
POST /templates/writing-blog/render

{
  "variables": {
    "role": "전문 블로거",
    "topic": "생산성 향상",
    "tone": "친근하고 실용적인"
  }
}
```

**응답**

```json
{
  "prompt": "당신은 전문 블로거입니다.\n생산성 향상에 대한 블로그 글을 친근하고 실용적인 톤으로 작성해주세요."
}
```

> optional 변수를 입력하지 않으면 `{{variable}}` 형태로 유지됩니다.

---

### 조합형 프롬프트

#### 데이터 조회

```
GET /composer/frameworks       # 전체 프레임워크 목록
GET /composer/techniques       # 전체 기법 목록
GET /composer/patterns         # 전체 패턴 목록
GET /composer/config/:categoryId  # 카테고리별 권장 조합 설정
```

#### 조합 유효성 검사

```
POST /compose/validate
Content-Type: application/json
X-Session-Id: <sessionId>

{
  "categoryId": "study",
  "frameworkId": "5w1h",
  "techniqueIds": ["concept-mapping"],
  "patternIds": ["gamification"],
  "variables": { "topic": "비동기 프로그래밍" },
  "frameworkVariables": { "who": "개발자", "what": "비동기 처리 원리" }
}
```

**응답**

```json
{
  "valid": true,
  "errors": [],
  "warnings": []
}
```

#### 프롬프트 생성

```
POST /compose
Content-Type: application/json
X-Session-Id: <sessionId>
```

요청 형식은 `/compose/validate`와 동일합니다.

**응답**

```json
{
  "prompt": "당신은 학습 전문가입니다.\n\n...",
  "meta": {
    "categoryId": "study",
    "frameworkId": "5w1h",
    "techniqueIds": ["concept-mapping"],
    "patternIds": ["gamification"]
  }
}
```

**프롬프트 조립 순서:** 역할 → 상황(기본 변수) → 프레임워크 → 추가 정보 → 기법 → 패턴

---

### Analytics

사용자 행동 이벤트를 서버에 기록합니다. 항상 204를 반환하며 UX를 절대 막지 않습니다.

```
POST /analytics/track
Content-Type: application/json

{
  "event": "select_category",
  "sessionId": "...",
  "category": "study"
}
```

이벤트 종류: `select_category` / `update_combination` / `copy_prompt` / `compose_prompt` / `validate_combination`

---

### Notion 작업 로그

```
POST /logs
Content-Type: application/json

{
  "date": "2026-04-20",
  "summary": "조합형 프롬프트 시스템 구현",
  "files": ["src/services/composer.service.ts"],
  "changes": "framework/technique/pattern 조합 기반 프롬프트 생성",
  "features": ["유효성 검사", "실시간 미리보기"],
  "todos": ["즐겨찾기 기능"]
}
```

---

### GitHub PR

```
POST /prs/draft   # PR 초안 생성 (사용자 확인용)
POST /prs         # 실제 PR 생성 (승인 후)
```

---

## 프로젝트 구조

```
prompt-template-project/
├── data/
│   ├── categories.json         # 카테고리 목록
│   ├── templates.json          # 완성형 템플릿 (29개)
│   ├── frameworks.json         # 프레임워크 정의 (5W1H, MECE, STAR, AIDA)
│   ├── techniques.json         # 기법 정의
│   ├── patterns.json           # 패턴 정의
│   └── category-config.json    # 카테고리별 권장 조합 설정
├── public/
│   ├── index.html              # 웹 UI
│   ├── style.css               # 스타일
│   └── app.js                  # 프론트엔드 로직
├── src/
│   ├── controllers/
│   │   ├── category.controller.ts
│   │   ├── template.controller.ts
│   │   ├── composer.controller.ts
│   │   ├── analytics.controller.ts
│   │   ├── notion.controller.ts
│   │   └── github.controller.ts
│   ├── services/
│   │   ├── category.service.ts
│   │   ├── template.service.ts
│   │   ├── composer.service.ts
│   │   ├── analytics.service.ts
│   │   ├── notion.service.ts
│   │   └── github.service.ts
│   ├── types/
│   │   ├── template.types.ts
│   │   ├── composer.types.ts
│   │   ├── analytics.types.ts
│   │   ├── notion.types.ts
│   │   └── github.types.ts
│   ├── validators/
│   │   ├── template.validator.ts
│   │   └── composer.validator.ts
│   ├── utils/
│   │   └── renderer.ts
│   ├── __tests__/
│   │   ├── renderer.test.ts
│   │   ├── template.service.test.ts
│   │   └── composer.service.test.ts  # 25개 테스트
│   └── app.ts
├── jest.config.js
├── tsconfig.json
└── package.json
```

## 템플릿 변수 형식

- 변수: `{{variable_name}}`
- `required: true` 인 변수 누락 시 400 에러 반환
- optional 변수는 미입력 시 `{{variable_name}}` 그대로 유지
