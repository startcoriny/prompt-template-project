import { z } from 'zod';

const TemplateVariableSchema = z.object({
  name: z.string(),
  label: z.string(),
  placeholder: z.string(),
  required: z.boolean(),
});

const TemplateSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  name: z.string(),
  description: z.string(),
  promptTemplate: z.string(),
  variables: z.array(TemplateVariableSchema),
  tags: z.array(z.string()),
  exampleInput: z.record(z.string(), z.string()),
  exampleOutput: z.string(),
  framework: z.string().optional(),
  techniques: z.array(z.string()).optional(),
  patterns: z.array(z.string()).optional(),
});

export const TemplateListSchema = z.array(TemplateSchema);

// TypeScript 타입을 zod 스키마에서 추론 — 별도 인터페이스 정의 불필요
export type TemplateVariable = z.infer<typeof TemplateVariableSchema>;
export type Template = z.infer<typeof TemplateSchema>;
