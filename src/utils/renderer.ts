/**
 * promptTemplate 문자열의 {{variable}} 를 실제 값으로 치환한다.
 * required 변수가 누락된 경우 에러를 던진다.
 */
import type { TemplateVariable } from '../types/template.types';

export function renderPrompt(
  promptTemplate: string,
  variables: TemplateVariable[],
  inputs: Record<string, string>
): string {
  const missingRequired = variables
    .filter((v) => v.required && !inputs[v.name])
    .map((v) => v.name);

  if (missingRequired.length > 0) {
    throw new Error(`필수 변수가 누락되었습니다: ${missingRequired.join(', ')}`);
  }

  return promptTemplate.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return inputs[key] ?? match;
  });
}
