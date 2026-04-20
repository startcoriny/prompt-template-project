export type { Framework, Technique, Pattern, CategoryConfig, ComposeRequest } from '../validators/composer.validator';

export interface ComposeResult {
  prompt: string;
  meta: {
    categoryId: string;
    frameworkId?: string;
    techniqueIds: string[];
    patternIds: string[];
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
