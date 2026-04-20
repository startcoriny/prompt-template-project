import { compose, validateCombination } from '../services/composer.service';
import type { ComposeRequest } from '../validators/composer.validator';

// ── validateCombination ─────────────────────────────────────────────────────

describe('validateCombination', () => {
  it('유효한 조합은 valid: true, errors: [] 를 반환한다', () => {
    const req: ComposeRequest = {
      categoryId: 'study',
      frameworkId: '5w1h',
      techniqueIds: ['concept-mapping'],
      patternIds: ['gamification'],
      variables: { topic: '비동기 프로그래밍' },
    };
    const result = validateCombination(req);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('존재하지 않는 categoryId는 즉시 error를 반환한다', () => {
    const req: ComposeRequest = {
      categoryId: 'nonexistent',
      variables: {},
    };
    const result = validateCombination(req);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('카테고리를 찾을 수 없습니다');
  });

  it('카테고리에 적용 불가한 framework는 error를 반환한다', () => {
    // AIDA는 writing 전용 — study에 적용 불가
    const req: ComposeRequest = {
      categoryId: 'study',
      frameworkId: 'aida',
      variables: { topic: '테스트' },
    };
    const result = validateCombination(req);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('적용할 수 없습니다');
  });

  it('존재하지 않는 frameworkId는 error를 반환한다', () => {
    const req: ComposeRequest = {
      categoryId: 'study',
      frameworkId: 'nonexistent-fw',
      variables: { topic: '테스트' },
    };
    const result = validateCombination(req);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('프레임워크를 찾을 수 없습니다');
  });

  it('카테고리에 적용 불가한 technique는 error를 반환한다', () => {
    // concept-mapping은 study, coding 전용 — travel에 적용 불가
    const req: ComposeRequest = {
      categoryId: 'travel',
      techniqueIds: ['concept-mapping'],
      variables: { destination: '도쿄' },
    };
    const result = validateCombination(req);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('적용할 수 없습니다');
  });

  it('중복된 techniqueId는 error를 반환한다', () => {
    const req: ComposeRequest = {
      categoryId: 'study',
      techniqueIds: ['concept-mapping', 'concept-mapping'],
      variables: { topic: '테스트' },
    };
    const result = validateCombination(req);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('중복된 technique');
  });

  it('중복된 patternId는 error를 반환한다', () => {
    const req: ComposeRequest = {
      categoryId: 'study',
      patternIds: ['gamification', 'gamification'],
      variables: { topic: '테스트' },
    };
    const result = validateCombination(req);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('중복된 pattern');
  });

  it('존재하지 않는 techniqueId는 error를 반환한다', () => {
    const req: ComposeRequest = {
      categoryId: 'study',
      techniqueIds: ['nonexistent-tech'],
      variables: { topic: '테스트' },
    };
    const result = validateCombination(req);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('기법을 찾을 수 없습니다');
  });

  it('비권장 technique는 valid: true이고 warnings에 메시지를 담는다', () => {
    // role-assignment는 study에 applicable하지만 recommended는 아님
    const req: ComposeRequest = {
      categoryId: 'study',
      techniqueIds: ['role-assignment'],
      variables: { topic: '테스트' },
    };
    const result = validateCombination(req);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('비권장');
  });

  it('여러 error가 있을 경우 모두 수집한다', () => {
    const req: ComposeRequest = {
      categoryId: 'study',
      frameworkId: 'aida',              // study에 불가
      techniqueIds: ['nonexistent-t'],  // 존재하지 않음
      variables: { topic: '테스트' },
    };
    const result = validateCombination(req);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

// ── compose ─────────────────────────────────────────────────────────────────

describe('compose', () => {
  it('정상 조합 시 프롬프트를 생성한다', () => {
    const req: ComposeRequest = {
      categoryId: 'study',
      frameworkId: '5w1h',
      techniqueIds: ['concept-mapping'],
      patternIds: ['gamification'],
      variables: { topic: '비동기 프로그래밍' },
    };
    const result = compose(req);

    expect(result.prompt).toContain('학습 전문가');
    expect(result.prompt).toContain('비동기 프로그래밍');
    expect(result.prompt).toContain('5W1H');
    expect(result.prompt).toContain('개념 매핑');
    expect(result.prompt).toContain('게임화');
  });

  it('meta 필드가 요청과 일치한다', () => {
    const req: ComposeRequest = {
      categoryId: 'study',
      frameworkId: '5w1h',
      techniqueIds: ['concept-mapping'],
      patternIds: ['gamification'],
      variables: { topic: '테스트' },
    };
    const result = compose(req);
    expect(result.meta.categoryId).toBe('study');
    expect(result.meta.frameworkId).toBe('5w1h');
    expect(result.meta.techniqueIds).toEqual(['concept-mapping']);
    expect(result.meta.patternIds).toEqual(['gamification']);
  });

  it('fragment 순서가 role → context → framework → technique → pattern 을 따른다', () => {
    const req: ComposeRequest = {
      categoryId: 'study',
      frameworkId: '5w1h',
      techniqueIds: ['concept-mapping'],
      patternIds: ['gamification'],
      variables: { topic: '테스트' },
    };
    const { prompt } = compose(req);

    const roleIdx = prompt.indexOf('학습 전문가');
    const contextIdx = prompt.indexOf('학습 주제');
    const frameworkIdx = prompt.indexOf('5W1H');
    const techniqueIdx = prompt.indexOf('개념 매핑');
    const patternIdx = prompt.indexOf('게임화');

    expect(roleIdx).toBeLessThan(contextIdx);
    expect(contextIdx).toBeLessThan(frameworkIdx);
    expect(frameworkIdx).toBeLessThan(techniqueIdx);
    expect(techniqueIdx).toBeLessThan(patternIdx);
  });

  it('framework 없이도 프롬프트를 생성한다', () => {
    const req: ComposeRequest = {
      categoryId: 'study',
      variables: { topic: '클로저' },
    };
    const result = compose(req);
    expect(result.prompt).toBeTruthy();
    expect(result.meta.frameworkId).toBeUndefined();
    expect(result.meta.techniqueIds).toEqual([]);
    expect(result.meta.patternIds).toEqual([]);
  });

  it('변수가 프롬프트에 치환된다', () => {
    const req: ComposeRequest = {
      categoryId: 'study',
      variables: { topic: '리액트 훅', level: '기초 완료' },
    };
    const { prompt } = compose(req);
    expect(prompt).toContain('리액트 훅');
    expect(prompt).toContain('기초 완료');
    expect(prompt).not.toContain('{{topic}}');
    expect(prompt).not.toContain('{{level}}');
  });

  it('optional 변수 미입력 시 {{variable}} 형태로 유지된다', () => {
    const req: ComposeRequest = {
      categoryId: 'study',
      variables: { topic: '테스트' }, // level은 optional
    };
    const { prompt } = compose(req);
    expect(prompt).toContain('{{level}}');
  });

  it('필수 변수 누락 시 에러를 던진다', () => {
    const req: ComposeRequest = {
      categoryId: 'study',
      variables: {}, // topic이 required
    };
    expect(() => compose(req)).toThrow();
  });

  it('잘못된 조합 시 validation error 메시지를 포함한 에러를 던진다', () => {
    const req: ComposeRequest = {
      categoryId: 'study',
      frameworkId: 'aida', // study에 불가
      variables: { topic: '테스트' },
    };
    expect(() => compose(req)).toThrow('적용할 수 없습니다');
  });

  it('비권장 조합도 정상적으로 프롬프트를 생성한다', () => {
    // role-assignment는 study에 applicable하지만 비권장
    const req: ComposeRequest = {
      categoryId: 'study',
      techniqueIds: ['role-assignment'],
      variables: { topic: '테스트' },
    };
    const result = compose(req);
    expect(result.prompt).toBeTruthy();
    expect(result.prompt).toContain('전문가 역할');
  });

  it('여러 technique과 pattern이 순서대로 조립된다', () => {
    const req: ComposeRequest = {
      categoryId: 'coding',
      techniqueIds: ['multi-perspective', 'role-assignment'],
      patternIds: ['checklist', 'meta-prompt'],
      variables: { request: 'API 설계' },
    };
    const { prompt } = compose(req);

    const mpIdx = prompt.indexOf('다중 관점');
    const raIdx = prompt.indexOf('전문가 역할');
    const clIdx = prompt.indexOf('체크리스트');
    const metaIdx = prompt.indexOf('핵심 의도');

    expect(mpIdx).toBeLessThan(raIdx);
    expect(raIdx).toBeLessThan(clIdx);
    expect(clIdx).toBeLessThan(metaIdx);
  });
});

// ── compose — extraVariables ─────────────────────────────────────────────────

describe('compose — extraVariables', () => {
  it('5W1H extraVariables 전체 입력 시 추가 정보 블록이 포함된다', () => {
    const req: ComposeRequest = {
      categoryId: 'study',
      frameworkId: '5w1h',
      variables: { topic: '기후 변화' },
      frameworkVariables: {
        who: '연구자',
        what: '탄소 배출 분석',
        when: '2024년',
        where: '북극권',
        why: '기온 상승 원인 파악',
        how: '위성 데이터 활용',
      },
    };
    const { prompt } = compose(req);

    expect(prompt).toContain('[추가 정보 - 5W1H]');
    expect(prompt).toContain('누가 (Who): 연구자');
    expect(prompt).toContain('어떻게 (How): 위성 데이터 활용');
  });

  it('일부만 입력해도 compose가 정상 동작하고 입력한 항목만 포함된다', () => {
    const req: ComposeRequest = {
      categoryId: 'study',
      frameworkId: '5w1h',
      variables: { topic: '클라우드 컴퓨팅' },
      frameworkVariables: { who: '개발팀', what: '비용 최적화' },
    };
    const { prompt } = compose(req);

    expect(prompt).toContain('[추가 정보 - 5W1H]');
    expect(prompt).toContain('누가 (Who): 개발팀');
    expect(prompt).toContain('무엇을 (What): 비용 최적화');
    expect(prompt).not.toContain('언제 (When)');
    expect(prompt).not.toContain('어디서 (Where)');
  });

  it('모든 frameworkVariables가 빈 값이면 추가 정보 블록이 포함되지 않는다', () => {
    const req: ComposeRequest = {
      categoryId: 'study',
      frameworkId: '5w1h',
      variables: { topic: '머신러닝' },
      frameworkVariables: { who: '', what: '', when: '', where: '', why: '', how: '' },
    };
    const { prompt } = compose(req);

    expect(prompt).not.toContain('[추가 정보 - 5W1H]');
  });

  it('frameworkVariables 없이 요청해도 정상 동작한다', () => {
    const req: ComposeRequest = {
      categoryId: 'study',
      frameworkId: '5w1h',
      variables: { topic: '딥러닝' },
    };
    const { prompt } = compose(req);

    expect(prompt).toBeTruthy();
    expect(prompt).toContain('5W1H');
    expect(prompt).not.toContain('[추가 정보 - 5W1H]');
  });

  it('extraVariables 없는 프레임워크(MECE)에 frameworkVariables를 전달해도 무시된다', () => {
    const req: ComposeRequest = {
      categoryId: 'meeting',
      frameworkId: 'mece',
      variables: { purpose: '팀 성과 리뷰' },
      frameworkVariables: { who: '무시되어야 함' },
    };
    const { prompt } = compose(req);

    expect(prompt).toContain('MECE');
    expect(prompt).not.toContain('[추가 정보 - MECE]');
    expect(prompt).not.toContain('무시되어야 함');
  });
});
