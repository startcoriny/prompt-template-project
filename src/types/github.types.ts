export type PrType = 'feat' | 'fix' | 'refactor';

export interface PrRequest {
  type: PrType;
  summary: string;
  what: string;
  why: string;
  how: string;
  changedFiles: string[];
  base?: string;  // 기본값: main
  head: string;   // 현재 브랜치명
}

export interface PrDraft {
  title: string;
  body: string;
  base: string;
  head: string;
}

export interface PrResult {
  url: string;
  number: number;
  title: string;
}
