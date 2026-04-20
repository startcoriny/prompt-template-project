import { Request, Response } from 'express';
import { analytics } from '../services/analytics.service';

// 클라이언트 전송 이벤트 (select_category, update_combination, copy_prompt)를 수신
// analytics 실패가 절대 클라이언트 UX를 막으면 안 되므로 항상 204 반환
export function trackEventHandler(req: Request, res: Response): void {
  try {
    const { event, sessionId, category, framework, techniques, patterns, success } = req.body;

    if (typeof event !== 'string' || !event) {
      res.status(204).end();
      return;
    }

    analytics.track({
      event,
      sessionId: typeof sessionId === 'string' ? sessionId : 'unknown',
      category,
      framework,
      techniques,
      patterns,
      success,
    });
  } catch {
    // silently ignore
  }
  res.status(204).end();
}
