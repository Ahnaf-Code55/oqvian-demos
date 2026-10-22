import http from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.join(root, 'docs');
const publicDir = path.join(root, 'public');
const port = 4101;
// ponytail: crude suffix stripper, swap for a real stemmer if recall matters
const stem = (w) => w.replace(/(ing|ed|es|s|e)$/, '');
const tokenize = (s) => (s.toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => w.length > 1).map(stem);

async function loadChunks() {
  const files = (await readdir(docsDir)).filter((f) => f.endsWith('.md')).sort();
  const chunks = [];
  for (const file of files) {
    const content = await readFile(path.join(docsDir, file), 'utf8');
    const doc = content.match(/^#\s+(.+)$/m)?.[1] || file;
    content.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && !p.startsWith('#'))
      .forEach((chunkText, i) => chunks.push({ doc, chunkText, id: `${file}:${i + 1}` }));
  }
  return chunks;
}

// BM25 ranks paragraph passages using corpus IDF, term frequency, and length normalization.
function retrieve(question, chunks, limit = 3) {
  const terms = tokenize(question);
  if (!terms.length || !chunks.length) return [];
  const tokenized = chunks.map((c) => tokenize(c.chunkText));
  const avgLen = tokenized.reduce((sum, t) => sum + t.length, 0) / tokenized.length || 1;
  const df = new Map();
  for (const term of new Set(terms)) df.set(term, tokenized.filter((t) => t.includes(term)).length);
  return chunks.map((chunk, i) => {
    const words = tokenized[i], counts = new Map();
    for (const word of words) counts.set(word, (counts.get(word) || 0) + 1);
    let score = 0;
    for (const term of terms) {
      const tf = counts.get(term) || 0, n = df.get(term) || 0;
      const idf = Math.log(1 + (chunks.length - n + 0.5) / (n + 0.5));
      score += idf * (tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * words.length / avgLen));
    }
    return { ...chunk, score };
  }).sort((a, b) => b.score - a.score).slice(0, limit);
}

function selftest(chunks) {
  const cases = [
    ['How many business days from Alder Bay to Bellhaven?', 'Shipping times'],
    ['What should I send for a customs review?', 'Customs and duties'],
    ['How soon must I report damaged freight?', 'Returns and claims'],
    ['What is the dimensional weight formula?', 'Pricing and surcharges'],
  ];
  for (const [question, expected] of cases) assert.equal(retrieve(question, chunks, 1)[0]?.doc, expected, question);
  console.log('PASS BM25 retrieves the expected document for all 4 sample questions.');
}

function send(res, status, data, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'content-type': type, 'x-content-type-options': 'nosniff' });
  res.end(type.startsWith('application/json') ? JSON.stringify(data) : data);
}

const chunks = await loadChunks();
if (process.argv.includes('--selftest')) selftest(chunks);
else http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'GET' && url.pathname === '/api/docs') {
    const docs = [...new Map(chunks.map((c) => [c.doc, c.doc])).keys()];
    return send(res, 200, { docs });
  }
  if (req.method === 'POST' && url.pathname === '/api/ask') {
    try {
      let body = '';
      for await (const part of req) {
        body += part;
        if (body.length > 16_000) return send(res, 413, { error: 'Question is too large.' });
      }
      const question = JSON.parse(body).question?.trim();
      if (typeof question !== 'string' || !question || question.length > 1000)
        return send(res, 400, { error: 'Enter a question of 1 to 1000 characters.' });
      const sources = retrieve(question, chunks, 3);
      const fallback = { answer: sources[0]?.chunkText || 'I could not find that in the documents.', sources, mode: 'retrieval-only' };
      if (!process.env.OPENAI_API_KEY) return send(res, 200, { ...fallback, notice: 'No language model key set, showing the best matching passages only.' });
      try {
        const passages = sources.map((s, i) => `[${i + 1}] ${s.doc}\n${s.chunkText}`).join('\n\n');
        const key = process.env.OPENAI_API_KEY, router = key.startsWith('sk-or-');
        const base = process.env.LLM_BASE_URL || (router ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1');
        const response = await fetch(`${base}/chat/completions`, {
          method: 'POST',
          headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'content-type': 'application/json' },
          body: JSON.stringify({
            model: process.env.RAG_MODEL || (router ? 'openai/gpt-4o-mini' : 'gpt-4o-mini'), temperature: 0.1,
            messages: [
              { role: 'system', content: 'Answer ONLY from the numbered passages. Cite claims like [1]. If the answer is absent, say "I could not find that in the documents".' },
              { role: 'user', content: `Question: ${question}\n\nNumbered passages:\n${passages}` },
            ],
          }),
        });
        if (!response.ok) throw new Error(`Language model returned ${response.status}`);
        const data = await response.json();
        const answer = data.choices?.[0]?.message?.content?.trim();
        if (!answer) throw new Error('Language model returned an empty answer');
        return send(res, 200, { answer, sources, mode: 'llm' });
      } catch {
        return send(res, 200, { ...fallback, notice: 'Language model unavailable, showing the best matching passages only.' });
      }
    } catch {
      return send(res, 400, { error: 'Could not read that question. Please try again.' });
    }
  }
  if (req.method === 'GET') {
    const relative = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).replace(/^\/+/, '');
    const target = path.resolve(publicDir, relative);
    if (!target.startsWith(`${publicDir}${path.sep}`)) return send(res, 403, 'Forbidden', 'text/plain; charset=utf-8');
    try {
      const data = await readFile(target);
      const type = target.endsWith('.html') ? 'text/html; charset=utf-8' : target.endsWith('.css') ? 'text/css; charset=utf-8' : 'application/javascript; charset=utf-8';
      return send(res, 200, data.toString(), type);
    } catch { return send(res, 404, 'Not found', 'text/plain; charset=utf-8'); }
  }
  send(res, 405, { error: 'Method not allowed.' });
}).listen(port, '127.0.0.1', () => console.log(`Kestrel Freight demo ready at http://localhost:${port}`));
