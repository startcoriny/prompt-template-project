// 상태
let currentTemplate = null;

// DOM
const categoryList     = document.getElementById('category-list');
const contentArea      = document.getElementById('content-area');
const emptyState       = document.getElementById('empty-state');
const templateListEl   = document.getElementById('template-list');
const templateInfo     = document.getElementById('template-info');
const templateName     = document.getElementById('template-name');
const templateDesc     = document.getElementById('template-description');
const templateTags     = document.getElementById('template-tags');
const exampleInputEl   = document.getElementById('example-input');
const exampleOutputEl  = document.getElementById('example-output');
const formSection      = document.getElementById('form-section');
const variableForm     = document.getElementById('variable-form');
const resultSection    = document.getElementById('result-section');
const promptOutput     = document.getElementById('prompt-output');
const promptText       = document.getElementById('prompt-text');
const btnFillExample   = document.getElementById('btn-fill-example');
const btnReset         = document.getElementById('btn-reset');
const btnGenerate      = document.getElementById('btn-generate');
const btnCopy          = document.getElementById('btn-copy');
const copyFeedback     = document.getElementById('copy-feedback');

// ── API 호출 ──────────────────────────────────────

async function fetchCategories() {
  const res = await fetch('/categories');
  return res.json();
}

async function fetchTemplates(categoryId) {
  const res = await fetch(`/templates?category=${categoryId}`);
  return res.json();
}

async function renderPrompt(templateId, variables) {
  const res = await fetch(`/templates/${templateId}/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variables }),
  });
  return res.json();
}

// ── 렌더링 ──────────────────────────────────────

function renderCategories(categories) {
  categoryList.innerHTML = '';
  categories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.className = 'category-btn';
    btn.textContent = cat.name;
    btn.dataset.id = cat.id;
    btn.addEventListener('click', () => onCategoryClick(cat.id, btn));
    categoryList.appendChild(btn);
  });
}

function renderTemplateList(templates) {
  templateListEl.innerHTML = '';
  templates.forEach((t) => {
    const li = document.createElement('li');
    li.dataset.id = t.id;
    li.innerHTML = `
      <span class="tpl-name">${t.name}</span>
      <span class="tpl-desc">${t.description ?? ''}</span>
    `;
    li.addEventListener('click', () => onTemplateClick(t, li));
    templateListEl.appendChild(li);
  });
}

function renderTemplateDetail(template) {
  // 기본 정보
  templateName.textContent = template.name;
  templateDesc.textContent = template.description;

  // 태그
  templateTags.innerHTML = template.tags
    .map((tag) => `<span class="tag">${tag}</span>`)
    .join('');

  // 예시 입력값
  const inputLines = Object.entries(template.exampleInput)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  exampleInputEl.textContent = inputLines;

  // 예시 출력
  exampleOutputEl.textContent = template.exampleOutput;

  templateInfo.classList.remove('hidden');
}

function renderVariableForm(template) {
  variableForm.innerHTML = '';

  template.variables.forEach((v) => {
    const isCode = v.name === 'code' || v.name === 'error' || v.name === 'answer';

    const field = document.createElement('div');
    field.className = 'form-field';

    const label = document.createElement('label');
    label.innerHTML = `${v.label}${v.required
      ? '<span class="required">*</span>'
      : '<span class="optional">(선택)</span>'}`;

    const input = isCode
      ? Object.assign(document.createElement('textarea'), { rows: 4, name: v.name, placeholder: v.placeholder })
      : Object.assign(document.createElement('input'), { type: 'text', name: v.name, placeholder: v.placeholder });

    field.appendChild(label);
    field.appendChild(input);
    variableForm.appendChild(field);
  });

  formSection.classList.remove('hidden');
  resultSection.classList.remove('hidden');
  promptOutput.classList.add('hidden');
  promptText.textContent = '';
}

// ── 이벤트 핸들러 ──────────────────────────────────────

async function onCategoryClick(categoryId, btn) {
  // 버튼 활성화
  document.querySelectorAll('.category-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');

  // 템플릿 목록 불러오기
  const templates = await fetchTemplates(categoryId);
  renderTemplateList(templates);

  // 상세 초기화
  templateInfo.classList.add('hidden');
  formSection.classList.add('hidden');
  resultSection.classList.add('hidden');
  currentTemplate = null;

  // 레이아웃 전환
  contentArea.classList.remove('hidden');
  emptyState.classList.add('hidden');

  // 목록 첫 항목 자동 선택
  if (templates.length > 0) {
    const firstLi = templateListEl.querySelector('li');
    onTemplateClick(templates[0], firstLi);
  }
}

function onTemplateClick(template, li) {
  document.querySelectorAll('#template-list li').forEach((el) => el.classList.remove('active'));
  li.classList.add('active');

  currentTemplate = template;
  renderTemplateDetail(template);
  renderVariableForm(template);
  copyFeedback.classList.add('hidden');
}

btnFillExample.addEventListener('click', () => {
  if (!currentTemplate) return;
  const inputs = variableForm.querySelectorAll('input, textarea');
  inputs.forEach((input) => {
    const value = currentTemplate.exampleInput[input.name];
    if (value !== undefined) input.value = value;
  });
});

btnReset.addEventListener('click', () => {
  variableForm.reset();
  promptOutput.classList.add('hidden');
  promptText.textContent = '';
  copyFeedback.classList.add('hidden');
});

btnGenerate.addEventListener('click', async () => {
  if (!currentTemplate) return;

  const inputs = variableForm.querySelectorAll('input, textarea');
  const variables = {};
  let missingRequired = [];

  inputs.forEach((input) => {
    const variable = currentTemplate.variables.find((v) => v.name === input.name);
    if (variable?.required && !input.value.trim()) {
      missingRequired.push(variable.label);
    }
    variables[input.name] = input.value.trim();
  });

  if (missingRequired.length > 0) {
    alert(`필수 입력값을 채워주세요:\n${missingRequired.join(', ')}`);
    return;
  }

  const result = await renderPrompt(currentTemplate.id, variables);

  if (result.error) {
    alert(`오류: ${result.error}`);
    return;
  }

  promptText.textContent = result.prompt;
  promptOutput.classList.remove('hidden');
  copyFeedback.classList.add('hidden');

  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  resultSection.classList.add('result-highlight');
  setTimeout(() => resultSection.classList.remove('result-highlight'), 1000);
});

btnCopy.addEventListener('click', async () => {
  const text = promptText.textContent;
  if (!text) return;
  await navigator.clipboard.writeText(text);
  btnCopy.textContent = '복사 완료 ✓';
  btnCopy.classList.add('btn-copied');
  copyFeedback.classList.remove('hidden');
  setTimeout(() => {
    btnCopy.textContent = '복사하기';
    btnCopy.classList.remove('btn-copied');
    copyFeedback.classList.add('hidden');
  }, 2000);
});

// ── 초기 로드 ──────────────────────────────────────

(async () => {
  const categories = await fetchCategories();
  renderCategories(categories);
})();
