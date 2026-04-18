// Template, TemplateVariable 타입은 zod 스키마에서 추론
// 단일 소스로 관리해 타입-스키마 불일치 방지
export type { Template, TemplateVariable } from '../validators/template.validator';

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface RenderRequest {
  variables: Record<string, string>;
}

export interface RenderResponse {
  prompt: string;
}
