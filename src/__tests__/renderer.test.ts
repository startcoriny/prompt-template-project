import { renderPrompt } from '../utils/renderer';
import type { TemplateVariable } from '../types/template.types';

const variables: TemplateVariable[] = [
  { name: 'role',  label: '역할', placeholder: '', required: true },
  { name: 'topic', label: '주제', placeholder: '', required: true },
  { name: 'tone',  label: '톤',   placeholder: '', required: false },
];

describe('renderPrompt', () => {
  it('필수 변수를 정상 치환한다', () => {
    const result = renderPrompt('{{role}}이 {{topic}}을 다룹니다.', variables, {
      role: '전문가',
      topic: 'AI',
    });
    expect(result).toBe('전문가이 AI을 다룹니다.');
  });

  it('optional 변수 미입력 시 {{variable}} 형태로 유지된다', () => {
    const result = renderPrompt('{{role}} / {{tone}}', variables, {
      role: '작가',
      topic: '주제',
    });
    expect(result).toBe('작가 / {{tone}}');
  });

  it('필수 변수 누락 시 에러를 던진다', () => {
    expect(() =>
      renderPrompt('{{role}} {{topic}}', variables, { role: '작가' })
    ).toThrow('필수 변수가 누락되었습니다: topic');
  });

  it('필수 변수가 여러 개 누락되면 모두 에러 메시지에 포함된다', () => {
    expect(() =>
      renderPrompt('{{role}} {{topic}}', variables, {})
    ).toThrow('role, topic');
  });
});
