import { Request, Response } from 'express';
import { getAllTemplates, getTemplateById, renderTemplate } from '../services/template.service';

export function getTemplates(req: Request, res: Response): void {
  const category = req.query['category'] as string | undefined;
  const templates = getAllTemplates(category);
  res.json(templates);
}

export function getTemplateByIdHandler(req: Request, res: Response): void {
  const template = getTemplateById(req.params['id'] as string);

  if (!template) {
    res.status(404).json({ error: '템플릿을 찾을 수 없습니다.' });
    return;
  }

  res.json(template);
}

export function renderTemplateHandler(req: Request, res: Response): void {
  try {
    const result = renderTemplate(req.params['id'] as string, req.body);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
    res.status(400).json({ error: message });
  }
}
