import type { AnalyticsEvent, IAnalyticsProvider, TrackInput } from '../types/analytics.types';

// ── Provider 구현체 ────────────────────────────────────────────────────────
// 이후 CloudWatchProvider, DbProvider 등으로 교체 가능

class ConsoleProvider implements IAnalyticsProvider {
  track(event: AnalyticsEvent): void {
    console.log(JSON.stringify(event));
  }
}

// ── AnalyticsService ───────────────────────────────────────────────────────

class AnalyticsService {
  constructor(private readonly provider: IAnalyticsProvider = new ConsoleProvider()) {}

  track(input: TrackInput): void {
    try {
      this.provider.track({
        ...input,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // analytics 실패가 서비스 장애로 전파되지 않도록 silently 처리
    }
  }
}

export const analytics = new AnalyticsService();
