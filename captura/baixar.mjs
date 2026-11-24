#!/usr/bin/env node
// baixar.mjs — baixa um reel, post ou carrossel PÚBLICO a partir do link, para estudar o estilo.
//
//   node captura/baixar.mjs <link> [--saida pasta] [--cookies-do-navegador chrome|firefox|edge|brave] [--audio] [--transcrever]
//
// O que sai, numa pasta por link (padrão: baixados/<id>/):
//   video.mp4 (ou as imagens do carrossel), info.json (legenda, autor, data, duração, métricas públicas),
//   descricao.txt, e com --audio o audio.wav (16 kHz mono, pronto para o whisper);
//   com --transcrever, transcricao.srt e transcricao.txt (precisa do whisper instalado).
//
// Ferramentas abertas: yt-dlp (vídeo, áudio e metadados) e, para carrossel só de imagens, gallery-dl.
// Sem login: só conteúdo público. Se a plataforma pedir login, use --cookies-do-navegador com o navegador
// onde VOCÊ já está logado (o yt-dlp lê os cookies localmente; nada sai da sua máquina).
//
// USO RESPONSÁVEL: baixe para estudar estilo (edição, ritmo, tipografia, som). Conteúdo de terceiro
// (texto, roteiro, imagem, música) nunca se republica nem se copia. Ver docs/02-captura-por-link.md.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function idDoLink(link) {
  let u;
  try { u = new URL(link); } catch { return null; }
  if (!/(^|\.)instagram\.com$/.test(u.hostname) && !/(^|\.)instagr\.am$/.test(u.hostname)) return null;
  const m = u.pathname.match(/^\/(?:[^/]+\/)?(reel|reels|p|tv|stories)\/([^/?#]+)/);
  if (!m || !/^[\w-]{5,40}$/.test(m[2])) return null;
  const tipo = m[1] === 'reels' ? 'reel' : m[1];
  // A URL é reconstruída a partir do código: nada que a pessoa colou vai cru para a linha de comando.
  const url = tipo === 'stories' ? null : `https://www.instagram.com/${tipo === 'p' ? 'p' : 'reel'}/${m[2]}/`;
  return { tipo, id: m[2], url };
}

function tem(cmd, args = ['--version']) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', shell: process.platform === 'win32' });
  return r.status === 0;
}

function rodar(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: false });
  return r.status === 0;
}

function main() {
  const args = process.argv.slice(2);
  const opcao = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
  const link = args.find((a) => /^https?:\/\//.test(a));
  if (!link) { console.error('uso: node captura/baixar.mjs <link do instagram> [--saida pasta] [--cookies-do-navegador chrome] [--audio] [--transcrever]'); process.exit(2); }
  const alvo = idDoLink(link);
  if (!alvo) { console.error('link não reconhecido como reel, post, tv ou story do Instagram'); process.exit(2); }
  if (alvo.tipo === 'stories') console.warn('aviso: story some em 24 h e quase sempre exige login (--cookies-do-navegador).');
  if (!tem('yt-dlp')) { console.error('falta o yt-dlp: pip install -U yt-dlp  (ou winget/brew install yt-dlp)'); process.exit(2); }

  const pasta = path.resolve(opcao('--saida') || path.join('baixados', alvo.id));
  fs.mkdirSync(pasta, { recursive: true });
  const cookies = opcao('--cookies-do-navegador');
  const base = ['--no-playlist', '--write-info-json', '--write-description', '--no-progress',
    '--retries', '3', '--sleep-requests', '1', ...(cookies ? ['--cookies-from-browser', cookies] : [])];

  const ok = rodar('yt-dlp', [...base, '-f', 'bv*+ba/b', '--merge-output-format', 'mp4',
    '-o', path.join(pasta, 'video.%(ext)s'), '--', alvo.url || link]);

  if (!ok) {
    // Carrossel só de imagens não tem vídeo: o yt-dlp falha e o gallery-dl resolve.
    if (tem('gallery-dl')) {
      console.warn('yt-dlp não achou vídeo; tentando o gallery-dl (carrossel de imagens)...');
      const ok2 = rodar('gallery-dl', [...(cookies ? ['--cookies-from-browser', cookies] : []), '-D', pasta, '--write-metadata', '--', alvo.url || link]);
      if (!ok2) { console.error('não deu: post privado, removido ou a plataforma pediu login (tente --cookies-do-navegador).'); process.exit(1); }
    } else {
      console.error('falhou. Se for carrossel só de imagens, instale o gallery-dl (pip install gallery-dl). Se pediu login, use --cookies-do-navegador.');
      process.exit(1);
    }
  }

  const info = path.join(pasta, 'video.info.json');
  if (fs.existsSync(info)) fs.renameSync(info, path.join(pasta, 'info.json'));
  const desc = path.join(pasta, 'video.description');
  if (fs.existsSync(desc)) fs.renameSync(desc, path.join(pasta, 'descricao.txt'));

  const video = path.join(pasta, 'video.mp4');
  if ((args.includes('--audio') || args.includes('--transcrever')) && fs.existsSync(video)) {
    rodar('ffmpeg', ['-v', 'error', '-y', '-i', video, '-vn', '-ac', '1', '-ar', '16000', path.join(pasta, 'audio.wav')]);
  }
  if (args.includes('--transcrever') && fs.existsSync(path.join(pasta, 'audio.wav'))) {
    if (tem('whisper', ['--help'])) {
      rodar('whisper', [path.join(pasta, 'audio.wav'), '--model', 'small', '--language', 'pt', '--output_format', 'all', '--output_dir', pasta]);
      for (const ext of ['srt', 'txt']) {
        const f = path.join(pasta, `audio.${ext}`);
        if (fs.existsSync(f)) fs.renameSync(f, path.join(pasta, `transcricao.${ext}`));
      }
    } else {
      console.warn('whisper não instalado (pip install -U openai-whisper ou faster-whisper): áudio salvo, sem transcrição.');
    }
  }
  console.log(`pronto: ${pasta}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
