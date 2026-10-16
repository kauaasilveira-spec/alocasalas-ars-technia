import express from 'express';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { aiEnabled } from './ai.js';
import { createApp } from './app.js';
import { config } from './config.js';
import { openDb } from './db.js';
import { seed } from './seed.js';

const db = openDb();
const { n } = db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number };
if (n === 0) {
  seed(db);
  console.log('Banco vazio: dados de demonstração criados.');
}

const app = createApp(db);

const webDist = join(dirname(fileURLToPath(import.meta.url)), '../../web/dist');
if (existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(join(webDist, 'index.html')));
}

app.listen(config.port, () => {
  console.log(`AlocaSalas API em http://localhost:${config.port} — Gemini ${aiEnabled() ? 'ativo' : 'desativado (sem GEMINI_API_KEY)'}`);
});
