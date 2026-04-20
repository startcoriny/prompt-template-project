// ── SessionId ─────────────────────────────────────────────────────────────

function getOrCreateSessionId() {
  let id = localStorage.getItem('ptl_session_id');
  if (!id) {
    id = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('ptl_session_id', id);
  }
  return id;
}

const SESSION_ID = getOrCreateSessionId();

// ── State ──────────────────────────────────────────────────────────────────

let currentMode = 'template';   // 'template' | 'composer'
let currentTemplate = null;
let composerCategoryId = null;
let composerConfig = null;      // CategoryConfig from server
let allFrameworks = [];
let allTechniques = [];
let allPatterns = [];
let notificationTimer = null;
let previewDebounce = null;
let isComposing = false;        // 더블클릭 방지

// ── DOM refs ───────────────────────────────────────────────────────────────

// 공유
const categoryList      = document.getElementById('category-list');
const contentArea       = document.getElementById('content-area');
const emptyState        = document.getElementById('empty-state');
const notificationArea  = document.getElementById('notification-area');
const notificationMsg   = document.getElementById('notification-message');
const notificationClose = document.getElementById('notification-close');

// 완성형 모드
const templateListEl    = document.getElementById('template-list');
const templateInfo      = document.getElementById('template-info');
const templateName      = document.getElementById('template-name');
const templateDesc      = document.getElementById('template-description');
const templateTags      = document.getElementById('template-tags');
const exampleInputEl    = document.getElementById('example-input');
const exampleOutputEl   = document.getElementById('example-output');
const formSection       = document.getElementById('form-section');
const variableForm      = document.getElementById('variable-form');
const resultSection     = document.getElementById('result-section');
const promptOutput      = document.getElementById('prompt-output');
const promptText        = document.getElementById('prompt-text');
const btnFillExample    = document.getElementById('btn-fill-example');
const btnReset          = document.getElementById('btn-reset');
const btnGenerate       = document.getElementById('btn-generate');
const btnCopy           = document.getElementById('btn-copy');
const copyFeedback      = document.getElementById('copy-feedback');

// 조합형 모드
const composerPanel             = document.getElementById('composer-panel');
const composerFrameworkEl       = document.getElementById('composer-framework');
const composerFrameworkDesc     = document.getElementById('composer-framework-desc');
const composerTechniquesEl      = document.getElementById('composer-techniques');
const composerPatternsEl        = document.getElementById('composer-patterns');
const composerValidationEl      = document.getElementById('composer-validation');
const composerFrameworkVarsEl   = document.getElementById('composer-framework-vars');
const composerFrameworkVarForm  = document.getElementById('composer-framework-var-form');
const composerFormSection       = document.getElementById('composer-form-section');
const composerVariableForm      = document.getElementById('composer-variable-form');
const composerResultSection = document.getElementById('composer-result-section');
const composerHint          = document.getElementById('composer-hint');
const composerPromptOutput  = document.getElementById('composer-prompt-output');
const composerPromptText    = document.getElementById('composer-prompt-text');
const btnCompose            = document.getElementById('btn-compose');
const btnComposeCopy        = document.getElementById('btn-compose-copy');
const composerCopyFeedback  = document.getElementById('composer-copy-feedback');

// ── 알림 ───────────────────────────────────────────────────────────────────

function showNotification(message, type = 'error') {
  clearTimeout(notificationTimer);
  notificationMsg.textContent = message;
  notificationArea.className = `notification notification-${type}`;
  notificationArea.classList.remove('hidden');
  notificationArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  const delay = type === 'error' ? 6000 : 3000;
  notificationTimer = setTimeout(hideNotification, delay);
}

function hideNotification() {
  notificationArea.classList.add('hidden');
}

notificationClose.addEventListener('click', hideNotification);

// ── 필드 에러 (완성형) ─────────────────────────────────────────────────────

function clearFieldErrors() {
  variableForm.querySelectorAll('.field-error-msg').forEach((el) => { el.textContent = ''; });
  variableForm.querySelectorAll('.input-error').forEach((el) => el.classList.remove('input-error'));
}

function setFieldError(name, message) {
  const input = variableForm.querySelector(`[name="${name}"]`);
  if (!input) return;
  input.classList.add('input-error');
  const errEl = input.closest('.form-field')?.querySelector('.field-error-msg');
  if (errEl) errEl.textContent = message;
}

// ── 필드 에러 (조합형) ─────────────────────────────────────────────────────

function clearComposerFieldErrors() {
  composerVariableForm.querySelectorAll('.field-error-msg').forEach((el) => { el.textContent = ''; });
  composerVariableForm.querySelectorAll('.input-error').forEach((el) => el.classList.remove('input-error'));
}

function setComposerFieldError(name, message) {
  const input = composerVariableForm.querySelector(`[name="${name}"]`);
  if (!input) return;
  input.classList.add('input-error');
  const errEl = input.closest('.form-field')?.querySelector('.field-error-msg');
  if (errEl) errEl.textContent = message;
}

// ── 로딩 상태 ─────────────────────────────────────────────────────────────

function setGenerateLoading(loading) {
  btnGenerate.disabled = loading;
  btnGenerate.textContent = loading ? '생성 중...' : '프롬프트 생성';
}

// ── API ────────────────────────────────────────────────────────────────────

async function fetchCategories() {
  const res = await fetch('/categories');
  if (!res.ok) throw new Error(`카테고리를 불러오지 못했습니다. (${res.status})`);
  return res.json();
}

async function fetchTemplates(categoryId) {
  const res = await fetch(`/templates?category=${categoryId}`);
  if (!res.ok) throw new Error(`템플릿 목록을 불러오지 못했습니다. (${res.status})`);
  return res.json();
}

async function renderPromptApi(templateId, variables) {
  const res = await fetch(`/templates/${templateId}/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variables }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `서버 오류가 발생했습니다. (${res.status})`);
  return data;
}

async function fetchAllComposerData() {
  const [fws, techs, pats] = await Promise.all([
    fetch('/composer/frameworks').then((r) => r.json()),
    fetch('/composer/techniques').then((r) => r.json()),
    fetch('/composer/patterns').then((r) => r.json()),
  ]);
  allFrameworks = fws;
  allTechniques = techs;
  allPatterns = pats;
}

async function fetchComposerConfig(categoryId) {
  const res = await fetch(`/composer/config/${categoryId}`);
  if (!res.ok) throw new Error(`조합 설정을 불러오지 못했습니다. (${res.status})`);
  return res.json();
}

async function validateCompose(body) {
  const res = await fetch('/compose/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Session-Id': SESSION_ID },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `서버 오류 (${res.status})`);
  return data;
}

async function composePrompt(body) {
  const res = await fetch('/compose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Session-Id': SESSION_ID },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `서버 오류 (${res.status})`);
  return data;
}

// analytics 실패는 UX에 영향 없도록 fire-and-forget
function trackEvent(payload) {
  fetch('/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, sessionId: SESSION_ID }),
  }).catch(() => {});
}

// ── 완성형: 렌더링 ─────────────────────────────────────────────────────────

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
  templateName.textContent = template.name;
  templateDesc.textContent = template.description;
  templateTags.innerHTML = template.tags.map((tag) => `<span class="tag">${tag}</span>`).join('');
  const inputLines = Object.entries(template.exampleInput).map(([k, v]) => `${k}: ${v}`).join('\n');
  exampleInputEl.textContent = inputLines;
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
    input.addEventListener('input', () => {
      input.classList.remove('input-error');
      const errEl = field.querySelector('.field-error-msg');
      if (errEl) errEl.textContent = '';
    });
    const errMsg = document.createElement('span');
    errMsg.className = 'field-error-msg';
    field.appendChild(label);
    field.appendChild(input);
    field.appendChild(errMsg);
    variableForm.appendChild(field);
  });
  formSection.classList.remove('hidden');
  resultSection.classList.remove('hidden');
  promptOutput.classList.add('hidden');
  promptText.textContent = '';
}

// ── 완성형: 이벤트 ─────────────────────────────────────────────────────────

function onTemplateClick(template, li) {
  document.querySelectorAll('#template-list li').forEach((el) => el.classList.remove('active'));
  li.classList.add('active');
  currentTemplate = template;
  renderTemplateDetail(template);
  renderVariableForm(template);
  hideNotification();
  copyFeedback.classList.add('hidden');
}

btnFillExample.addEventListener('click', () => {
  if (!currentTemplate) return;
  clearFieldErrors();
  variableForm.querySelectorAll('input, textarea').forEach((input) => {
    const value = currentTemplate.exampleInput[input.name];
    if (value !== undefined) input.value = value;
  });
});

btnReset.addEventListener('click', () => {
  variableForm.reset();
  clearFieldErrors();
  promptOutput.classList.add('hidden');
  promptText.textContent = '';
  copyFeedback.classList.add('hidden');
  hideNotification();
});

btnGenerate.addEventListener('click', async () => {
  if (!currentTemplate) return;
  clearFieldErrors();
  hideNotification();

  const inputs = variableForm.querySelectorAll('input, textarea');
  const variables = {};
  const missingFields = [];

  inputs.forEach((input) => {
    const variable = currentTemplate.variables.find((v) => v.name === input.name);
    const trimmed = input.value.trim();
    if (variable?.required && !trimmed) {
      missingFields.push(variable.name);
      setFieldError(variable.name, `${variable.label}은(는) 필수 입력값입니다.`);
    }
    variables[input.name] = trimmed;
  });

  if (missingFields.length > 0) {
    showNotification('필수 입력값을 모두 채워주세요. 빨간 표시 항목을 확인하세요.');
    variableForm.querySelector('.input-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  setGenerateLoading(true);
  try {
    const result = await renderPromptApi(currentTemplate.id, variables);
    promptText.textContent = result.prompt;
    promptOutput.classList.remove('hidden');
    copyFeedback.classList.add('hidden');
    showNotification('프롬프트가 생성됐습니다.', 'success');
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    resultSection.classList.add('result-highlight');
    setTimeout(() => resultSection.classList.remove('result-highlight'), 1000);
  } catch (err) {
    showNotification(err.message);
  } finally {
    setGenerateLoading(false);
  }
});

btnCopy.addEventListener('click', async () => {
  const text = promptText.textContent;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    btnCopy.textContent = '복사 완료 ✓';
    btnCopy.classList.add('btn-copied');
    copyFeedback.classList.remove('hidden');
    clearTimeout(btnCopy._copyTimer);
    btnCopy._copyTimer = setTimeout(() => {
      btnCopy.textContent = '복사하기';
      btnCopy.classList.remove('btn-copied');
      copyFeedback.classList.add('hidden');
    }, 2000);
  } catch {
    showNotification('클립보드 복사에 실패했습니다. 텍스트를 직접 선택해 복사해주세요.');
  }
});

// ── 조합형: 렌더링 ─────────────────────────────────────────────────────────

function renderComposerFrameworks(config) {
  composerFrameworkEl.innerHTML = '<option value="">선택 안함</option>';

  const applicable = allFrameworks.filter((fw) => fw.applicableCategories.includes(config.categoryId));
  applicable.forEach((fw) => {
    const isRecommended = config.recommendedFrameworks.includes(fw.id);
    const opt = document.createElement('option');
    opt.value = fw.id;
    opt.textContent = isRecommended ? `${fw.name} ★` : fw.name;
    composerFrameworkEl.appendChild(opt);
  });

  // 첫 번째 권장 프레임워크 자동 선택
  const firstRec = applicable.find((fw) => config.recommendedFrameworks.includes(fw.id));
  if (firstRec) {
    composerFrameworkEl.value = firstRec.id;
    composerFrameworkDesc.innerHTML = firstRec.description
      + (firstRec.effect ? ` <span class="desc-effect">${firstRec.effect}</span>` : '');
    renderFrameworkVars(firstRec);
  } else {
    composerFrameworkEl.value = '';
    composerFrameworkDesc.textContent = '';
    renderFrameworkVars(null);
  }
}

function renderComposerChips(container, allItems, categoryId, recommendedIds) {
  container.innerHTML = '';
  const applicable = allItems.filter((item) => item.applicableCategories.includes(categoryId));

  if (applicable.length === 0) {
    container.innerHTML = '<p class="no-options">이 카테고리에 적용 가능한 항목이 없습니다.</p>';
    return;
  }

  applicable.forEach((item) => {
    const isRecommended = recommendedIds.includes(item.id);
    const wrapper = document.createElement('div');
    wrapper.className = 'chip-item';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `chip${isRecommended ? ' selected' : ''}`;
    btn.dataset.id = item.id;
    if (item.effect) btn.dataset.effect = item.effect;
    btn.innerHTML = `${item.name}${isRecommended ? '<span class="chip-recommended">권장</span>' : ''}`;
    btn.addEventListener('click', () => {
      btn.classList.toggle('selected');
      schedulePreview('combination');
    });

    const desc = document.createElement('p');
    desc.className = 'chip-desc';
    desc.textContent = item.description ?? '';

    wrapper.appendChild(btn);
    wrapper.appendChild(desc);
    container.appendChild(wrapper);
  });
}

function renderFrameworkVars(fw) {
  composerFrameworkVarForm.innerHTML = '';
  if (!fw || !fw.extraVariables || fw.extraVariables.length === 0) {
    composerFrameworkVarsEl.classList.add('hidden');
    return;
  }

  fw.extraVariables.forEach((v) => {
    const field = document.createElement('div');
    field.className = 'form-field';
    const label = document.createElement('label');
    label.innerHTML = `${v.label}<span class="optional">(선택)</span>`;
    const input = Object.assign(document.createElement('input'), {
      type: 'text',
      name: v.name,
      placeholder: v.placeholder ?? '',
    });
    input.addEventListener('input', () => schedulePreview('combination'));
    field.appendChild(label);
    field.appendChild(input);
    composerFrameworkVarForm.appendChild(field);
  });

  composerFrameworkVarsEl.classList.remove('hidden');
}

function renderComposerVariableForm(baseVariables) {
  composerVariableForm.innerHTML = '';
  baseVariables.forEach((v) => {
    const field = document.createElement('div');
    field.className = 'form-field';
    const label = document.createElement('label');
    label.innerHTML = `${v.label}${v.required
      ? '<span class="required">*</span>'
      : '<span class="optional">(선택)</span>'}`;
    const input = Object.assign(document.createElement('input'), {
      type: 'text',
      name: v.name,
      placeholder: v.placeholder,
    });
    input.addEventListener('input', () => {
      input.classList.remove('input-error');
      const errEl = field.querySelector('.field-error-msg');
      if (errEl) errEl.textContent = '';
      schedulePreview('variable');
    });
    const errMsg = document.createElement('span');
    errMsg.className = 'field-error-msg';
    field.appendChild(label);
    field.appendChild(input);
    field.appendChild(errMsg);
    composerVariableForm.appendChild(field);
  });
  composerFormSection.classList.remove('hidden');
}

function renderValidationStatus(validation) {
  if (validation.errors.length === 0 && validation.warnings.length === 0) {
    composerValidationEl.classList.add('hidden');
    return;
  }
  composerValidationEl.classList.remove('hidden');

  if (validation.errors.length > 0) {
    composerValidationEl.className = 'composer-validation has-errors';
    composerValidationEl.innerHTML = `
      <p class="validation-title">조합 오류</p>
      <ul class="validation-list">
        ${validation.errors.map((e) => `<li>${e}</li>`).join('')}
      </ul>`;
  } else {
    composerValidationEl.className = 'composer-validation has-warnings';
    composerValidationEl.innerHTML = `
      <p class="validation-title">권장 사항</p>
      <ul class="validation-list">
        ${validation.warnings.map((w) => `<li>${w}</li>`).join('')}
      </ul>`;
  }
}

// ── 조합형: 상태 수집 ──────────────────────────────────────────────────────

function buildComposerRequest() {
  const frameworkId = composerFrameworkEl.value || undefined;
  const techniqueIds = [...composerTechniquesEl.querySelectorAll('.chip.selected')].map((el) => el.dataset.id);
  const patternIds = [...composerPatternsEl.querySelectorAll('.chip.selected')].map((el) => el.dataset.id);
  const variables = {};
  composerVariableForm.querySelectorAll('input, textarea').forEach((input) => {
    if (input.name) variables[input.name] = input.value;
  });
  const frameworkVariables = {};
  composerFrameworkVarForm.querySelectorAll('input').forEach((input) => {
    if (input.name) frameworkVariables[input.name] = input.value;
  });
  return {
    categoryId: composerCategoryId,
    frameworkId,
    techniqueIds,
    patternIds,
    variables,
    frameworkVariables: Object.keys(frameworkVariables).length > 0 ? frameworkVariables : undefined,
  };
}

function getMissingRequiredVars() {
  if (!composerConfig) return [];
  return composerConfig.baseVariables
    .filter((v) => v.required)
    .filter((v) => {
      const input = composerVariableForm.querySelector(`[name="${v.name}"]`);
      return !input || !input.value.trim();
    })
    .map((v) => v.name);
}

// ── 조합형: 미리보기 업데이트 ─────────────────────────────────────────────

// showErrors=false: 자동 미리보기 (에러 표시 없이 조용히)
// showErrors=true : 버튼 클릭 (필수 변수 에러 표시 + 성공 알림)
async function runPreview(showErrors = false, source = 'variable') {
  if (!composerCategoryId) return;
  const body = buildComposerRequest();

  // Step 1: 조합 유효성 검사
  let validation;
  try {
    validation = await validateCompose(body);
  } catch {
    if (showErrors) showNotification('서버 연결에 실패했습니다.');
    return;
  }

  renderValidationStatus(validation);

  if (!validation.valid) {
    btnCompose.disabled = true;
    composerPromptOutput.classList.add('hidden');
    composerHint.textContent = '유효하지 않은 조합입니다.';
    composerHint.classList.remove('hidden');
    return;
  }

  // Step 2: 필수 변수 검사 (버튼 클릭 시만)
  if (showErrors) {
    const missing = getMissingRequiredVars();
    if (missing.length > 0) {
      missing.forEach((name) => {
        const v = composerConfig.baseVariables.find((vv) => vv.name === name);
        if (v) setComposerFieldError(name, `${v.label}은(는) 필수 입력값입니다.`);
      });
      showNotification('필수 입력값을 모두 채워주세요. 빨간 표시 항목을 확인하세요.');
      composerVariableForm.querySelector('.input-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      btnCompose.disabled = false;
      return;
    }
  }

  // Step 3: 프롬프트 생성 (미리보기)
  try {
    const result = await composePrompt(body);
    composerHint.classList.add('hidden');
    composerPromptText.textContent = result.prompt;
    composerPromptOutput.classList.remove('hidden');
    composerCopyFeedback.classList.add('hidden');
    btnCompose.disabled = false;

    if (source === 'combination') {
      trackEvent({
        event: 'update_combination',
        category: composerCategoryId,
        framework: body.frameworkId,
        techniques: body.techniqueIds,
        patterns: body.patternIds,
      });
    }

    if (showErrors) {
      showNotification('프롬프트가 생성됐습니다.', 'success');
      composerResultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      composerResultSection.classList.add('result-highlight');
      setTimeout(() => composerResultSection.classList.remove('result-highlight'), 1000);
    }
  } catch {
    // 필수 변수 누락 등 서버 에러 → 미리보기 힌트로 처리
    composerPromptOutput.classList.add('hidden');
    composerHint.textContent = '변수를 입력하면 미리보기가 표시됩니다.';
    composerHint.classList.remove('hidden');
    btnCompose.disabled = false;
    if (showErrors) showNotification('필수 변수를 입력해주세요.');
  }
}

function schedulePreview(source = 'variable') {
  clearTimeout(previewDebounce);
  previewDebounce = setTimeout(() => runPreview(false, source), 450);
}

// ── 조합형: 카테고리 로드 ─────────────────────────────────────────────────

async function loadComposerForCategory(categoryId) {
  composerCategoryId = categoryId;

  try {
    composerConfig = await fetchComposerConfig(categoryId);
  } catch (err) {
    showNotification(err.message);
    return;
  }

  renderComposerFrameworks(composerConfig);
  renderComposerChips(composerTechniquesEl, allTechniques, categoryId, composerConfig.recommendedTechniques);
  renderComposerChips(composerPatternsEl, allPatterns, categoryId, composerConfig.recommendedPatterns);
  renderComposerVariableForm(composerConfig.baseVariables);

  composerResultSection.classList.remove('hidden');
  composerValidationEl.classList.add('hidden');
  composerPromptOutput.classList.add('hidden');
  composerHint.textContent = '변수를 입력하면 미리보기가 표시됩니다.';
  composerHint.classList.remove('hidden');
  btnCompose.disabled = false;

  schedulePreview();
}

// ── 조합형: 이벤트 ─────────────────────────────────────────────────────────

composerFrameworkEl.addEventListener('change', () => {
  const fw = allFrameworks.find((f) => f.id === composerFrameworkEl.value);
  if (fw) {
    composerFrameworkDesc.innerHTML = fw.description
      + (fw.effect ? ` <span class="desc-effect">${fw.effect}</span>` : '');
  } else {
    composerFrameworkDesc.textContent = '';
  }
  renderFrameworkVars(fw ?? null);
  schedulePreview('combination');
});

btnCompose.addEventListener('click', async () => {
  if (isComposing) return;
  clearComposerFieldErrors();
  hideNotification();

  isComposing = true;
  const originalText = btnCompose.textContent;
  btnCompose.textContent = '생성 중...';
  btnCompose.disabled = true;

  try {
    await runPreview(true);
  } finally {
    isComposing = false;
    btnCompose.textContent = originalText;
    // disabled 상태는 runPreview 내부에서 최종 설정됨
  }
});

btnComposeCopy.addEventListener('click', async () => {
  const text = composerPromptText.textContent;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    const body = buildComposerRequest();
    trackEvent({
      event: 'copy_prompt',
      category: composerCategoryId,
      framework: body.frameworkId,
      techniques: body.techniqueIds,
      patterns: body.patternIds,
    });
    btnComposeCopy.textContent = '복사 완료 ✓';
    btnComposeCopy.classList.add('btn-copied');
    composerCopyFeedback.classList.remove('hidden');
    clearTimeout(btnComposeCopy._copyTimer);
    btnComposeCopy._copyTimer = setTimeout(() => {
      btnComposeCopy.textContent = '복사하기';
      btnComposeCopy.classList.remove('btn-copied');
      composerCopyFeedback.classList.add('hidden');
    }, 2000);
  } catch {
    showNotification('클립보드 복사에 실패했습니다. 텍스트를 직접 선택해 복사해주세요.');
  }
});

// ── 모드 전환 ──────────────────────────────────────────────────────────────

document.querySelectorAll('.mode-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const mode = tab.dataset.mode;
    if (mode === currentMode) return;
    switchMode(mode);
  });
});

async function switchMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.mode-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.mode === mode);
  });
  hideNotification();

  const activeCategoryId = document.querySelector('.category-btn.active')?.dataset.id;

  if (mode === 'template') {
    composerPanel.classList.add('hidden');
    if (activeCategoryId) {
      contentArea.classList.remove('hidden');
      emptyState.classList.add('hidden');
    } else {
      emptyState.classList.remove('hidden');
    }
  } else {
    contentArea.classList.add('hidden');
    emptyState.classList.add('hidden');
    composerPanel.classList.remove('hidden');

    // 카테고리가 선택돼 있고 컴포저에 아직 로드 안 된 경우 로드
    if (activeCategoryId && composerCategoryId !== activeCategoryId) {
      await loadComposerForCategory(activeCategoryId);
    }
  }
}

// ── 카테고리 클릭 (공유) ───────────────────────────────────────────────────

async function onCategoryClick(categoryId, btn) {
  document.querySelectorAll('.category-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  hideNotification();
  emptyState.classList.add('hidden');
  trackEvent({ event: 'select_category', category: categoryId });

  if (currentMode === 'template') {
    try {
      const templates = await fetchTemplates(categoryId);
      renderTemplateList(templates);
      templateInfo.classList.add('hidden');
      formSection.classList.add('hidden');
      resultSection.classList.add('hidden');
      currentTemplate = null;
      contentArea.classList.remove('hidden');

      if (templates.length > 0) {
        const firstLi = templateListEl.querySelector('li');
        onTemplateClick(templates[0], firstLi);
      }
    } catch (err) {
      showNotification(err.message);
    }
  } else {
    await loadComposerForCategory(categoryId);
  }
}

// ── 초기 로드 ──────────────────────────────────────────────────────────────

(async () => {
  try {
    const [categories] = await Promise.all([
      fetchCategories(),
      fetchAllComposerData(),
    ]);
    renderCategories(categories);
  } catch (err) {
    showNotification(err.message);
  }
})();
