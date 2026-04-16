import { Client } from '@notionhq/client';
import type { WorkLog } from '../types/notion.types';

function getClient(): Client {
  const auth = process.env['NOTION_API_KEY'];
  if (!auth) throw new Error('NOTION_API_KEY가 설정되지 않았습니다.');
  return new Client({ auth });
}

function getPageId(): string {
  const pageId = process.env['NOTION_PAGE_ID'];
  if (!pageId) throw new Error('NOTION_PAGE_ID가 설정되지 않았습니다.');
  return pageId;
}

function heading(text: string) {
  return {
    type: 'heading_2' as const,
    heading_2: {
      rich_text: [{ type: 'text' as const, text: { content: text } }],
    },
  };
}

function paragraph(text: string) {
  return {
    type: 'paragraph' as const,
    paragraph: {
      rich_text: [{ type: 'text' as const, text: { content: text } }],
    },
  };
}

function bulletList(items: string[]) {
  return items.map((item) => ({
    type: 'bulleted_list_item' as const,
    bulleted_list_item: {
      rich_text: [{ type: 'text' as const, text: { content: item } }],
    },
  }));
}

export async function createWorkLog(log: WorkLog): Promise<string> {
  const notion = getClient();
  const parentPageId = getPageId();
  const today = new Date().toISOString().slice(0, 10);
  const title = `${today} ${log.summary}`;

  const response = await notion.pages.create({
    parent: { type: 'page_id', page_id: parentPageId },
    properties: {
      title: {
        title: [{ type: 'text', text: { content: title } }],
      },
    },
    children: [
      heading('날짜'),
      paragraph(today),

      heading('작업 요약'),
      paragraph(log.summary),

      heading('변경된 파일'),
      ...bulletList(log.changedFiles),

      heading('주요 변경 내용'),
      paragraph(log.details),

      heading('추가된 기능'),
      ...bulletList(log.added),

      heading('남은 작업 (TODO)'),
      ...bulletList(log.todos),
    ],
  });

  return response.id;
}
