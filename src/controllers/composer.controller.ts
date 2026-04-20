import { Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  compose,
  validateCombination,
  getAllFrameworks,
  getAllTechniques,
  getAllPatterns,
  getCategoryConfigById,
} from '../services/composer.service';
import { ComposeRequestSchema } from '../validators/composer.validator';
import { analytics } from '../services/analytics.service';

export function composePromptHandler(req: Request, res: Response): void {
  const sessionId = (req.headers['x-session-id'] as string) || 'unknown';
  try {
    const parsed = ComposeRequestSchema.parse(req.body);
    const result = compose(parsed);

    analytics.track({
      event: 'compose_prompt',
      sessionId,
      category: parsed.categoryId,
      framework: parsed.frameworkId,
      techniques: parsed.techniqueIds ?? [],
      patterns: parsed.patternIds ?? [],
      success: true,
    });

    res.json(result);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: '요청 형식이 올바르지 않습니다.', details: err.issues });
      return;
    }
    const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';

    analytics.track({
      event: 'compose_prompt',
      sessionId,
      category: req.body?.categoryId,
      framework: req.body?.frameworkId,
      techniques: req.body?.techniqueIds ?? [],
      patterns: req.body?.patternIds ?? [],
      success: false,
    });

    res.status(400).json({ error: message });
  }
}

export function getFrameworksHandler(_req: Request, res: Response): void {
  res.json(getAllFrameworks());
}

export function getTechniquesHandler(_req: Request, res: Response): void {
  res.json(getAllTechniques());
}

export function getPatternsHandler(_req: Request, res: Response): void {
  res.json(getAllPatterns());
}

export function getCategoryConfigHandler(req: Request, res: Response): void {
  const config = getCategoryConfigById(req.params['categoryId'] as string);
  if (!config) {
    res.status(404).json({ error: '카테고리 설정을 찾을 수 없습니다.' });
    return;
  }
  res.json(config);
}

export function validateCombinationHandler(req: Request, res: Response): void {
  const sessionId = (req.headers['x-session-id'] as string) || 'unknown';
  try {
    const parsed = ComposeRequestSchema.parse(req.body);
    const result = validateCombination(parsed);

    analytics.track({
      event: 'validate_combination',
      sessionId,
      category: parsed.categoryId,
      framework: parsed.frameworkId,
      techniques: parsed.techniqueIds ?? [],
      patterns: parsed.patternIds ?? [],
      success: result.valid,
    });

    res.json(result);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: '요청 형식이 올바르지 않습니다.', details: err.issues });
      return;
    }
    const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
    res.status(400).json({ error: message });
  }
}
