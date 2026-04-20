import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { getCategories } from './controllers/category.controller';
import {
  getTemplates,
  getTemplateByIdHandler,
  renderTemplateHandler,
} from './controllers/template.controller';
import { trackEventHandler } from './controllers/analytics.controller';
import { postWorkLog } from './controllers/notion.controller';
import { getPrDraft, submitPr } from './controllers/github.controller';
import {
  composePromptHandler,
  validateCombinationHandler,
  getFrameworksHandler,
  getTechniquesHandler,
  getPatternsHandler,
  getCategoryConfigHandler,
} from './controllers/composer.controller';

const app = express();
const PORT = process.env['PORT'] ?? 3000;

const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');

app.use(express.json());

// 정적 파일 직접 서빙
app.get('/', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf-8'));
});
app.get('/style.css', (_req, res) => {
  res.setHeader('Content-Type', 'text/css; charset=utf-8');
  res.send(fs.readFileSync(path.join(PUBLIC_DIR, 'style.css'), 'utf-8'));
});
app.get('/app.js', (_req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.send(fs.readFileSync(path.join(PUBLIC_DIR, 'app.js'), 'utf-8'));
});

// Categories
app.get('/categories', getCategories);

// Templates
app.get('/templates', getTemplates);
app.get('/templates/:id', getTemplateByIdHandler);
app.post('/templates/:id/render', renderTemplateHandler);

// Composer — data endpoints
app.get('/composer/frameworks', getFrameworksHandler);
app.get('/composer/techniques', getTechniquesHandler);
app.get('/composer/patterns', getPatternsHandler);
app.get('/composer/config/:categoryId', getCategoryConfigHandler);
// Composer — compose endpoints
app.post('/compose', composePromptHandler);
app.post('/compose/validate', validateCombinationHandler);

// Analytics
app.post('/analytics/track', trackEventHandler);

// Notion Work Log
app.post('/logs', postWorkLog);

// GitHub PR
app.post('/prs/draft', getPrDraft);
app.post('/prs', submitPr);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
