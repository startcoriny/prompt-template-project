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

브라우저에서 `http://localhost:4000` 에 접속하면 웹 인터페이스를 사용할 수 있습니다. (`.env`의 `PORT` 값 기준)

**사용 흐름:**
1. 상단에서 카테고리 선택
2. 좌측 목록에서 템플릿 선택
3. 예시 입력값 확인 후 변수 입력
4. "프롬프트 생성" 버튼 클릭 → 완성된 프롬프트 복사

---

## API

### 카테고리 목록 조회

```
GET /categories
```

```json
[
    { "id": "writing", "name": "글쓰기", "description": "..." },
    { "id": "meeting", "name": "회의", "description": "..." }
]
```

---

### 템플릿 목록 조회

```
GET /templates
GET /templates?category=meeting
```

---

### 템플릿 단건 조회

```
GET /templates/writing-blog
```

---

### 프롬프트 생성 (변수 치환)

```
POST /templates/writing-blog/render
Content-Type: application/json

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

### 에러 응답 (필수 변수 누락)

```
POST /templates/writing-blog/render

{ "variables": {} }
```

```json
{
    "error": "필수 변수가 누락되었습니다: role, topic, tone"
}
```

---

### Notion 작업 로그 기록

```
POST /logs
Content-Type: application/json

{
  "date": "2026-04-18",
  "summary": "웹 UI 구현",
  "files": ["public/index.html", "public/style.css"],
  "changes": "카테고리/템플릿 선택 UI 및 프롬프트 생성 흐름 구현",
  "features": ["카테고리 필터", "변수 입력 폼", "복사 기능"],
  "todos": ["다크모드", "즐겨찾기"]
}
```

---

### GitHub PR 초안 생성

```
POST /prs/draft
Content-Type: application/json

{
  "title": "feat: 웹 UI 구현",
  "body": "...",
  "head": "feat/web-ui",
  "base": "main"
}
```

### GitHub PR 실제 생성

```
POST /prs
```

> PR은 항상 초안을 먼저 생성하고, 사용자 승인 후 실제 PR을 생성합니다.

---

## 프로젝트 구조

```
prompt-template-project/
├── data/
│   ├── categories.json       # 카테고리 데이터
│   └── templates.json        # 템플릿 데이터
├── public/
│   ├── index.html            # 웹 UI
│   ├── style.css             # 스타일
│   └── app.js                # 프론트엔드 로직
├── src/
│   ├── controllers/
│   │   ├── category.controller.ts
│   │   ├── template.controller.ts
│   │   ├── notion.controller.ts
│   │   └── github.controller.ts
│   ├── services/
│   │   ├── category.service.ts
│   │   ├── template.service.ts
│   │   ├── notion.service.ts
│   │   └── github.service.ts
│   ├── types/
│   │   ├── template.types.ts
│   │   ├── notion.types.ts
│   │   └── github.types.ts
│   ├── utils/
│   │   └── renderer.ts       # 변수 치환 유틸
│   ├── __tests__/
│   │   ├── renderer.test.ts
│   │   └── template.service.test.ts
│   └── app.ts
├── jest.config.js
├── tsconfig.json
└── package.json
```

## 템플릿 변수 형식

- 변수: `{{variable_name}}`
- `required: true` 인 변수 누락 시 400 에러 반환
- optional 변수는 미입력 시 `{{variable_name}}` 그대로 유지
