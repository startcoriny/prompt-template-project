import rawFrameworks from '../../data/frameworks.json';
import rawTechniques from '../../data/techniques.json';
import rawPatterns from '../../data/patterns.json';
import rawCategoryConfigs from '../../data/category-config.json';
import {
  FrameworkListSchema,
  TechniqueListSchema,
  PatternListSchema,
  CategoryConfigListSchema,
  type Framework,
  type Technique,
  type Pattern,
  type CategoryConfig,
  type ComposeRequest,
} from '../validators/composer.validator';
import type { ComposeResult, ValidationResult } from '../types/composer.types';
import { renderPrompt } from '../utils/renderer';

const frameworks = FrameworkListSchema.parse(rawFrameworks);
const techniques = TechniqueListSchema.parse(rawTechniques);
const patterns = PatternListSchema.parse(rawPatterns);
const categoryConfigs = CategoryConfigListSchema.parse(rawCategoryConfigs);

function getFramework(id: string): Framework | undefined {
  return frameworks.find((f) => f.id === id);
}

function getTechnique(id: string): Technique | undefined {
  return techniques.find((t) => t.id === id);
}

function getPattern(id: string): Pattern | undefined {
  return patterns.find((p) => p.id === id);
}

function getCategoryConfig(id: string): CategoryConfig | undefined {
  return categoryConfigs.find((c) => c.categoryId === id);
}

export function validateCombination(req: ComposeRequest): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. category 존재 여부 — 실패 시 이후 검사 의미 없으므로 즉시 반환
  const config = getCategoryConfig(req.categoryId);
  if (!config) {
    errors.push(`카테고리를 찾을 수 없습니다: ${req.categoryId}`);
    return { valid: false, errors, warnings };
  }

  // 2. framework 검사
  if (req.frameworkId) {
    const fw = getFramework(req.frameworkId);
    if (!fw) {
      errors.push(`프레임워크를 찾을 수 없습니다: ${req.frameworkId}`);
    } else if (!fw.applicableCategories.includes(req.categoryId)) {
      errors.push(
        `프레임워크 '${fw.name}'은(는) '${req.categoryId}' 카테고리에 적용할 수 없습니다`
      );
    } else if (!config.recommendedFrameworks.includes(req.frameworkId)) {
      warnings.push(
        `프레임워크 '${fw.name}'은(는) '${req.categoryId}' 카테고리에 비권장입니다`
      );
    }
  }

  // 3. technique 검사
  const techniqueIds = req.techniqueIds ?? [];
  const uniqueTechIds = new Set(techniqueIds);

  if (uniqueTechIds.size !== techniqueIds.length) {
    errors.push('중복된 technique ID가 있습니다');
  }

  for (const techId of uniqueTechIds) {
    const tech = getTechnique(techId);
    if (!tech) {
      errors.push(`기법을 찾을 수 없습니다: ${techId}`);
    } else if (!tech.applicableCategories.includes(req.categoryId)) {
      errors.push(
        `기법 '${tech.name}'은(는) '${req.categoryId}' 카테고리에 적용할 수 없습니다`
      );
    } else if (!config.recommendedTechniques.includes(techId)) {
      warnings.push(
        `기법 '${tech.name}'은(는) '${req.categoryId}' 카테고리에 비권장입니다`
      );
    }
  }

  // 4. pattern 검사
  const patternIds = req.patternIds ?? [];
  const uniquePatIds = new Set(patternIds);

  if (uniquePatIds.size !== patternIds.length) {
    errors.push('중복된 pattern ID가 있습니다');
  }

  for (const patId of uniquePatIds) {
    const pat = getPattern(patId);
    if (!pat) {
      errors.push(`패턴을 찾을 수 없습니다: ${patId}`);
    } else if (!pat.applicableCategories.includes(req.categoryId)) {
      errors.push(
        `패턴 '${pat.name}'은(는) '${req.categoryId}' 카테고리에 적용할 수 없습니다`
      );
    } else if (!config.recommendedPatterns.includes(patId)) {
      warnings.push(
        `패턴 '${pat.name}'은(는) '${req.categoryId}' 카테고리에 비권장입니다`
      );
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function getAllFrameworks(): Framework[] {
  return frameworks;
}

export function getAllTechniques(): Technique[] {
  return techniques;
}

export function getAllPatterns(): Pattern[] {
  return patterns;
}

export function getCategoryConfigById(id: string): CategoryConfig | undefined {
  return getCategoryConfig(id);
}

// fragment 순서: role → context → framework → techniques → patterns
export function compose(req: ComposeRequest): ComposeResult {
  const validation = validateCombination(req);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }

  const config = getCategoryConfig(req.categoryId)!;
  const parts: string[] = [];

  // 1. role
  parts.push(config.baseRole);

  // 2. context (변수 치환 포함)
  const context = renderPrompt(config.baseInstruction, config.baseVariables, req.variables);
  parts.push(context);

  // 3. framework
  if (req.frameworkId) {
    const fw = getFramework(req.frameworkId)!;
    parts.push(fw.promptFragment);

    // 3-1. framework extraVariables — 입력된 값만 "추가 정보" 블록으로 추가
    if (fw.extraVariables && fw.extraVariables.length > 0 && req.frameworkVariables) {
      const lines = fw.extraVariables
        .filter((v) => req.frameworkVariables![v.name]?.trim())
        .map((v) => `- ${v.label}: ${req.frameworkVariables![v.name].trim()}`);
      if (lines.length > 0) {
        parts.push(`[추가 정보 - ${fw.name}]\n${lines.join('\n')}`);
      }
    }
  }

  // 4. techniques
  for (const techId of req.techniqueIds ?? []) {
    const tech = getTechnique(techId)!;
    parts.push(tech.promptFragment);
  }

  // 5. patterns
  for (const patId of req.patternIds ?? []) {
    const pat = getPattern(patId)!;
    parts.push(pat.promptFragment);
  }

  return {
    prompt: parts.join('\n\n'),
    meta: {
      categoryId: req.categoryId,
      frameworkId: req.frameworkId,
      techniqueIds: req.techniqueIds ?? [],
      patternIds: req.patternIds ?? [],
    },
  };
}
