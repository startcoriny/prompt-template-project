import { Request, Response } from 'express';
import { buildPrDraft, createPr } from '../services/github.service';
import type { PrRequest } from '../types/github.types';

export function getPrDraft(req: Request, res: Response): void {
  const body = req.body as Partial<PrRequest>;

  if (!body.type || !body.summary || !body.what || !body.why || !body.how || !body.head) {
    res.status(400).json({
      error: 'type, summary, what, why, how, head는 필수입니다.',
    });
    return;
  }

  const draft = buildPrDraft(body as PrRequest);
  res.json(draft);
}

export async function submitPr(req: Request, res: Response): Promise<void> {
  const body = req.body as Partial<PrRequest>;

  if (!body.type || !body.summary || !body.what || !body.why || !body.how || !body.head) {
    res.status(400).json({
      error: 'type, summary, what, why, how, head는 필수입니다.',
    });
    return;
  }

  try {
    const result = await createPr(body as PrRequest);
    res.status(201).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
    res.status(500).json({ error: message });
  }
}
