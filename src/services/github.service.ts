import { Octokit } from '@octokit/rest';
import type { PrRequest, PrDraft, PrResult } from '../types/github.types';

function getOctokit(): Octokit {
  const token = process.env['GITHUB_TOKEN'];
  if (!token) throw new Error('GITHUB_TOKEN이 설정되지 않았습니다.');
  return new Octokit({ auth: token });
}

function getRepoInfo(): { owner: string; repo: string } {
  const repoEnv = process.env['GITHUB_REPO'];
  if (!repoEnv) throw new Error('GITHUB_REPO가 설정되지 않았습니다.');

  // https://github.com/owner/repo.git 또는 owner/repo 형식 모두 지원
  const match = repoEnv.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
  if (match?.[1] && match?.[2]) {
    return { owner: match[1], repo: match[2] };
  }

  const parts = repoEnv.replace(/\.git$/, '').split('/');
  const owner = parts[parts.length - 2];
  const repo = parts[parts.length - 1];
  if (!owner || !repo) throw new Error('GITHUB_REPO 형식이 올바르지 않습니다. (예: owner/repo)');
  return { owner, repo };
}

export function buildPrDraft(req: PrRequest): PrDraft {
  const title = `${req.type}: ${req.summary}`;

  const fileList = req.changedFiles.map((f) => `- ${f}`).join('\n');

  const body = `## 무엇을 변경했는지\n${req.what}\n\n## 왜 변경했는지\n${req.why}\n\n## 어떻게 구현했는지\n${req.how}\n\n## 변경된 파일\n${fileList}`;

  return {
    title,
    body,
    base: req.base ?? 'main',
    head: req.head,
  };
}

export async function createPr(req: PrRequest): Promise<PrResult> {
  const octokit = getOctokit();
  const { owner, repo } = getRepoInfo();
  const draft = buildPrDraft(req);

  const response = await octokit.pulls.create({
    owner,
    repo,
    title: draft.title,
    body: draft.body,
    base: draft.base,
    head: draft.head,
  });

  return {
    url: response.data.html_url,
    number: response.data.number,
    title: response.data.title,
  };
}
