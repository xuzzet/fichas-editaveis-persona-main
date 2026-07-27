// Incrementa automaticamente o CACHE_VERSION em sw.js.
// Uso: `npm run bump` (ou é chamado por `npm run deploy`).
// Procura por: const CACHE_VERSION = 'persona-ficha-vNN';
// e troca NN por NN+1.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const swPath = join(root, 'sw.js');

const source = await readFile(swPath, 'utf8');

const re = /(const CACHE_VERSION = 'persona-ficha-v)(\d+)(';)/;
const match = source.match(re);

if (!match) {
  console.error('Erro: não encontrei o padrão CACHE_VERSION em sw.js.');
  process.exit(1);
}

const current = Number(match[2]);
const next = current + 1;
const updated = source.replace(re, `$1${next}$3`);

await writeFile(swPath, updated, 'utf8');

console.log(`CACHE_VERSION: v${current} -> v${next}`);
