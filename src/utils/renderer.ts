import type { TemplateVariable } from '../types/template.types';

export function renderPrompt(
  promptTemplate: string,
  variables: TemplateVariable[],
  inputs: Record<string, string>
): string {
  const trimmed = trimInputs(inputs);
  validateRequiredVariables(variables, trimmed);
  return substituteVariables(promptTemplate, trimmed);
}

function trimInputs(inputs: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(inputs).map(([key, value]) => [key, value.trim()])
  );
}

function validateRequiredVariables(
  variables: TemplateVariable[],
  trimmed: Record<string, string>
): void {
  const missing = variables.filter((v) => v.required && !trimmed[v.name]);

  if (missing.length > 0) {
    const messages = missing
      .map((v) => `${v.label}(${v.name})을(를) 입력해주세요`)
      .join(', ');
    throw new Error(messages);
  }
}

// 값이 없거나 빈 문자열이면 {{variable}} 그대로 유지
function substituteVariables(
  promptTemplate: string,
  trimmed: Record<string, string>
): string {
  return promptTemplate.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return trimmed[key] || match;
  });
}
