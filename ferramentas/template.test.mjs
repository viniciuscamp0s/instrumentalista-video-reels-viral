// O template precisa continuar sem IA, sem acaso e com a identidade num lugar só.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const T = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'motion-exemplo');
const ler = (f) => fs.readFileSync(path.join(T, f), 'utf8');

test('desenho sem Math.random (o mesmo quadro sai sempre igual)', () => {
  for (const f of ['nucleo.js', 'cenas.js', 'roteiro.js']) {
    const sem = ler(f).split('\n').filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'));
    assert.ok(!sem.some((l) => l.includes('Math.random(')), `${f} usa Math.random`);
  }
});

test('nenhuma chamada de rede ou de IA no motor', () => {
  for (const f of ['nucleo.js', 'cenas.js', 'roteiro.js', 'trilha.js']) {
    assert.ok(!/https?:\/\//.test(ler(f).replace(/\/\/.*$/gm, '')), `${f} chama endereço externo`);
  }
});

test('identidade visual marcada num bloco só', () => {
  const r = ler('roteiro.js');
  assert.match(r, /ID VISUAL[^\n]*\nconst PALETA/);
  assert.match(r, /ID VISUAL[^\n]*\nconst FONTES/);
  assert.ok(fs.existsSync(path.join(T, '_anexos', 'logo.png')));
});
