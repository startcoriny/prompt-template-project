export interface AnalyticsEvent {
  event: string;
  sessionId: string;
  timestamp: string;
  category?: string;
  framework?: string;
  techniques?: string[];
  patterns?: string[];
  success?: boolean;
  error?: string;
}

// 확장 시 이 인터페이스만 구현하면 됨 (CloudWatch, DB 등)
export interface IAnalyticsProvider {
  track(event: AnalyticsEvent): void;
}

// track() 호출 시 timestamp는 서비스가 주입하므로 생략 가능
export type TrackInput = Omit<AnalyticsEvent, 'timestamp'>;
