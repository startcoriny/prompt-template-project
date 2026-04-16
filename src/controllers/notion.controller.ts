import { Request, Response } from 'express';
import { createWorkLog } from '../services/notion.service';
import type { WorkLog } from '../types/notion.types';

export async function postWorkLog(req: Request, res: Response): Promise<void> {
  const body = req.body as Partial<WorkLog>;

  if (!body.summary || !body.details) {
    res.status(400).json({ error: 'summary와 details는 필수입니다.' });
    return;
  }

  const log: WorkLog = {
    summary: body.summary,
    changedFiles: body.changedFiles ?? [],
    details: body.details,
    added: body.added ?? [],
    todos: body.todos ?? [],
  };

  try {
    const pageId = await createWorkLog(log);
    res.status(201).json({ message: 'Notion 로그가 생성되었습니다.', pageId });
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
    res.status(500).json({ error: message });
  }
}
