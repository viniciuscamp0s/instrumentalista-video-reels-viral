#!/usr/bin/env node
// novo-video.mjs — começa um vídeo novo a partir do template de motion, sem IA.
//
//   node ferramentas/novo-video.mjs <pasta-do-video>
//
// Copia o motor (nucleo.js, trilha.js, render.mjs, index.html, fontes) para a pasta.
// NÃO sobrescreve roteiro.js, cenas.js nem _anexos/ (o que é do seu vídeo): se não existirem,
// começa do exemplo. Melhorou o motor no template? Rode de novo para atualizar a pasta.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TEMPLATE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'motion-exemplo');
if (!process.argv[2]) { console.error('uso: node ferramentas/novo-video.mjs <pasta-do-video>'); process.exit(1); }
const destino = path.resolve(process.argv[2]);
fs.mkdirSync(destino, { recursive: true });

const MOTOR = ['nucleo.js', 'trilha.js', 'render.mjs', 'index.html'];
const DO_VIDEO = ['roteiro.js', 'cenas.js'];

for (const f of MOTOR) fs.copyFileSync(path.join(TEMPLATE, f), path.join(destino, f));
fs.cpSync(path.join(TEMPLATE, 'fonts'), path.join(destino, 'fonts'), { recursive: true });
for (const f of DO_VIDEO) {
  const alvo = path.join(destino, f);
  if (!fs.existsSync(alvo)) fs.copyFileSync(path.join(TEMPLATE, f), alvo);
}
const anexos = path.join(destino, '_anexos');
if (!fs.existsSync(anexos)) fs.cpSync(path.join(TEMPLATE, '_anexos'), anexos, { recursive: true });

console.log(`pronto: ${destino}
  1. troque _anexos/logo.png pela logo oficial e ajuste PALETA e FONTES em roteiro.js (identidade num lugar só)
  2. abra index.html no navegador (por um servidor local) para a prévia, ou
  3. node render.mjs   -> MP4 1080x1920 + versão leve, quadro a quadro, sem IA`);
