import templates from '../../data/templates.json';
import type { Template, RenderRequest, RenderResponse } from '../types/template.types';
import { renderPrompt } from '../utils/renderer';

const templateList = templates as unknown as Template[];

export function getAllTemplates(categoryId?: string): Template[] {
  if (categoryId) {
    return templateList.filter((t) => t.categoryId === categoryId);
  }
  return templateList;
}

export function getTemplateById(id: string): Template | undefined {
  return templateList.find((t) => t.id === id);
}

export function renderTemplate(id: string, body: RenderRequest): RenderResponse {
  const template = getTemplateById(id);

  if (!template) {
    throw new Error(`템플릿을 찾을 수 없습니다: ${id}`);
  }

  const prompt = renderPrompt(template.promptTemplate, template.variables, body.variables);
  return { prompt };
}
