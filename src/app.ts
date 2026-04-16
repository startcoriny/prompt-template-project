import 'dotenv/config';
import express from 'express';
import { getCategories } from './controllers/category.controller';
import {
  getTemplates,
  getTemplateByIdHandler,
  renderTemplateHandler,
} from './controllers/template.controller';
import { postWorkLog } from './controllers/notion.controller';
import { getPrDraft, submitPr } from './controllers/github.controller';

const app = express();
const PORT = process.env['PORT'] ?? 3000;

app.use(express.json());

// Categories
app.get('/categories', getCategories);

// Templates
app.get('/templates', getTemplates);
app.get('/templates/:id', getTemplateByIdHandler);
app.post('/templates/:id/render', renderTemplateHandler);

// Notion Work Log
app.post('/logs', postWorkLog);

// GitHub PR
app.post('/prs/draft', getPrDraft);
app.post('/prs', submitPr);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
