# Prompt Template Library

상황별 AI 프롬프트 템플릿을 카테고리로 관리하고, 변수를 입력해 완성된 프롬프트를 생성하는 API 서버입니다.

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

서버 기본 포트: `http://localhost:3000`

---

## API 예시

### 카테고리 목록 조회

```bash
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

```bash
GET /templates
GET /templates?category=meeting
```

---

### 템플릿 단건 조회

```bash
GET /templates/writing-blog
```

---

### 프롬프트 생성 (변수 치환)

```bash
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
    "prompt": "당신은 전문 블로거입니다.\n생산성 향상에 대한 블로그 글을 친근하고 실용적인 톤으로 작성해주세요.\n분량은 {{length}} 정도로 작성하고, 독자가 쉽게 이해할 수 있도록 구성해주세요."
}
```

> optional 변수를 입력하지 않으면 `{{variable}}` 형태로 유지됩니다.

---

### 에러 응답 (필수 변수 누락)

```bash
POST /templates/writing-blog/render

{ "variables": {} }
```

```json
{
    "error": "필수 변수가 누락되었습니다: role, topic, tone"
}
```

---

## 프로젝트 구조

```
prompt-template-project/
├── data/
│   ├── categories.json
│   └── templates.json
├── src/
│   ├── controllers/
│   ├── services/
│   ├── types/
│   ├── utils/
│   └── app.ts
├── tsconfig.json
└── package.json
```

## 템플릿 변수 형식

- 변수: `{{variable_name}}`
- `required: true` 인 변수 누락 시 400 에러 반환
