export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface TemplateVariable {
  name: string;
  label: string;
  placeholder: string;
  required: boolean;
}

export interface Template {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  promptTemplate: string;
  variables: TemplateVariable[];
  tags: string[];
  exampleInput: Record<string, string>;
  exampleOutput: string;
}

export interface RenderRequest {
  variables: Record<string, string>;
}

export interface RenderResponse {
  prompt: string;
}
