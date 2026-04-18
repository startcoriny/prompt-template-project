import { renderPrompt } from '../utils/renderer';
import type { TemplateVariable } from '../types/template.types';

const variables: TemplateVariable[] = [
  { name: 'ingredients', label: '보유 재료', placeholder: '', required: true },
  { name: 'count',       label: '추천 개수', placeholder: '', required: true },
  { name: 'difficulty',  label: '난이도',    placeholder: '', required: false },
];

describe('renderPrompt - 정상 치환', () => {
  it('필수 변수를 정상 치환한다', () => {
    const result = renderPrompt(
      '{{ingredients}}로 {{count}}가지 요리를 추천해줘.',
      variables,
      { ingredients: '계란, 양파', count: '3' }
    );
    expect(result).toBe('계란, 양파로 3가지 요리를 추천해줘.');
  });

  it('optional 변수 미입력 시 {{variable}} 형태로 유지된다', () => {
    const result = renderPrompt(
      '{{ingredients}} / {{difficulty}}',
      variables,
      { ingredients: '계란', count: '2' }
    );
    expect(result).toBe('계란 / {{difficulty}}');
  });

  it('optional 변수에 빈 문자열 입력 시 {{variable}} 형태로 유지된다', () => {
    const result = renderPrompt(
      '{{ingredients}} / {{difficulty}}',
      variables,
      { ingredients: '계란', count: '2', difficulty: '' }
    );
    expect(result).toBe('계란 / {{difficulty}}');
  });

  it('템플릿에 정의되지 않은 변수는 {{variable}} 그대로 유지된다', () => {
    const result = renderPrompt(
      '{{ingredients}} {{unknown}}',
      variables,
      { ingredients: '계란', count: '1' }
    );
    expect(result).toBe('계란 {{unknown}}');
  });
});

describe('renderPrompt - trim 처리', () => {
  it('입력값 앞뒤 공백을 제거하고 치환한다', () => {
    const result = renderPrompt(
      '{{ingredients}}로 만들기',
      variables,
      { ingredients: '  계란  ', count: '2' }
    );
    expect(result).toBe('계란로 만들기');
  });

  it('공백 문자열만 입력된 필수 변수는 누락으로 처리한다', () => {
    expect(() =>
      renderPrompt('{{ingredients}}', variables, { ingredients: '   ', count: '2' })
    ).toThrow('보유 재료(ingredients)을(를) 입력해주세요');
  });
});

describe('renderPrompt - 에러 처리', () => {
  it('필수 변수 누락 시 label(name) 형식의 에러를 던진다', () => {
    expect(() =>
      renderPrompt('{{ingredients}} {{count}}', variables, {})
    ).toThrow('보유 재료(ingredients)을(를) 입력해주세요');
  });

  it('필수 변수 여러 개 누락 시 모두 에러 메시지에 포함된다', () => {
    expect(() =>
      renderPrompt('{{ingredients}} {{count}}', variables, {})
    ).toThrow('추천 개수(count)을(를) 입력해주세요');
  });

  it('필수 변수 하나만 누락 시 해당 변수만 에러에 포함된다', () => {
    expect(() =>
      renderPrompt('{{ingredients}} {{count}}', variables, { ingredients: '계란' })
    ).toThrow('추천 개수(count)을(를) 입력해주세요');
  });
});
