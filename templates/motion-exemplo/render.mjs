// render.mjs — tira o vídeo quadro a quadro do index.html e monta o MP4 com o FFmpeg.
//
//   node render.mjs                        vídeo inteiro -> ../<pasta>.mp4 + ../<pasta>-leve.mp4
//   node render.mjs --saida X.mp4          outro destino (a versão leve sai ao lado: X-leve.mp4)
//   node render.mjs --ate 12.4             prova até 12,4 s -> _preview/prova-ate-12.4s.mp4
//   node render.mjs --quadros 1,5.2,11     PNGs soltos -> _preview/quadro-<t>.png, para conferir
//   node render.mjs --so-som               só a trilha -> _preview/trilha.wav, para medir o volume (com --normalizada sai igual à do vídeo final, -14 LUFS)
//   node render.mjs --pedaco 0,350 --saida P1.mp4   só os quadros [0,350) -> vídeo mudo (sem trilha, sem versão leve);
//                                          os pedaços se juntam com ferramentas/juntar-pedacos.sh (prova de 17/10/2026)
//   ... --guia                             desenha as faixas que o Reels cobre
//   ... --param som=musica                 parâmetro extra na URL da página (v2: som=musica|voz|semvoz)
//   ... --raiz <pasta>                     pasta servida (padrão: a do projeto). Use quando a
//                                          página busca arquivo de fora dela (ex.: a logo do cliente)
//
// Sem dependência de npm: sobe um servidor estático, abre o Chrome instalado em modo
// headless e comanda a página pelo protocolo do DevTools, com o WebSocket do próprio
// Node (Node 22+). Quadros e som voltam por POST no mesmo servidor, em bytes: texto
// grande pelo DevTools (um PNG de 4 MB em base64) trava e nunca chega.
import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opcao = nome => { const i = args.indexOf(nome); return i >= 0 ? args[i + 1] : null; };
const RAIZ = path.resolve(opcao('--raiz') || AQUI);
const PAGINA = path.relative(RAIZ, path.join(AQUI, 'index.html')).split(path.sep).join('/');
if (PAGINA.startsWith('..')) { console.error('--raiz precisa conter a pasta do projeto'); process.exit(1); }
const CHROME = process.env.CHROME || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].find(c => fs.existsSync(c));
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const FINAL = path.resolve(opcao('--saida') || path.join(AQUI, '..', path.basename(AQUI) + '.mp4'));
const PREVIA = path.join(AQUI, '_preview');
const ATE = opcao('--ate') ? parseFloat(opcao('--ate')) : null;
const QUADROS = opcao('--quadros') ? opcao('--quadros').split(',').map(Number) : null;
const GUIA = args.includes('--guia');
const PEDACO = opcao('--pedaco') ? opcao('--pedaco').split(',').map(Number) : null;   // quadros [de, ate)

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
};
const esperar = ms => new Promise(ok => setTimeout(ok, ms));

// O que chega por POST: rota -> função(bytes, parâmetros). Preenchido pelo main.
const recebe = {};

function servidor() {
  return new Promise(ok => {
    const s = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://x');
      if (req.method === 'POST' && recebe[u.pathname]) {
        const partes = [];
        req.on('data', d => partes.push(d));
        req.on('end', async () => {
          try { await recebe[u.pathname](Buffer.concat(partes), u.searchParams); res.writeHead(200); res.end('ok'); }
          catch (e) { console.error('\n' + e.message); res.writeHead(500); res.end(String(e.message)); }
        });
        return;
      }
      const arq = path.resolve(RAIZ, '.' + decodeURIComponent(u.pathname));
      if ((arq !== RAIZ && !arq.startsWith(RAIZ + path.sep)) || !fs.existsSync(arq) || fs.statSync(arq).isDirectory()) {
        res.writeHead(404); res.end(); return;
      }
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arq).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(arq).pipe(res);
    });
    s.listen(0, '127.0.0.1', () => ok(s));
  });
}

async function abrirChrome(url) {
  if (!CHROME) throw new Error('Chrome não encontrado: defina a variável CHROME com o caminho do executável');
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'motion-chrome-'));
  const porta = 9300 + Math.floor(Math.random() * 600);
  const proc = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${porta}`, `--user-data-dir=${perfil}`,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--hide-scrollbars', '--mute-audio',
    '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--window-size=1080,1920',
    // dentro de contêiner (root, /dev/shm pequeno): CHROME_CONTEINER=1
    ...(process.env.CHROME_CONTEINER ? ['--no-sandbox', '--disable-dev-shm-usage'] : []), ...(process.env.CHROME_EXTRA ? process.env.CHROME_EXTRA.split(' ') : []), 'about:blank',
  ], { stdio: 'ignore' });
  // a aba nasce em branco e navega depois: o /json/new corta a URL no primeiro "&"
  let alvo = null;
  for (let i = 0; i < 120 && !alvo; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${porta}/json/new?about:blank`, { method: 'PUT', signal: AbortSignal.timeout(2000) });
      if (r.ok) alvo = await r.json();
    } catch { /* o Chrome ainda está subindo */ }
    if (!alvo) await esperar(250);
  }
  if (!alvo) { proc.kill(); throw new Error('o Chrome não respondeu no DevTools'); }
  const ws = new WebSocket(alvo.webSocketDebuggerUrl);
  await new Promise((ok, erro) => { ws.onopen = ok; ws.onerror = () => erro(new Error('WebSocket do DevTools falhou')); });
  let seq = 0;
  const pendentes = new Map();
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pendentes.has(m.id)) {
      const p = pendentes.get(m.id); pendentes.delete(m.id);
      if (m.error) p.erro(new Error(m.error.message)); else p.ok(m.result);
      return;
    }
    if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      console.error('\n[página] exceção:', d?.exception?.description || d?.text);
    }
    if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) {
      console.error('\n[página]', m.params.args.map(a => a.value ?? a.description).join(' '));
    }
  };
  const cdp = (method, params = {}) => new Promise((ok, erro) => {
    const id = ++seq; pendentes.set(id, { ok, erro }); ws.send(JSON.stringify({ id, method, params }));
  });
  const avaliar = async expr => {
    const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  await cdp('Runtime.enable');
  await cdp('Page.navigate', { url });
  const fechar = async () => {
    try { ws.close(); } catch { /* já fechado */ }
    const saiu = new Promise(ok => proc.once('exit', ok));
    proc.kill();
    await Promise.race([saiu, esperar(3000)]);
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch { /* o Windows ainda segura algum arquivo */ }
  };
  return { avaliar, fechar };
}

function rodar(bin, argumentos) {
  return new Promise((ok, erro) => {
    const p = spawn(bin, argumentos, { stdio: ['ignore', 'inherit', 'inherit'] });
    p.on('close', c => (c === 0 ? ok() : erro(new Error(`${bin} saiu com ${c}`))));
  });
}

async function main() {
  fs.mkdirSync(PREVIA, { recursive: true });
  const srv = await servidor();
  const url = `http://127.0.0.1:${srv.address().port}/${encodeURI(PAGINA)}?render=1${GUIA ? '&guia=1' : ''}${opcao('--param') ? '&' + opcao('--param') : ''}`;
  console.log('Abrindo o Chrome…');
  const chrome = await abrirChrome(url);
  try {
    let info = null;
    const abriu = Date.now();
    for (let i = 0; !info; i++) {
      let st = null;
      try {   // durante a navegação o contexto da página troca e a consulta pode falhar
        st = await chrome.avaliar('window.MOTION ? ({ pronto: MOTION.pronto, erro: MOTION.erro, dur: MOTION.DURACAO, fps: MOTION.FPS, w: MOTION.W, h: MOTION.H }) : null');
      } catch { /* tenta de novo */ }
      if (st?.erro) throw new Error(st.erro);
      if (st?.pronto) info = st;
      else if (i > 600) throw new Error('a página não ficou pronta em 60 s');
      else await esperar(100);
    }
    console.log(`Página pronta em ${((Date.now() - abriu) / 1000).toFixed(1)} s`);

    if (QUADROS) {
      recebe['/__png'] = (buf, q) => {
        const arq = path.join(PREVIA, q.get('nome'));
        fs.writeFileSync(arq, buf);
        console.log(arq);
      };
      for (const t of QUADROS) {
        const t0 = Date.now();
        await chrome.avaliar(`MOTION.enviarPNG(${t}, ${JSON.stringify(`quadro-${t.toFixed(2)}${GUIA ? '-guia' : ''}.png`)})`);
        console.log(`  t=${t}: ${((Date.now() - t0) / 1000).toFixed(1)} s`);
      }
      return;
    }

    const dur = ATE ?? info.dur;
    const n = Math.round(dur * info.fps);
    const [Q0, Q1] = PEDACO ? [PEDACO[0], Math.min(PEDACO[1], n)] : [0, n];
    // nome único por renderização: duas versões do mesmo projeto renderizando juntas não podem dividir o arquivo
    // (em 15/10/2026 a v2 sobrescreveu o áudio que o FFmpeg da v1 ainda lia)
    const wav = path.join(PREVIA, args.includes('--so-som') ? 'trilha.wav' : `trilha-${process.pid}.wav`);
    const tSom = Date.now();
    if (!PEDACO) {
      console.log('Renderizando a trilha…');
      recebe['/__som'] = buf => fs.writeFileSync(wav, buf);
      await chrome.avaliar('MOTION.enviarSom()');
      console.log(`trilha: ${((Date.now() - tSom) / 1000).toFixed(1)} s`);
    }
    if (args.includes('--so-som') && !args.includes('--normalizada')) { console.log(wav); return; }

    // loudness: normaliza a trilha para -14 LUFS / -1,5 dBTP em duas passadas (a segunda é linear, sem bombear)
    if (!PEDACO && !args.includes('--sem-loudnorm')) {
      const medida = spawnSync(FFMPEG, ['-hide_banner', '-nostats', '-i', wav, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' });
      const m = JSON.parse(medida.stderr.slice(medida.stderr.lastIndexOf('{'), medida.stderr.lastIndexOf('}') + 1));
      const norm = wav.replace(/\.wav$/, '-norm.wav');
      // + limitador com sobreamostragem: a passada linear sozinha deixou um pico real de -0,6 dBTP depois do AAC
      // (falha real num anúncio); -2 dBFS a 192 kHz garante o teto de -1,5 dBTP no arquivo final
      const filtro = `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`
        + ',aresample=192000,alimiter=limit=0.79:attack=1:release=60:level=false,aresample=48000';
      const n2 = spawnSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', wav, '-af', filtro, '-ar', '48000', norm], { encoding: 'utf8' });
      if (n2.status === 0) { fs.copyFileSync(norm, wav); console.log(`loudness: ${m.input_i} LUFS -> -14 LUFS (pico ${m.input_tp} dBTP, máx -1,5)`); }
    }
    if (args.includes('--so-som')) { console.log(wav); return; }   // --normalizada: a mesma trilha do render inteiro (-14 LUFS)
    const saida = ATE ? path.join(PREVIA, `prova-ate-${ATE}s.mp4`) : FINAL;
    fs.mkdirSync(path.dirname(saida), { recursive: true });
    const fim = ATE ? ['-vf', `fade=t=out:st=${(dur - 0.4).toFixed(2)}:d=0.4`, '-af', `afade=t=out:st=${(dur - 0.5).toFixed(2)}:d=0.5`] : [];
    const ff = spawn(FFMPEG, [
      '-y', '-loglevel', 'error',
      '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${info.w}x${info.h}`, '-framerate', String(info.fps), '-i', '-',
      ...(PEDACO ? ['-map', '0:v'] : ['-i', wav, '-map', '0:v', '-map', '1:a']), ...fim,
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level:v', '4.2',
      '-movflags', '+faststart', ...(PEDACO ? ['-an'] : ['-c:a', 'aac', '-b:a', '192k', '-shortest']), saida,
    ], { stdio: ['pipe', 'inherit', 'inherit'] });
    const fimFF = new Promise((ok, erro) => ff.on('close', c => (c === 0 ? ok() : erro(new Error('o FFmpeg saiu com ' + c)))));
    const tamanho = info.w * info.h * 4;
    recebe['/__quadro'] = async buf => {
      if (buf.length !== tamanho) throw new Error(`quadro com ${buf.length} bytes, esperava ${tamanho}`);
      if (!ff.stdin.write(buf)) await new Promise(ok => ff.stdin.once('drain', ok));
    };
    const inicio = Date.now();
    for (let i = Q0; i < Q1; i++) {
      await chrome.avaliar(`MOTION.enviarQuadro(${(i / info.fps).toFixed(6)})`);
      if (i % 30 === 29 || i === Q1 - 1) process.stdout.write(`\r  quadro ${i + 1}/${Q1} · ${((Date.now() - inicio) / 1000).toFixed(0)} s`);
    }
    const segQ = (Date.now() - inicio) / 1000;
    const mq = await chrome.avaliar('MOTION.medida || null').catch(() => null);
    if (mq?.n) console.log(`
por quadro: preparar ${(mq.preparar / mq.n / 1000).toFixed(2)} s · desenho ${(mq.desenho / mq.n / 1000).toFixed(2)} s · leitura ${(mq.leitura / mq.n / 1000).toFixed(2)} s · envio ${(mq.envio / mq.n / 1000).toFixed(2)} s · ${Object.entries(mq.etapas || {}).map(([k, v]) => `${k} ${(v / mq.n / 1000).toFixed(2)}`).join(' · ')}`);
    const m3d = await chrome.avaliar('typeof P3D !== "undefined" && P3D.medida ? P3D.medida() : null').catch(() => null);
    if (m3d?.n3d) console.log(`
3D: 1º render (monta a cena) ${(m3d.ms1 / 1000).toFixed(1)} s; depois ${m3d.n3d} renders, ${(m3d.ms3d / 1000 / m3d.n3d).toFixed(2)} s cada`);
    ff.stdin.end();
    await fimFF;
    console.log(`
quadros: ${Q1 - Q0} em ${segQ.toFixed(1)} s (${(segQ / (Q1 - Q0)).toFixed(2)} s por quadro); com o x264: ${((Date.now() - inicio) / 1000).toFixed(1)} s`);
    for (const f of [wav, wav.replace(/\.wav$/, '-norm.wav')]) { try { fs.rmSync(f, { force: true }); } catch { /* fica para a limpeza do _preview */ } }
    console.log(`\nPronto: ${saida}`);

    // versão leve (720p, ~1 Mbps) para app de escola, WhatsApp e afins
    if (!ATE && !PEDACO && !args.includes('--sem-leve')) {
      const leve = saida.replace(/\.mp4$/i, '-leve.mp4');
      await rodar(FFMPEG, ['-y', '-loglevel', 'error', '-i', saida, '-vf', `scale=${Math.round(info.w * 2 / 3 / 2) * 2}:${Math.round(info.h * 2 / 3 / 2) * 2}:flags=lanczos`,
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-maxrate', '2800k', '-bufsize', '5600k', '-pix_fmt', 'yuv420p',
        '-profile:v', 'high', '-level:v', '4.0', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', leve]);
      console.log(`Leve:   ${leve}`);
    }
  } finally {
    await chrome.fechar();
    srv.close();
  }
}

main().catch(e => { console.error('\nERRO:', e.message); process.exit(1); });
