import { getAllTemplates, getTemplateById, renderTemplate } from '../services/template.service';

describe('getAllTemplates', () => {
  it('전체 템플릿 목록을 반환한다', () => {
    const result = getAllTemplates();
    expect(result.length).toBeGreaterThan(0);
  });

  it('category 필터가 정상 동작한다', () => {
    const result = getAllTemplates('meeting');
    expect(result.length).toBeGreaterThan(0);
    result.forEach((t) => expect(t.categoryId).toBe('meeting'));
  });

  it('존재하지 않는 category 필터 시 빈 배열을 반환한다', () => {
    const result = getAllTemplates('nonexistent');
    expect(result).toEqual([]);
  });
});

describe('getTemplateById', () => {
  it('존재하는 id로 템플릿을 반환한다', () => {
    const result = getTemplateById('writing-blog');
    expect(result).toBeDefined();
    expect(result?.id).toBe('writing-blog');
  });

  it('존재하지 않는 id는 undefined를 반환한다', () => {
    const result = getTemplateById('nonexistent-id');
    expect(result).toBeUndefined();
  });
});

describe('renderTemplate', () => {
  it('필수 변수를 입력하면 프롬프트를 반환한다', () => {
    const result = renderTemplate('writing-blog', {
      variables: { role: '블로거', topic: 'AI 트렌드', tone: '전문적인' },
    });
    expect(result.prompt).toContain('블로거');
    expect(result.prompt).toContain('AI 트렌드');
  });

  it('존재하지 않는 템플릿 id 요청 시 에러를 던진다', () => {
    expect(() =>
      renderTemplate('nonexistent-id', { variables: {} })
    ).toThrow('템플릿을 찾을 수 없습니다: nonexistent-id');
  });
});
