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
    expect(getAllTemplates('nonexistent')).toEqual([]);
  });
});

describe('getTemplateById', () => {
  it('존재하는 id로 템플릿을 반환한다', () => {
    const result = getTemplateById('coding-1');
    expect(result).toBeDefined();
    expect(result?.id).toBe('coding-1');
  });

  it('존재하지 않는 id는 undefined를 반환한다', () => {
    expect(getTemplateById('nonexistent-id')).toBeUndefined();
  });
});

describe('renderTemplate', () => {
  it('필수 변수를 입력하면 프롬프트를 반환한다', () => {
    const result = renderTemplate('coding-1', {
      variables: { language: 'TypeScript', code: 'const x = 1' },
    });
    expect(result.prompt).toContain('TypeScript');
    expect(result.prompt).toContain('const x = 1');
  });

  it('존재하지 않는 템플릿 id 요청 시 에러를 던진다', () => {
    expect(() =>
      renderTemplate('nonexistent-id', { variables: {} })
    ).toThrow('템플릿을 찾을 수 없습니다: nonexistent-id');
  });

  it('필수 변수 누락 시 label 기반 에러를 던진다', () => {
    expect(() =>
      renderTemplate('cooking-1', { variables: {} })
    ).toThrow('을(를) 입력해주세요');
  });

  it('공백 입력된 필수 변수를 누락으로 처리한다', () => {
    expect(() =>
      renderTemplate('cooking-1', { variables: { ingredients: '   ', count: '3' } })
    ).toThrow('보유 재료(ingredients)을(를) 입력해주세요');
  });

  it('optional 변수 미입력 시 {{variable}} 형태로 유지된다', () => {
    const result = renderTemplate('cooking-1', {
      variables: { ingredients: '계란', count: '3' },
    });
    expect(result.prompt).toContain('{{difficulty}}');
  });
});
