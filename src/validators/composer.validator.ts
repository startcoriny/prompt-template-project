import { z } from 'zod';

const BaseVariableSchema = z.object({
  name: z.string(),
  label: z.string(),
  placeholder: z.string(),
  required: z.boolean(),
});

const FrameworkVariableSchema = z.object({
  name: z.string(),
  label: z.string(),
  placeholder: z.string().optional(),
});

export const FrameworkSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  effect: z.string(),
  promptFragment: z.string(),
  applicableCategories: z.array(z.string()),
  incompatibleWith: z.array(z.string()),
  extraVariables: z.array(FrameworkVariableSchema).optional(),
});

export const TechniqueSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  effect: z.string(),
  promptFragment: z.string(),
  applicableCategories: z.array(z.string()),
});

export const PatternSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  effect: z.string(),
  promptFragment: z.string(),
  applicableCategories: z.array(z.string()),
});

export const CategoryConfigSchema = z.object({
  categoryId: z.string(),
  baseRole: z.string(),
  baseInstruction: z.string(),
  baseVariables: z.array(BaseVariableSchema),
  recommendedFrameworks: z.array(z.string()),
  recommendedTechniques: z.array(z.string()),
  recommendedPatterns: z.array(z.string()),
});

export const ComposeRequestSchema = z.object({
  categoryId: z.string(),
  frameworkId: z.string().optional(),
  techniqueIds: z.array(z.string()).optional(),
  patternIds: z.array(z.string()).optional(),
  variables: z.record(z.string(), z.string()),
  frameworkVariables: z.record(z.string(), z.string()).optional(),
});

export const FrameworkListSchema = z.array(FrameworkSchema);
export const TechniqueListSchema = z.array(TechniqueSchema);
export const PatternListSchema = z.array(PatternSchema);
export const CategoryConfigListSchema = z.array(CategoryConfigSchema);

export type Framework = z.infer<typeof FrameworkSchema>;
export type FrameworkVariable = z.infer<typeof FrameworkVariableSchema>;
export type Technique = z.infer<typeof TechniqueSchema>;
export type Pattern = z.infer<typeof PatternSchema>;
export type CategoryConfig = z.infer<typeof CategoryConfigSchema>;
export type ComposeRequest = z.infer<typeof ComposeRequestSchema>;
