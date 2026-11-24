/* nucleo.js — o motor dos vídeos em motion graphics.
 *
 * Não se edita por projeto. O projeto fala com o motor por dois arquivos:
 *   roteiro.js  PROJETO, PALETA, FONTES, ARQUIVOS, ROTEIRO (tempos), e, se houver
 *               gravação de tela, GRAVACAO, MONTAGEM, TOQUES e BORROES
 *   cenas.js    desenharCenas(c, t): o desenho de cada cena, usando as peças daqui
 * render(t) desenha o quadro do segundo t. A prévia do navegador e o render.mjs
 * rodam o mesmo código: o que se vê na prévia é o que sai no MP4.
 *
 * Nasceu de um vídeo institucional de 45 s com gravação de tela. Melhoria no motor
 * volta para templates/motion-exemplo/ (o motor), nunca fica só num projeto.
 */
'use strict';

const W = PROJETO.W || 1080, H = PROJETO.H || 1920, FPS = PROJETO.FPS || 30;
const DURACAO = ROTEIRO.fim;
const TAU = Math.PI * 2;

// ------------------------------------------------------------------ utilidades
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const inv = (a, b, x) => clamp((x - a) / (b - a));           // progresso 0..1 de x entre a e b
const ease = {
  linear: k => k,
  outExpo: k => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k)),
  outQuint: k => 1 - Math.pow(1 - k, 5),
  outCubic: k => 1 - Math.pow(1 - k, 3),
  inCubic: k => k * k * k,
  inOutCubic: k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  inOutSine: k => -(Math.cos(Math.PI * k) - 1) / 2,
  outBack: (k, s = 1.70158) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2),
};
// pico assimétrico: sobe rápido até t0 e cai devagar (clarões, brilhos)
function pico(t, t0, subida, queda) {
  if (t < t0) { const d = (t - t0) / subida; return Math.exp(-d * d); }
  return Math.exp(-(t - t0) / queda);
}
// acaso com semente: o mesmo quadro sai sempre igual (nunca Math.random no desenho)
function mulberry32(semente) {
  return function () {
    semente |= 0; semente = (semente + 0x6D2B79F5) | 0;
    let x = Math.imul(semente ^ (semente >>> 15), 1 | semente);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 2 ** 32;
  };
}
function novoCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
// chaves de pose/estado interpoladas: [{ t, p: {...}, e: 'nomeDoEase' }]
function interpolar(chaves, t) {
  if (t <= chaves[0].t) return { ...chaves[0].p };
  for (let i = 1; i < chaves.length; i++) {
    const a = chaves[i - 1], b = chaves[i];
    if (t <= b.t) {
      const k = ease[b.e || 'inOutCubic'](inv(a.t, b.t, t)), p = {};
      for (const chave in b.p) p[chave] = lerp(a.p[chave], b.p[chave], k);
      return p;
    }
  }
  return { ...chaves[chaves.length - 1].p };
}

const MODO_RENDER = new URLSearchParams(location.search).has('render');
let mostrarGuia = new URLSearchParams(location.search).has('guia');
const tela = document.getElementById('c');
tela.width = W; tela.height = H; tela.style.aspectRatio = `${W} / ${H}`;
const ctx = tela.getContext('2d', { alpha: false });

// ---------------------------------------------------------------------- arquivos
const imgs = {};
function carregarImagem(src) {
  const img = new Image();
  img.decoding = 'async';
  img.src = encodeURI(src);
  return img.decode().then(() => img, () => { throw new Error('não carregou ' + src); });
}
// Quadros da gravação de tela: f_<índice a 30 fps da fonte>.jpg, ver docs/04-motion-e-templates.md
const GRAV = (typeof GRAVACAO !== 'undefined' && GRAVACAO) || null;
const quadros = new Map();   // índice -> Image pronta, ou a promessa dela
function indiceValido(i) {
  for (const [a, b] of GRAV.faixas) if (i >= a && i <= b) return i;
  let melhor = GRAV.faixas[0][0], dist = Infinity;
  for (const faixa of GRAV.faixas) for (const k of faixa) {
    if (Math.abs(k - i) < dist) { dist = Math.abs(k - i); melhor = k; }
  }
  return melhor;
}
function carregarQuadro(i) {
  i = indiceValido(i);
  if (quadros.has(i)) return Promise.resolve(quadros.get(i));
  const p = carregarImagem(GRAV.pasta + 'f_' + String(i).padStart(5, '0') + '.jpg')
    .then(img => { quadros.set(i, img); return img; });
  quadros.set(i, p);
  return p;
}
function quadroPronto(i) {
  const q = quadros.get(indiceValido(i));
  return q instanceof HTMLImageElement ? q : null;
}
// No render só fica na memória o que está perto do que se usa AGORA. Na rolagem e
// na transição são dois quadros ao mesmo tempo: poupar só um fazia a tela pular.
function descartarQuadrosLonge(emUso) {
  for (const k of quadros.keys()) if (emUso.every(i => Math.abs(k - i) > 120)) quadros.delete(k);
}

// ------------------------------------------------ WebGL: cartão plano em 3D
// Desenha um canvas qualquer como cartão com perspectiva de verdade. Mundo em px
// do vídeo, origem no canto de cima, y para baixo; z positivo afasta.
const G3 = (() => {
  const cv = novoCanvas(W, H);
  const gl = cv.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true, preserveDrawingBuffer: true });
  if (!gl) throw new Error('WebGL2 indisponível neste navegador');
  const FOCO = 1700;
  const vs = `#version 300 es
in vec2 aPos;
uniform mat4 uM;
uniform vec2 uTam;
out vec2 vUV;
void main() {
  vUV = aPos;
  gl_Position = uM * vec4((aPos.x - 0.5) * uTam.x, (aPos.y - 0.5) * uTam.y, 0.0, 1.0);
}`;
  const fs = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uTex;
uniform float uAlfa;
out vec4 cor;
void main() { cor = texture(uTex, vUV) * uAlfa; }`;
  function compilar(tipo, src) {
    const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, compilar(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, compilar(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const uM = gl.getUniformLocation(prog, 'uM');
  const uTam = gl.getUniformLocation(prog, 'uTam');
  const uAlfa = gl.getUniformLocation(prog, 'uAlfa');
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
  if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT,
    Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.viewport(0, 0, W, H);

  const mul = (a, b) => {
    const r = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let l = 0; l < 4; l++) {
      let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + l] * b[c * 4 + k]; r[c * 4 + l] = s;
    }
    return r;
  };
  const id = () => { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; };
  const trans = (x, y, z) => { const m = id(); m[12] = x; m[13] = y; m[14] = z; return m; };
  const esc = s => { const m = id(); m[0] = m[5] = m[10] = s; return m; };
  const rotX = a => { const m = id(), c = Math.cos(a), s = Math.sin(a); m[5] = c; m[6] = s; m[9] = -s; m[10] = c; return m; };
  const rotY = a => { const m = id(), c = Math.cos(a), s = Math.sin(a); m[0] = c; m[2] = -s; m[8] = s; m[10] = c; return m; };
  const rotZ = a => { const m = id(), c = Math.cos(a), s = Math.sin(a); m[0] = c; m[1] = s; m[4] = -s; m[5] = c; return m; };
  const proj = (() => {
    const m = new Float32Array(16);
    m[0] = FOCO / (W / 2); m[5] = -FOCO / (H / 2); m[11] = 1; m[15] = FOCO;
    return m;
  })();
  function modelo(p) {
    let m = trans(p.x - W / 2, p.y - H / 2, p.z || 0);
    m = mul(m, rotZ(p.rz || 0)); m = mul(m, rotY(p.ry || 0)); m = mul(m, rotX(p.rx || 0));
    return mul(m, esc(p.s ?? 1));
  }
  // ponto (px, py) do cartão, em px relativos ao centro dele -> px da tela
  function projetar(pose, px, py) {
    const m = mul(proj, modelo(pose));
    const x = m[0] * px + m[4] * py + m[12], y = m[1] * px + m[5] * py + m[13], w = m[3] * px + m[7] * py + m[15];
    return { x: (x / w * 0.5 + 0.5) * W, y: (0.5 - y / w * 0.5) * H, escala: FOCO / w * (pose.s ?? 1) };
  }
  function desenhar(destino, fonte, largura, altura, pose, alfa = 1) {
    if (alfa <= 0.001) return;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fonte);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.uniformMatrix4fv(uM, false, mul(proj, modelo(pose)));
    gl.uniform2f(uTam, largura, altura);
    gl.uniform1f(uAlfa, alfa);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    destino.drawImage(cv, 0, 0);
  }
  return { desenhar, projetar };
})();
// desenha um cartão (de novoCartao/cartaoVivo) em 3D
function cartao3D(c, card, pose, alfa = 1) { G3.desenhar(c, card.cv, card.l, card.a, pose, alfa); }

// ------------------------------------------------------------------------ fundo
// Degradê + névoa + luzes desfocadas + estrelas + luz de baixo que pulsa no bumbo;
// grão e vinheta por cima de tudo. As cores vêm da PALETA do projeto.
const fundo = {};
function gerarNebulosa(r, gw, gh, rgb, alfaMax, limiar) {
  const oitavas = [{ f: 3, a: 0.5 }, { f: 6, a: 0.25 }, { f: 12, a: 0.15 }, { f: 24, a: 0.1 }];
  const grades = oitavas.map(o => {
    const gx = o.f + 1, gy = Math.ceil(o.f * gh / gw) + 1, v = new Float32Array(gx * gy);
    for (let i = 0; i < v.length; i++) v[i] = r();
    return { gx, v, f: o.f, a: o.a };
  });
  const cv = novoCanvas(gw, gh), c = cv.getContext('2d'), img = c.createImageData(gw, gh);
  const suave = k => k * k * (3 - 2 * k);
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
    let n = 0;
    for (const g of grades) {
      const fx = x / gw * g.f, fy = y / gw * g.f, ix = Math.floor(fx), iy = Math.floor(fy);
      const dx = suave(fx - ix), dy = suave(fy - iy), b = iy * g.gx + ix;
      n += g.a * lerp(lerp(g.v[b], g.v[b + 1], dx), lerp(g.v[b + g.gx], g.v[b + g.gx + 1], dx), dy);
    }
    const a = clamp((n - limiar) / 0.38), i = (y * gw + x) * 4;
    img.data[i] = rgb[0]; img.data[i + 1] = rgb[1]; img.data[i + 2] = rgb[2];
    img.data[i + 3] = a * a * alfaMax * 255;
  }
  c.putImageData(img, 0, 0);
  return cv;
}
function gerarGrao(r, w, h) {
  const cv = novoCanvas(w, h), c = cv.getContext('2d'), img = c.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const v = 128 + (r() - 0.5) * 230;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  return cv;
}
function prepararFundo() {
  const r = mulberry32(2027);
  fundo.nebulosa = gerarNebulosa(mulberry32(11), W / 5, H / 5, PALETA.nevoa, 0.5, 0.40);
  fundo.fio = gerarNebulosa(mulberry32(23), W / 5, H / 5, PALETA.fio, 0.16, 0.50);
  fundo.estrelas = Array.from({ length: 170 }, () => ({
    x: r() * W, y: r() * H, tam: 0.6 + r() * 1.7, fase: r() * TAU, vel: 4 + r() * 12, brilho: 0.3 + r() * 0.7,
  }));
  fundo.bokeh = Array.from({ length: 16 }, (_, i) => ({
    x: r() * W, y: r() * H, raio: 50 + r() * 150, quente: i % 3 === 0, fase: r() * TAU,
    vx: (r() - 0.5) * 22, vy: (r() - 0.5) * 18, a: 0.07 + r() * 0.12,
  }));
  fundo.graos = Array.from({ length: 6 }, (_, i) => gerarGrao(mulberry32(100 + i), W / 2, H / 2));
}
// a luz de baixo pulsa em cada bumbo da trilha ("algo acontecendo a cada meio segundo")
function pulsoBatida(t) {
  if (!TRILHA.temBumbo(t)) return 0;
  return Math.exp(-(t % (60 / ARRANJO.bpm)) * 9);
}
function desenharFundo(c, t) {
  const [f0, f1, f2] = PALETA.fundo;
  let g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, f0); g.addColorStop(0.55, f1); g.addColorStop(1, f2);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  g = c.createRadialGradient(W / 2, H * 0.53, 0, W / 2, H * 0.53, H * 0.6);
  g.addColorStop(0, `rgba(${PALETA.halo},.55)`); g.addColorStop(1, `rgba(${PALETA.halo},0)`);
  c.fillStyle = g; c.fillRect(0, 0, W, H);

  c.save();
  c.imageSmoothingQuality = 'high';
  c.drawImage(fundo.nebulosa, -W * 0.1 + Math.sin(t * 0.05) * 60, -H * 0.08 - t * 5, W * 1.2, H * 1.2);
  c.globalCompositeOperation = 'lighter';
  c.drawImage(fundo.fio, -W * 0.13 + t * 4, -H * 0.06 + Math.cos(t * 0.07) * 50, W * 1.2, H * 1.2);

  const pulso = pulsoBatida(t);                         // luz de baixo
  c.save();
  c.translate(W / 2, H * 1.047); c.scale(1.7, 0.5);
  g = c.createRadialGradient(0, 0, 0, 0, 0, 760);
  g.addColorStop(0, `rgba(${PALETA.luzBaixo[0]},${0.42 + 0.14 * pulso})`);
  g.addColorStop(0.35, `rgba(${PALETA.luzBaixo[1]},${0.10 + 0.06 * pulso})`);
  g.addColorStop(1, `rgba(${PALETA.luzBaixo[0]},0)`);
  c.fillStyle = g; c.fillRect(-800, -800, 1600, 1600);
  c.restore();

  for (const b of fundo.bokeh) {
    const x = b.x + b.vx * t + Math.sin(t * 0.4 + b.fase) * 30;
    const y = b.y + b.vy * t + Math.cos(t * 0.33 + b.fase) * 26;
    const a = b.a * (0.75 + 0.25 * Math.sin(t * 0.9 + b.fase)) * (1 + 0.35 * pulso);
    const cor = b.quente ? PALETA.bokeh[0] : PALETA.bokeh[1];
    g = c.createRadialGradient(x, y, 0, x, y, b.raio);
    g.addColorStop(0, `rgba(${cor},${a})`); g.addColorStop(0.55, `rgba(${cor},${a * 0.45})`); g.addColorStop(1, `rgba(${cor},0)`);
    c.fillStyle = g; c.beginPath(); c.arc(x, y, b.raio, 0, TAU); c.fill();
  }
  for (const s of fundo.estrelas) {
    const y = ((s.y - s.vel * t) % H + H) % H;
    const a = s.brilho * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.7 + s.fase)));
    c.fillStyle = `rgba(${PALETA.estrelas},${a})`;
    c.beginPath(); c.arc(s.x, y, s.tam, 0, TAU); c.fill();
  }
  c.restore();
}
function desenharAcabamento(c, t) {
  const g = c.createRadialGradient(W / 2, H * 0.47, W * 0.43, W / 2, H / 2, H * 0.68);
  g.addColorStop(0, `rgba(${PALETA.vinheta},0)`); g.addColorStop(1, `rgba(${PALETA.vinheta},.6)`);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.save();
  c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.06; c.imageSmoothingEnabled = false;
  c.drawImage(fundo.graos[Math.floor(t * FPS) % fundo.graos.length], 0, 0, W, H);
  c.restore();
}

// ----------------------------------------------------------------------- texto
// Estilos prontos, feitos das fontes e cores do projeto. cor: 'destaque' = degradê
// com brilho; 'destaque-liso' = cor sólida de destaque; ou qualquer cor CSS.
const FT = FONTES.titulo.familia, FX = FONTES.texto.familia;
const F = {
  rotulo:     { familia: FX, peso: 600, tam: 30, espaco: 8, caixaAlta: true, cor: 'destaque-liso' },
  texto:      { familia: FX, peso: 400, tam: 42, cor: 'rgba(255,255,255,.88)' },
  textoForte: { familia: FX, peso: 500, tam: 48 },
  pequeno:    { familia: FX, peso: 500, tam: 34, espaco: 1, cor: 'rgba(255,255,255,.8)' },
  sub:        { familia: FX, peso: 500, tam: 40, cor: 'rgba(255,255,255,.92)' },
  subDestaque:{ familia: FX, peso: 700, tam: 40, cor: 'destaque-liso' },
  url:        { familia: FX, peso: 500, tam: 38, cor: 'rgba(255,255,255,.92)' },
  urlDestaque:{ familia: FX, peso: 600, tam: 38, cor: 'destaque-liso' },
  condicao:   { familia: FX, peso: 500, tam: 36, cor: 'rgba(255,255,255,.85)' },
  titulo:     { familia: FT, peso: 500, tam: 86 },
  tituloM:    { familia: FT, peso: 500, tam: 72 },
  destaqueP:  { familia: FT, peso: 600, italico: true, tam: 66, cor: 'destaque' },
  destaqueM:  { familia: FT, peso: 600, italico: true, tam: 78, cor: 'destaque' },
  destaqueGG: { familia: FT, peso: 600, italico: true, tam: 104, cor: 'destaque' },
  destaqueG:  { familia: FT, peso: 600, italico: true, tam: 172, cor: 'destaque' },
};
const emDestaque = f => Object.assign({}, f, { cor: 'destaque' });
function fonteCSS(f) { return `${f.italico ? 'italic ' : ''}${f.peso} ${f.tam}px "${f.familia}"`; }
function aplicarFonte(c, f) { c.font = fonteCSS(f); c.letterSpacing = (f.espaco || 0) + 'px'; }

function preencherDestaque(c, txt, x, y, tam, brilho = 1) {
  const [a, b, d] = PALETA.destaque;
  const g = c.createLinearGradient(0, y - tam * 0.78, 0, y + tam * 0.12);
  g.addColorStop(0, a); g.addColorStop(0.45, b); g.addColorStop(1, d);
  c.shadowColor = `rgba(${PALETA.brilho},${Math.min(0.9, 0.5 * brilho)})`;
  c.shadowBlur = tam * 0.26 * brilho;
  c.fillStyle = g;
  c.fillText(txt, x, y);
  c.shadowBlur = 0;
}
// Estado de uma palavra: entra subindo e desfocada, sai subindo e desfocando.
function estadoPalavra(t, t0, dur, tSaida, durSaida) {
  const e = inv(t0, t0 + dur, t);
  if (e <= 0) return null;
  const k = ease.outExpo(e);
  const est = { alfa: clamp(e * 2.4), dy: (1 - k) * 46, blur: (1 - k) * 16, escala: 0.9 + 0.1 * k };
  if (tSaida != null) {
    const s = inv(tSaida, tSaida + durSaida, t);
    if (s >= 1) return null;
    if (s > 0) {
      const q = ease.inCubic(s);
      est.alfa *= 1 - q; est.dy -= q * 42; est.blur += q * 12; est.escala *= 1 - 0.04 * q;
    }
  }
  return est;
}
function desenharPalavra(c, p, xCentro, y, est) {
  c.save();
  c.globalAlpha *= est.alfa;
  c.translate(xCentro, y + est.dy);
  c.scale(est.escala, est.escala);
  if (est.blur > 0.25) c.filter = `blur(${est.blur.toFixed(2)}px)`;
  aplicarFonte(c, p.f);
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  const x = -p.larg / 2;
  if (p.f.cor === 'destaque') preencherDestaque(c, p.txt, x, 0, p.f.tam, est.brilho ?? 1);
  else { c.fillStyle = p.f.cor === 'destaque-liso' ? PALETA.destaqueSolido : (p.f.cor || '#fff'); c.fillText(p.txt, x, 0); }
  c.restore();
}
// Uma linha centralizada, palavra por palavra.
//   L = { y, t0, palavras: [[texto, estilo]], passo, dur, saida, durSaida, passoSaida, x, junto }
//   junto: sem espaço entre as "palavras" (ex.: um endereço em duas cores)
// Regra: nunca duas linhas no mesmo lugar ao mesmo tempo. A que sai termina antes
// de a próxima entrar (legendas trocando: passoSaida 0).
function linha(c, t, L) {
  const passoSaida = L.passoSaida ?? 0.03, durSaida = L.durSaida ?? 0.32;
  if (t < L.t0 || (L.saida != null && t > L.saida + durSaida + passoSaida * L.palavras.length)) return;
  const pal = L.palavras.map(([txt, f]) => ({ txt: f.caixaAlta ? txt.toUpperCase() : txt, f }));
  for (const p of pal) {
    aplicarFonte(c, p.f);
    p.larg = c.measureText(p.txt).width - (p.f.espaco || 0);
  }
  const vaos = pal.slice(0, -1).map((p, i) => (L.junto ? 0 : Math.max(p.f.tam, pal[i + 1].f.tam) * 0.24));
  const total = pal.reduce((s, p) => s + p.larg, 0) + vaos.reduce((s, v) => s + v, 0);
  let x = (L.x ?? W / 2) - total / 2;
  pal.forEach((p, i) => {
    const est = estadoPalavra(t, L.t0 + i * (L.passo ?? 0.08), L.dur ?? 0.55,
      L.saida != null ? L.saida + i * passoSaida : null, durSaida);
    if (est) desenharPalavra(c, p, x + p.larg / 2, L.y, est);
    x += p.larg + (vaos[i] || 0);
  });
}
// Palavras em pancada que depois deslizam para uma linha só, menor, em outro lugar
// (ex.: "Zero" / "reajuste" viram o título da cena seguinte). É o MESMO texto do
// começo ao fim: nunca duas cópias do mesmo texto na tela.
//   o = { palavras: ['Zero','reajuste'], t0, centro: {x,y}, tam, linhas: [dy...],
//         morph: [t0,t1], destino: {y, tam}, saida: [t0,t1], brilho: [t0,t1] }
function textoPancada(c, t, o) {
  const k = inv(o.t0 - 0.02, o.t0 + 0.5, t), kSai = o.saida ? inv(o.saida[0], o.saida[1], t) : 0;
  if (k <= 0 || kSai >= 1) return;
  const e = ease.outExpo(k), q = ease.inCubic(kSai);
  const m = o.morph ? ease.inOutCubic(inv(o.morph[0], o.morph[1], t)) : 0;
  const T0 = o.tam, T1 = o.destino ? o.destino.tam : o.tam, cx = o.centro.x, cy = o.centro.y, pancada = lerp(1.5, 1, e);
  c.save();
  c.font = `italic 600 ${T1}px "${FT}"`; c.letterSpacing = '0px';
  const larguras = o.palavras.map(p => c.measureText(p).width);
  const total = larguras.reduce((s, w) => s + w, 0) + T1 * 0.24 * (o.palavras.length - 1);
  let xFim = W / 2 - total / 2;
  const destinos = larguras.map(w => { const d = xFim + w / 2; xFim += w + T1 * 0.24; return d; });
  c.globalAlpha = clamp(k * 3) * (1 - q);
  const blur = (1 - e) * 24 + Math.sin(m * Math.PI) * 3 + q * 10;
  if (blur > 0.3) c.filter = `blur(${blur.toFixed(2)}px)`;
  c.font = `italic 600 ${T0}px "${FT}"`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  const brilho = 1 + 0.6 * pico(t, o.t0 + 0.05, 0.05, 0.3);
  o.palavras.forEach((txt, i) => {
    const ay = cy + o.linhas[i];
    // o destino acompanha o tamanho atual das letras: ainda grandes, elas param mais
    // afastadas, e as palavras nunca se encostam no caminho
    const s = pancada * lerp(1, T1 / T0, m), bx = W / 2 + (destinos[i] - W / 2) * (s / (T1 / T0));
    c.save();
    c.translate(lerp(cx, bx, m), lerp(cy + (ay - cy) * pancada, o.destino ? o.destino.y : ay, m) - q * 40);
    c.scale(s, s);
    preencherDestaque(c, txt, 0, 0, T0, brilho);
    c.restore();
  });
  // faixa de luz atravessando as letras, enquanto ainda estão grandes
  const p = o.brilho ? inv(o.brilho[0], o.brilho[1], t) : 0;
  if (p > 0 && p < 1 && m === 0) {
    const pos = lerp(-0.2, 1.2, ease.inOutSine(p));
    c.translate(cx, cy); c.scale(pancada, pancada);
    const g = c.createLinearGradient(-520, -260, 520, 260);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    for (const [dk, a] of [[-0.12, 0], [-0.03, 0.7], [0, 0.95], [0.03, 0.7], [0.12, 0]]) {
      if (pos + dk > 0 && pos + dk < 1) g.addColorStop(pos + dk, `rgba(255,255,255,${a})`);
    }
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = g;
    o.palavras.forEach((txt, i) => c.fillText(txt, 0, o.linhas[i]));
  }
  c.restore();
}

// ------------------------------------------------------ brilhos e faíscas
// lista = [{ t, x, y, forca, raio }]
function desenharClaroes(c, t, lista) {
  c.save(); c.globalCompositeOperation = 'lighter';
  for (const f of lista) {
    const a = f.forca * pico(t, f.t, 0.07, 0.22);
    if (a < 0.01) continue;
    const g = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.raio);
    g.addColorStop(0, `rgba(255,246,214,${a})`); g.addColorStop(0.35, `rgba(${PALETA.brilho},${a * 0.45})`);
    g.addColorStop(1, `rgba(${PALETA.brilho},0)`);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  c.restore();
}
// lista = [{ t, x, y, n, semente, vel, dur, anel? }]  (anel: nascem num círculo)
function desenharFaiscas(c, t, lista) {
  c.save(); c.globalCompositeOperation = 'lighter';
  for (const f of lista) {
    const k = (t - f.t) / f.dur;
    if (k < 0 || k > 1) continue;
    const r = mulberry32(f.semente * 977);
    for (let i = 0; i < f.n; i++) {
      const ang = r() * TAU, v = f.vel * (0.35 + 0.65 * r()), tam = 2 + 3 * r(), tom = r(), vida = 0.55 + 0.45 * r();
      if (k > vida) continue;
      const kk = k / vida;
      const x0 = f.anel ? f.x + Math.cos(ang) * f.anel : f.x, y0 = f.anel ? f.y + Math.sin(ang) * f.anel : f.y;
      const d = v * (1 - Math.pow(1 - kk, 3)) * f.dur * 0.45;
      const x = x0 + Math.cos(ang) * d, y = y0 + Math.sin(ang) * d + 70 * kk * kk;
      c.fillStyle = `rgba(255,${(205 + tom * 45) | 0},${(90 + tom * 90) | 0},${(1 - kk) * 0.9})`;
      c.beginPath(); c.arc(x, y, tam * (1 - 0.5 * kk), 0, TAU); c.fill();
    }
  }
  c.restore();
}
function halo(c, x, y, raio, rgb, alfa) {
  if (alfa <= 0.005) return;
  const g = c.createRadialGradient(x, y, 0, x, y, raio);
  g.addColorStop(0, `rgba(${rgb},${alfa})`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g;
  c.beginPath(); c.arc(x, y, raio, 0, TAU); c.fill(); c.restore();
}
function desenharCheck(c, x, y, r, cor, prog = 1) {
  if (prog <= 0) return;
  c.save();
  c.strokeStyle = cor; c.lineWidth = r * 0.2; c.lineCap = 'round'; c.lineJoin = 'round';
  const p = [[x - r * 0.42, y + r * 0.02], [x - r * 0.12, y + r * 0.32], [x + r * 0.45, y - r * 0.3]];
  const l1 = Math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1]), l2 = Math.hypot(p[2][0] - p[1][0], p[2][1] - p[1][1]);
  const d = prog * (l1 + l2);
  c.beginPath(); c.moveTo(...p[0]);
  if (d <= l1) c.lineTo(lerp(p[0][0], p[1][0], d / l1), lerp(p[0][1], p[1][1], d / l1));
  else { c.lineTo(...p[1]); c.lineTo(lerp(p[1][0], p[2][0], (d - l1) / l2), lerp(p[1][1], p[2][1], (d - l1) / l2)); }
  c.stroke();
  c.restore();
}

// ------------------------------------------------ o sol, o anel e o selo
// O "fio" que atravessa o vídeo (ex.: um círculo da logo da marca). O projeto
// calcula o estado a cada t; aqui só se desenha.
//   s = { x, y, r, anel (0 disco .. 1 anel), fecha (0..1), alfa, brilho }
function desenharRaios(c, s, t, forca) {
  c.save();
  c.translate(s.x, s.y); c.rotate(t * 0.12);
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i++) {
    c.rotate(TAU / 14);
    const a = 0.055 * forca * (0.6 + 0.4 * Math.sin(t * 2 + i * 1.7)) * s.brilho;
    const g = c.createLinearGradient(0, 0, 0, -s.r * 5.5);
    g.addColorStop(0, `rgba(${PALETA.brilho},${a})`); g.addColorStop(1, `rgba(${PALETA.brilho},0)`);
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-s.r * 0.18, 0); c.lineTo(s.r * 0.18, 0); c.lineTo(s.r * 0.6, -s.r * 5.5); c.lineTo(-s.r * 0.6, -s.r * 5.5);
    c.closePath(); c.fill();
  }
  c.restore();
}
function desenharSol(c, s, t) {
  if (!s || s.alfa <= 0) return;
  const anel = s.anel || 0, fecha = s.fecha || 0;
  c.save();
  c.globalAlpha = s.alfa;
  halo(c, s.x, s.y, s.r * 3.4, PALETA.brilho, 0.4 * s.brilho * (1 - 0.55 * anel));
  if (anel < 1) {
    desenharRaios(c, s, t, 1 - anel);
    c.globalAlpha = s.alfa * (1 - anel);                 // disco de luz, não bola (sem reflexo de lado)
    halo(c, s.x, s.y, s.r * 1.7, PALETA.brilho, 0.5 * s.brilho);
    const [a, b, d] = PALETA.destaque;
    const g = c.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
    g.addColorStop(0, '#fffdf3'); g.addColorStop(0.42, a); g.addColorStop(0.78, b); g.addColorStop(1, PALETA.destaqueSolido);
    c.save();
    c.shadowColor = `rgba(${PALETA.brilho},.95)`; c.shadowBlur = 70;
    c.fillStyle = g; c.beginPath(); c.arc(s.x, s.y, s.r, 0, TAU); c.fill();
    c.restore();
  }
  if (anel > 0) {                                        // o trilho de um medidor
    c.globalAlpha = s.alfa * anel;
    c.strokeStyle = 'rgba(255,255,255,.10)'; c.lineWidth = lerp(14, 6, fecha);
    c.beginPath(); c.arc(s.x, s.y, s.r, 0, TAU); c.stroke();
  }
  c.restore();
}
// Medidor sobre o anel: arco que enche, marcas que acendem e o número que conta.
//   o = { prog (0..1), valor, marcas, cima: 'PARA OS', baixo: 'primeiros', entra (0..1), pulso }
function desenharMedidor(c, s, o) {
  const fecha = s.fecha || 0;
  c.save();
  c.globalAlpha = s.alfa * (s.anel ?? 1);
  if (o.prog > 0) {
    c.save();
    c.lineCap = 'round'; c.lineWidth = lerp(14, 6, fecha);
    c.shadowColor = `rgba(${PALETA.brilho},.85)`; c.shadowBlur = 26 * (1 + 0.8 * (o.pulso || 0));
    const [a, b, d] = PALETA.destaque;
    const g = c.createConicGradient(-Math.PI / 2, s.x, s.y);
    g.addColorStop(0, d); g.addColorStop(0.5, a); g.addColorStop(1, b);
    c.strokeStyle = g;
    c.beginPath(); c.arc(s.x, s.y, s.r, -Math.PI / 2, -Math.PI / 2 + TAU * o.prog); c.stroke();
    c.restore();
  }
  const aMarcas = 1 - fecha * 1.6;
  if (o.marcas && aMarcas > 0) {
    c.save(); c.lineCap = 'round'; c.lineWidth = 4;
    for (let i = 0; i < o.marcas; i++) {
      const ang = -Math.PI / 2 + (i + 0.5) / o.marcas * TAU, acesa = o.prog * o.marcas > i + 0.5;
      const r1 = s.r + 24, r2 = s.r + (acesa ? 44 : 38);
      c.strokeStyle = acesa ? `rgba(${PALETA.brilho},${0.95 * aMarcas})` : `rgba(255,255,255,${0.14 * aMarcas})`;
      c.beginPath();
      c.moveTo(s.x + Math.cos(ang) * r1, s.y + Math.sin(ang) * r1);
      c.lineTo(s.x + Math.cos(ang) * r2, s.y + Math.sin(ang) * r2);
      c.stroke();
    }
    c.restore();
  }
  const aNum = clamp((o.entra ?? 1) * (1 - fecha * 2));
  if (aNum > 0) {
    const n = Math.round(o.valor * o.prog), pulso = 1 + 0.07 * (o.pulso || 0), kNum = ease.outExpo(o.entra ?? 1);
    c.globalAlpha *= aNum;
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    if (o.cima) { aplicarFonte(c, F.pequeno); c.fillStyle = 'rgba(255,255,255,.78)'; c.fillText(o.cima, s.x, s.y - s.r * 0.55); }
    c.save();
    c.translate(s.x, s.y + s.r * 0.3); c.scale(lerp(0.8, 1, kNum) * pulso, lerp(0.8, 1, kNum) * pulso);
    c.font = `600 ${Math.round(s.r * 0.98)}px "${FT}"`; c.letterSpacing = '0px';
    c.shadowColor = `rgba(${PALETA.brilho},.55)`; c.shadowBlur = 40;
    c.fillStyle = '#ffffff';
    c.fillText(String(n), 0, 0);
    c.restore();
    if (o.baixo) {
      aplicarFonte(c, { familia: FX, peso: 600, tam: 38, espaco: 1 });
      c.fillStyle = PALETA.destaqueSolido;
      c.fillText(o.baixo, s.x, s.y + s.r * 0.62);
    }
  }
  c.restore();
}
// selo: disco de luz com ✓ (fecha um "passo final", pousa sobre a logo no fim)
//   s = { x, y, r, check (0..1), alfa }
function desenharSelo(c, s) {
  if (!s || s.r <= 0.5 || s.alfa <= 0) return;
  c.save();
  c.globalAlpha = s.alfa;
  halo(c, s.x, s.y, s.r * 2.6, PALETA.brilho, 0.45);
  const g = c.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
  g.addColorStop(0, '#fff6c8'); g.addColorStop(0.5, PALETA.destaque[0]); g.addColorStop(1, PALETA.destaqueSolido);
  c.shadowColor = `rgba(${PALETA.brilho},.9)`; c.shadowBlur = 50;
  c.fillStyle = g; c.beginPath(); c.arc(s.x, s.y, s.r, 0, TAU); c.fill();
  c.shadowBlur = 0;
  desenharCheck(c, s.x, s.y + s.r * 0.02, s.r * 0.62, PALETA.escuro, s.check || 0);
  c.restore();
}

// ------------------------------------------------------ trilha de passos
// Bolinhas numeradas ligadas por uma linha: nascem juntas, sobem para o topo e
// acendem a cada passo; passo que ficou para trás ganha ✓.
//   o = { n, tempos: [início de cada passo..., fim], nascer: t, subir: [t0,t1],
//         sumir: [t0,t1], yMeio, yTopo, espMeio, espTopo, raioMeio, raioTopo }
function desenharTrilhaPassos(c, t, o) {
  if (t < o.nascer || (o.sumir && t > o.sumir[1])) return;
  const kSobe = ease.inOutCubic(inv(o.subir[0], o.subir[1], t));
  const y = lerp(o.yMeio ?? 1180, o.yTopo ?? 292, kSobe), esp = lerp(o.espMeio ?? 190, o.espTopo ?? 116, kSobe);
  const raio = lerp(o.raioMeio ?? 52, o.raioTopo ?? 31, kSobe);
  const idx = [...Array(o.n).keys()];
  const xs = idx.map(i => W / 2 + (i - (o.n - 1) / 2) * esp);
  const nasc = idx.map(i => inv(o.nascer + 0.02 + i * 0.07, o.nascer + 0.52 + i * 0.07, t));
  let atual = 0;
  for (let i = 0; i < o.tempos.length; i++) if (t >= o.tempos[i]) atual = i + 1;
  const k = atual > 0 ? inv(o.tempos[atual - 1], o.tempos[atual - 1] + 0.4, t) : 0;
  c.save();
  if (o.sumir) c.globalAlpha = 1 - ease.inCubic(inv(o.sumir[0], o.sumir[1], t));
  const kLinha = ease.outCubic(inv(o.nascer + 0.3, o.nascer + 0.85, t));
  c.lineCap = 'round';
  c.strokeStyle = 'rgba(255,255,255,.16)'; c.lineWidth = lerp(4, 3, kSobe);
  c.beginPath(); c.moveTo(xs[0], y); c.lineTo(lerp(xs[0], xs[o.n - 1], kLinha), y); c.stroke();
  if (atual >= 2) {                                      // progresso até o passo em que estamos
    const alvo = Math.min(atual, o.n) - 1;
    const xFim = atual > o.n ? xs[o.n - 1] : lerp(xs[alvo - 1], xs[alvo], ease.inOutCubic(k));
    c.strokeStyle = PALETA.destaqueSolido; c.shadowColor = `rgba(${PALETA.brilho},.7)`; c.shadowBlur = 12;
    c.beginPath(); c.moveTo(xs[0], y); c.lineTo(xFim, y); c.stroke();
    c.shadowBlur = 0;
  }
  for (const i of idx) {
    const n = i + 1, kn = ease.outBack(nasc[i], 1.8), r = raio * clamp(nasc[i] * 1.6);
    if (r <= 0.5) continue;
    const x = lerp(W / 2, xs[i], kn), feito = n < atual, ativo = n === atual;
    const kAtivo = ativo ? ease.outCubic(k) : feito ? 1 : 0;
    if (ativo) {             // halo que pulsa a cada segundo no passo em que estamos
      const q = ((t - o.tempos[i]) % 1.0) / 1.0;
      c.strokeStyle = `rgba(${PALETA.brilho},${0.55 * (1 - q) * kAtivo})`; c.lineWidth = 2;
      c.beginPath(); c.arc(x, y, r * (1.15 + 0.7 * q), 0, TAU); c.stroke();
      halo(c, x, y, r * 3.2, PALETA.brilho, 0.32 * kAtivo);
    }
    c.fillStyle = PALETA.escuro;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    if (kAtivo > 0) {
      const g = c.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
      g.addColorStop(0, PALETA.destaque[0]); g.addColorStop(0.6, PALETA.destaque[1]); g.addColorStop(1, PALETA.destaque[2]);
      c.save(); c.globalAlpha *= kAtivo * (feito ? 0.92 : 1);
      if (ativo) { c.shadowColor = `rgba(${PALETA.brilho},.8)`; c.shadowBlur = 22; }
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      c.restore();
    }
    c.strokeStyle = atual === 0 ? `rgba(${PALETA.brilho},.85)` : `rgba(${PALETA.brilho},${lerp(0.5, 0.9, kAtivo)})`;
    c.lineWidth = lerp(3, 2.5, kSobe);
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
    if (feito) {
      desenharCheck(c, x, y, r * 0.95, PALETA.escuro, ease.outCubic(inv(o.tempos[i + 1], o.tempos[i + 1] + 0.35, t)));
    } else {
      c.save();
      c.font = `600 ${Math.round(r * 1.12)}px "${FT}"`; c.letterSpacing = '0px';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = kAtivo > 0.5 ? PALETA.escuro : 'rgba(255,255,255,.9)';
      c.fillText(String(n), x, y + r * 0.04);
      c.restore();
    }
  }
  c.restore();
}

// ------------------------------------------------------------------ o celular
// Desenhado de frente num canvas próprio (com folga transparente, para a borda sair
// macia) e posto em 3D pelo G3. A tela mostra a MONTAGEM do roteiro: quadros da
// gravação (com os BORROES de privacidade) ou uma imagem de ARQUIVOS.
const CEL = { res: 1.5, telaL: 470, telaA: 1018, borda: 13, raio: 66, raioTela: 54, folga: 24 };
if (GRAV) CEL.telaA = Math.round(CEL.telaL * GRAV.altura / GRAV.largura);   // proporção da gravação
CEL.corpoL = CEL.telaL + 2 * CEL.borda;
CEL.corpoA = CEL.telaA + 2 * CEL.borda;
CEL.l = CEL.corpoL + 2 * CEL.folga;
CEL.a = CEL.corpoA + 2 * CEL.folga;
const telaCel = novoCanvas(Math.round(CEL.l * CEL.res), Math.round(CEL.a * CEL.res));
const cCel = telaCel.getContext('2d');
// ponto da tela do celular (0..1) -> coordenada local do cartão 3D (px a partir do centro)
function localDaTela(u, v) {
  return { x: -CEL.l / 2 + CEL.folga + CEL.borda + u * CEL.telaL, y: -CEL.a / 2 + CEL.folga + CEL.borda + v * CEL.telaA };
}
const MONT = (typeof MONTAGEM !== 'undefined' && MONTAGEM) || [];
const TOQ = (typeof TOQUES !== 'undefined' && TOQUES) || [];
const BORR = (typeof BORROES !== 'undefined' && BORROES) || [];
function trechoEm(t) {
  for (let i = 0; i < MONT.length; i++) if (t >= MONT[i].v0 && t < MONT[i].v1) return i;
  return -1;
}
function fonteDoTrecho(m, t) {
  if (m.imagem) return { imagem: m.imagem };
  return { s: m.s0 + (Math.min(t, m.v1) - m.v0) * (m.vel || 0) };
}
function telaNoTempo(t) {
  const i = trechoEm(t);
  if (i < 0) return null;
  const m = MONT[i];
  if (m.rolagem) {
    const k = inv(m.v0, m.v1, t);
    return { a: { s: m.rolagem[0] }, b: { s: m.rolagem[1] }, mix: ease.inOutCubic(k), borrao: Math.sin(k * Math.PI), faixa: m.faixa };
  }
  const atual = fonteDoTrecho(m, t);
  if (m.funde && i > 0 && t < m.v0 + m.funde) {
    return { a: fonteDoTrecho(MONT[i - 1], m.v0), b: atual, mix: ease.inOutSine(inv(m.v0, m.v0 + m.funde, t)), borrao: 0 };
  }
  return { a: atual, b: null, mix: 0, borrao: 0 };
}
function indicesDaTela(t) {
  if (!GRAV) return [];
  const st = telaNoTempo(t);
  if (!st) return [];
  return [st.a, st.b].filter(f => f && f.s != null).map(f => Math.round(f.s * GRAV.fps));
}
// Borrão de privacidade: a mesma imagem, desfocada, só dentro de cada retângulo,
// mais um véu claro que tira o contraste que sobra. O tempo testado é o do quadro
// que aparece de fato (arredondado), não o contínuo: senão a borda escorrega um quadro.
function borrar(c, img, s, x, y, w, h) {
  const GL = GRAV.largura, GA = GRAV.altura;
  const fx = img.naturalWidth / GL, fy = img.naturalHeight / GA, m = 16;
  s = Math.round(s * GRAV.fps) / GRAV.fps;
  for (const b of BORR) {
    if (s < b.s0 || s >= b.s1) continue;
    for (const [x0, y0, x1, y1] of b.r) {
      const sx0 = Math.max(0, x0 - m), sy0 = Math.max(0, y0 - m), sx1 = Math.min(GL, x1 + m), sy1 = Math.min(GA, y1 + m);
      const px = v => x + v / GL * w, py = v => y + v / GA * h;
      c.save();
      c.beginPath(); c.roundRect(px(x0), py(y0), px(x1) - px(x0), py(y1) - py(y0), 6); c.clip();
      c.filter = 'blur(9px)';
      c.drawImage(img, sx0 * fx, sy0 * fy, (sx1 - sx0) * fx, (sy1 - sy0) * fy, px(sx0), py(sy0), px(sx1) - px(sx0), py(sy1) - py(sy0));
      c.filter = 'none';
      c.fillStyle = b.veu || 'rgba(255,255,255,.5)';
      c.fillRect(px(x0), py(y0), px(x1) - px(x0), py(y1) - py(y0));
      c.restore();
    }
  }
}
function desenharFonte(c, f, x, y, w, h, alfa) {
  if (!f || alfa <= 0.001) return;
  c.save();
  c.globalAlpha *= alfa;
  if (f.imagem) { if (imgs[f.imagem]) c.drawImage(imgs[f.imagem], x, y, w, h); }
  else if (GRAV) {
    const q = quadroPronto(Math.round(f.s * GRAV.fps));
    if (q) { c.drawImage(q, x, y, w, h); borrar(c, q, f.s, x, y, w, h); }
  }
  c.restore();
}
function desenharGravacao(c, t, x, y, w, h) {
  const st = telaNoTempo(t);
  if (!st) return;
  desenharFonte(c, st.a, x, y, w, h, 1);
  desenharFonte(c, st.b, x, y, w, h, st.mix);
  if (st.borrao > 0.02 && GRAV) {
    // rolagem: só a faixa do meio (entre o cabeçalho do site e a barra fixa) escorre
    const [fTopo, fBase] = st.faixa || [0.2, 0.8];
    const topo = y + h * fTopo, base = y + h * fBase;
    const q = quadroPronto(Math.round((st.mix < 0.5 ? st.a : st.b).s * GRAV.fps)), amp = 90 * st.borrao;
    c.save();
    c.beginPath(); c.rect(x, topo, w, base - topo); c.clip();
    c.filter = `blur(${(1.5 * st.borrao).toFixed(2)}px)`;
    if (q) for (let k = 0; k < 13; k++) {
      c.globalAlpha = 0.17;
      c.drawImage(q, x, y + (k / 12 - 0.5) * 2 * amp, w, h);
    }
    c.restore();
  }
}
function desenharToque(c, cx, cy, t, t0) {
  const d = t - t0;
  if (d < -0.2 || d > 0.85) return;
  const cor = PALETA.brilho;
  c.save();
  if (d < 0) {                                  // o dedo chegando
    const k = inv(-0.2, 0, d);
    c.fillStyle = `rgba(${cor},${0.6 * k})`;
    c.beginPath(); c.arc(cx, cy, lerp(48, 26, ease.outCubic(k)), 0, TAU); c.fill();
  } else {
    const k1 = ease.outCubic(inv(0, 0.55, d)), k2 = ease.outCubic(inv(0.1, 0.75, d));
    c.strokeStyle = `rgba(${cor},${0.95 * (1 - k1)})`; c.lineWidth = lerp(8, 1.5, k1);
    c.beginPath(); c.arc(cx, cy, lerp(26, 125, k1), 0, TAU); c.stroke();
    c.strokeStyle = `rgba(255,224,122,${0.7 * (1 - k2)})`; c.lineWidth = lerp(4, 1, k2);
    c.beginPath(); c.arc(cx, cy, lerp(20, 175, k2), 0, TAU); c.stroke();
    c.fillStyle = `rgba(${cor},${0.6 * (1 - inv(0, 0.32, d))})`;
    c.beginPath(); c.arc(cx, cy, 26, 0, TAU); c.fill();
  }
  c.restore();
}
// escuro: 0..1, escurece a tela (para uma notificação aparecer na frente, por ex.)
function montarCelular(t, escuro = 0) {
  const c = cCel, r = CEL.res;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, telaCel.width, telaCel.height);
  c.setTransform(r, 0, 0, r, 0, 0);
  const x0 = CEL.folga, y0 = CEL.folga;
  let g = c.createLinearGradient(x0, y0, x0 + CEL.corpoL, y0 + CEL.corpoA);   // corpo
  g.addColorStop(0, '#2c3240'); g.addColorStop(0.45, '#12151c'); g.addColorStop(1, '#232834');
  c.fillStyle = g; c.beginPath(); c.roundRect(x0, y0, CEL.corpoL, CEL.corpoA, CEL.raio); c.fill();
  c.fillStyle = '#1b1f28';
  c.beginPath();
  c.roundRect(x0 - 3, y0 + 210, 5, 70, 2); c.roundRect(x0 - 3, y0 + 300, 5, 70, 2);
  c.roundRect(x0 + CEL.corpoL - 2, y0 + 250, 5, 110, 2);
  c.fill();
  g = c.createLinearGradient(x0, y0, x0 + CEL.corpoL, y0 + CEL.corpoA);         // aro de luz
  g.addColorStop(0, 'rgba(255,255,255,.6)'); g.addColorStop(0.3, 'rgba(255,255,255,.08)');
  g.addColorStop(0.7, 'rgba(255,255,255,.05)'); g.addColorStop(1, `rgba(${PALETA.brilho},.5)`);
  c.strokeStyle = g; c.lineWidth = 2;
  c.beginPath(); c.roundRect(x0 + 1, y0 + 1, CEL.corpoL - 2, CEL.corpoA - 2, CEL.raio - 1); c.stroke();
  const tx = x0 + CEL.borda, ty = y0 + CEL.borda;                                 // tela
  c.save();
  c.beginPath(); c.roundRect(tx, ty, CEL.telaL, CEL.telaA, CEL.raioTela); c.clip();
  c.fillStyle = '#ffffff'; c.fillRect(tx, ty, CEL.telaL, CEL.telaA);
  c.imageSmoothingQuality = 'high';
  desenharGravacao(c, t, tx, ty, CEL.telaL, CEL.telaA);
  for (const tq of TOQ) desenharToque(c, tx + tq.u * CEL.telaL, ty + tq.v * CEL.telaA, t, tq.t);
  if (escuro > 0) { c.fillStyle = `rgba(5,13,31,${0.55 * escuro})`; c.fillRect(tx, ty, CEL.telaL, CEL.telaA); }
  c.fillStyle = '#05070a';
  c.beginPath(); c.roundRect(tx + CEL.telaL / 2 - 46, ty + 11, 92, 26, 13); c.fill();
  g = c.createLinearGradient(tx, ty, tx + CEL.telaL * 0.9, ty + CEL.telaA * 0.55);
  g.addColorStop(0, 'rgba(255,255,255,.10)'); g.addColorStop(0.5, 'rgba(255,255,255,.02)'); g.addColorStop(0.51, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(tx, ty, CEL.telaL, CEL.telaA);
  c.restore();
}
const pose = (y, s = 1, rx = 0.04, ry = 0, z = 0, rz = 0, x = W / 2) => ({ x, y, z, rx, ry, rz, s });
function luzAtrasDoCelular(c, p) {
  const centro = G3.projetar(p, 0, 0), base = G3.projetar(p, 0, CEL.a / 2 - 40);
  halo(c, centro.x, centro.y, 760 * centro.escala, PALETA.luzBaixo[0], 0.30);
  halo(c, centro.x + 120, centro.y + 260, 520 * centro.escala, PALETA.brilho, 0.13);
  c.save();
  c.translate(base.x, base.y + 50); c.scale(1, 0.22);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, 330 * base.escala);
  g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, 330 * base.escala, 0, TAU); c.fill();
  c.restore();
}
function desenharCelular(c, t, p, escuro = 0) {
  montarCelular(t, escuro);
  luzAtrasDoCelular(c, p);
  G3.desenhar(c, telaCel, CEL.l, CEL.a, p);
}

// ------------------------------------------------------------ cartões em 3D
const cartoes = {};
function novoCartao(l, a, desenhar) {
  const r = 2, f = 28;
  const cv = novoCanvas((l + 2 * f) * r, (a + 2 * f) * r), c = cv.getContext('2d');
  c.scale(r, r); c.translate(f, f);
  desenhar(c, l, a);
  return { cv, l: l + 2 * f, a: a + 2 * f };
}
// cartão redesenhado a cada quadro (sino que balança, assinatura que se escreve)
const vivos = {};
function cartaoVivo(nome, l, a, desenhar) {
  const r = 2, f = 28;
  let v = vivos[nome];
  if (!v) {
    const cv = novoCanvas((l + 2 * f) * r, (a + 2 * f) * r);
    v = vivos[nome] = { cv, c: cv.getContext('2d'), l: l + 2 * f, a: a + 2 * f };
  }
  v.c.setTransform(1, 0, 0, 1, 0, 0);
  v.c.clearRect(0, 0, v.cv.width, v.cv.height);
  v.c.setTransform(r, 0, 0, r, f * r, f * r);
  desenhar(v.c, l, a);
  return v;
}
// botão no desenho do site do cliente (fundo de destaque, texto escuro)
function cartaoBotao(texto) {
  const chave = 'botao:' + texto;
  return cartoes[chave] || (cartoes[chave] = novoCartao(600, 112, (c, l, a) => {
    c.shadowColor = `rgba(${PALETA.brilho},.6)`; c.shadowBlur = 24;
    const g = c.createLinearGradient(0, 0, 0, a);
    g.addColorStop(0, PALETA.destaque[0]); g.addColorStop(0.4, PALETA.destaque[1]); g.addColorStop(1, PALETA.destaqueSolido);
    c.fillStyle = g; c.beginPath(); c.roundRect(0, 0, l, a, 12); c.fill();
    c.shadowBlur = 0;
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(14, 1.5); c.lineTo(l - 14, 1.5); c.stroke();
    c.fillStyle = PALETA.escuro; c.font = `600 42px "${FX}"`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(texto, l / 2, a / 2 + 2);
  }));
}
// selo de endereço com cadeado; o caminho sai na cor de destaque
function cartaoEndereco(dominio, caminho = '') {
  const chave = 'end:' + dominio + caminho;
  if (cartoes[chave]) return cartoes[chave];
  const medir = novoCanvas(10, 10).getContext('2d');
  medir.font = `500 32px "${FX}"`;
  const l1 = medir.measureText(dominio).width, l2 = medir.measureText(caminho).width;
  return (cartoes[chave] = novoCartao(36 + 34 + 14 + l1 + l2 + 36, 88, (c, l, a) => {
    c.fillStyle = 'rgba(12,30,62,.82)';
    c.beginPath(); c.roundRect(0, 0, l, a, a / 2); c.fill();
    const g = c.createLinearGradient(0, 0, 0, a);
    g.addColorStop(0, 'rgba(255,255,255,.14)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fill();
    c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 1.5; c.stroke();
    const cx = 36 + 17, cy = a / 2;                      // cadeado
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 3.2;
    c.beginPath(); c.arc(cx, cy - 6, 8, Math.PI, 0); c.lineTo(cx + 8, cy); c.moveTo(cx - 8, cy - 6); c.lineTo(cx - 8, cy); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.roundRect(cx - 12, cy - 1, 24, 18, 4); c.fill();
    c.font = `500 32px "${FX}"`; c.textBaseline = 'middle'; c.textAlign = 'left';
    const x = 36 + 34 + 14;
    c.fillStyle = 'rgba(255,255,255,.92)'; c.fillText(dominio, x, a / 2 + 1);
    c.fillStyle = PALETA.destaqueSolido; c.fillText(caminho, x + l1, a / 2 + 1);
  }));
}
function desenharSino(c, r, cor) {
  c.fillStyle = cor;
  c.beginPath();
  c.moveTo(-r * 0.75, r * 0.45);
  c.quadraticCurveTo(-r * 0.62, r * 0.28, -r * 0.62, -r * 0.1);
  c.bezierCurveTo(-r * 0.62, -r * 0.62, -r * 0.35, -r * 0.88, 0, -r * 0.88);
  c.bezierCurveTo(r * 0.35, -r * 0.88, r * 0.62, -r * 0.62, r * 0.62, -r * 0.1);
  c.quadraticCurveTo(r * 0.62, r * 0.28, r * 0.75, r * 0.45);
  c.closePath(); c.fill();
  c.beginPath(); c.arc(0, r * 0.62, r * 0.17, 0, TAU); c.fill();       // badalo
  c.beginPath(); c.arc(0, -r * 0.95, r * 0.1, 0, TAU); c.fill();       // alça
}
// Notificação genérica, no desenho do próprio vídeo: não imita a tela de nenhum
// aplicativo real (vitrine honesta), só diz de onde a mensagem chega.
//   o = { rotulo: 'AGENDA ELETRÔNICA', titulo, sub }
function cartaoNotificacao(o, balanco = 0) {
  return cartaoVivo('notif:' + o.titulo, 760, 196, (c, l, a) => {
    c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 26;
    c.fillStyle = 'rgba(248,249,252,.97)'; c.beginPath(); c.roundRect(0, 0, l, a, 34); c.fill();
    c.shadowBlur = 0;
    c.strokeStyle = `rgba(${PALETA.brilho},.6)`; c.lineWidth = 2; c.stroke();
    const cx = 94, cy = a / 2;
    c.fillStyle = PALETA.escuro; c.beginPath(); c.arc(cx, cy, 54, 0, TAU); c.fill();
    c.save(); c.translate(cx, cy - 22); c.rotate(balanco); c.translate(0, 22);
    desenharSino(c, 30, PALETA.destaqueSolido);
    c.restore();
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.font = `600 22px "${FX}"`; c.letterSpacing = '3px'; c.fillStyle = PALETA.destaqueEscuro || '#8e6d0b';
    c.fillText(o.rotulo, 176, 66);
    c.letterSpacing = '0px';
    c.font = `700 36px "${FX}"`; c.fillStyle = PALETA.escuro;
    c.fillText(o.titulo, 176, 114);
    c.font = `400 26px "${FX}"`; c.fillStyle = '#5a687c';
    c.fillText(o.sub, 176, 152);
  });
}

// ------------------------------------------------------------------- a logo
// Sempre o arquivo oficial (ARQUIVOS.logo), nunca redesenhada. Para o "fio" pousar
// sobre um elemento da logo, meça esse elemento no PNG (caixa dos pixels daquela
// cor) e declare em ARQUIVOS.logoAlvo = { cx, cy, r } em px da imagem.
function logoNaTela(o) {
  const img = imgs.logo, esc = o.largura / img.naturalWidth, a = img.naturalHeight * esc;
  return { x: o.cx - o.largura / 2, y: o.cy - a / 2, l: o.largura, a, esc };
}
function alvoDaLogo(o) {
  const L = logoNaTela(o), al = ARQUIVOS.logoAlvo;
  return al ? { x: L.x + al.cx * L.esc, y: L.y + al.cy * L.esc, r: al.r * L.esc } : { x: o.cx, y: o.cy, r: 60 };
}
// o = { cx, cy, largura, t0 (entra), respira: true }
function desenharLogo(c, t, o) {
  const k = ease.outCubic(inv(o.t0, o.t0 + 0.55, t));
  if (k <= 0) return;
  const L = logoNaTela(o);
  halo(c, o.cx, o.cy, 640, PALETA.luzBaixo[0], 0.28 * k);
  c.save();
  c.globalAlpha = k;
  c.translate(o.cx, o.cy + (1 - k) * 16);
  const s = lerp(0.97, 1, k) * (1 + (o.respira === false ? 0 : 0.012 * Math.max(0, t - o.t0 - 0.55)));
  c.scale(s, s);
  c.imageSmoothingQuality = 'high';
  c.drawImage(imgs.logo, -L.l / 2, -L.a / 2, L.l, L.a);
  c.restore();
}

// --------------------------------------------------------------------- render
// Faixas que o Instagram cobre no Reels/Stories: topo (cabeçalho), rodapé (legenda
// e nome) e a coluna de botões à direita. Texto importante nunca mora nelas.
const FAIXAS_REELS = [[0, 0, W, 250], [0, 1536, W, H - 1536], [950, 1100, W - 950, 600]];
function desenharGuia(c) {
  c.save();
  c.fillStyle = 'rgba(255,0,90,.22)';
  for (const [x, y, w, h] of FAIXAS_REELS) c.fillRect(x, y, w, h);
  c.restore();
}
const ETAPAS = {};
function etapa(nome, t0) { const t1 = performance.now(); ETAPAS[nome] = (ETAPAS[nome] || 0) + t1 - t0; return t1; }
function render(t) {
  t = clamp(t, 0, DURACAO);
  ctx.save();
  let t0 = performance.now();
  if (typeof desenharFundoProprio === 'function') desenharFundoProprio(ctx, t); else desenharFundo(ctx, t);
  t0 = etapa('fundo', t0);
  desenharCenas(ctx, t);                                 // cenas.js do projeto
  t0 = etapa('cenas', t0);
  if (typeof CLAROES !== 'undefined') desenharClaroes(ctx, t, CLAROES);
  if (typeof posProcesso === 'function') posProcesso(ctx, t);   // v2: aberração cromática, glitch
  t0 = etapa('pos', t0);
  desenharAcabamento(ctx, t);
  etapa('acabamento', t0);
  if (mostrarGuia) desenharGuia(ctx);
  ctx.restore();
}
// Motion blur real (v2): o projeto declara BLUR(t) -> { n, janela } e o quadro sai da média de n
// subquadros espalhados em 'janela' segundos em torno de t. Só nos quadros que pedem (pancadas,
// viradas): o resto custa 1 render. Determinístico: mesma média, mesmo quadro.
const acumulo = novoCanvas(W, H), cAcum = acumulo.getContext('2d');
function renderComBlur(t) {
  const b = (typeof BLUR === 'function') ? BLUR(t) : null;
  if (!b || b.n < 2) { render(t); return; }
  for (let i = 0; i < b.n; i++) {
    window.SUBQUADRO = i;                        // camadas caras (3D) podem reaproveitar o quadro a partir do 2º subquadro
    render(clamp(t + (i / (b.n - 1) - 0.5) * b.janela, 0, DURACAO));
    cAcum.globalAlpha = 1 / (i + 1);
    cAcum.drawImage(tela, 0, 0);
  }
  window.SUBQUADRO = 0;
  cAcum.globalAlpha = 1;
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(acumulo, 0, 0);
}

// ----------------------------------------------------------------------- som
let somPronto = null;       // AudioBuffer da trilha inteira, renderizado uma vez
async function prepararSom() {
  if (!somPronto) somPronto = await TRILHA.renderizar(DURACAO);
  return somPronto;
}
function wavDe(buf) {
  const ch = buf.numberOfChannels, n = buf.length, sr = buf.sampleRate;
  const dv = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const txt = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
  txt(0, 'RIFF'); dv.setUint32(4, 36 + n * ch * 2, true); txt(8, 'WAVE'); txt(12, 'fmt ');
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, ch, true);
  dv.setUint32(24, sr, true); dv.setUint32(28, sr * ch * 2, true); dv.setUint16(32, ch * 2, true);
  dv.setUint16(34, 16, true); txt(36, 'data'); dv.setUint32(40, n * ch * 2, true);
  const canais = Array.from({ length: ch }, (_, i) => buf.getChannelData(i));
  let o = 44;
  for (let i = 0; i < n; i++) for (let k = 0; k < ch; k++) {
    const v = clamp(canais[k][i], -1, 1);
    dv.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true); o += 2;
  }
  return dv.buffer;
}

// ------------------------------------------------------ prévia no navegador
const ui = {
  play: document.getElementById('play'), barra: document.getElementById('barra'),
  tempo: document.getElementById('tempo'), baixar: document.getElementById('baixar'),
  aviso: document.getElementById('aviso'),
};
const prev = { ac: null, fonte: null, inicio: 0, desde: 0, tocando: false, t: 0 };
const fmt = s => s.toFixed(1).replace('.', ',');
function mostrarTempo(t) {
  ui.tempo.textContent = `${fmt(t)} / ${fmt(DURACAO)} s`;
  ui.barra.value = t;
}
function parar() {
  if (prev.fonte) { try { prev.fonte.stop(); } catch (e) { /* já parou */ } prev.fonte = null; }
  prev.tocando = false; ui.play.textContent = '▶ Assistir';
}
function tocar(destinoExtra) {
  if (!prev.ac) prev.ac = new AudioContext();
  prev.ac.resume();
  if (prev.t >= DURACAO - 0.05) prev.t = 0;
  const f = prev.ac.createBufferSource();
  f.buffer = somPronto;
  f.connect(prev.ac.destination);
  if (destinoExtra) f.connect(destinoExtra);
  prev.inicio = prev.ac.currentTime + 0.05; prev.desde = prev.t;
  f.start(prev.inicio, prev.t);
  prev.fonte = f; prev.tocando = true; ui.play.textContent = '❚❚ Pausar';
  const quadro = () => {
    if (!prev.tocando) return;
    prev.t = prev.desde + Math.max(0, prev.ac.currentTime - prev.inicio);
    if (prev.t >= DURACAO) { prev.t = DURACAO; render(prev.t); mostrarTempo(prev.t); parar(); return; }
    render(prev.t); mostrarTempo(prev.t);
    requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
  return f;
}
// Plano B: grava o canvas e o som juntos direto no navegador (tempo real).
async function gravarNoNavegador() {
  parar(); prev.t = 0;
  if (!prev.ac) prev.ac = new AudioContext();
  const destino = prev.ac.createMediaStreamDestination();
  const stream = tela.captureStream(FPS);
  stream.addTrack(destino.stream.getAudioTracks()[0]);
  const tipo = ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm']
    .find(x => MediaRecorder.isTypeSupported(x));
  const rec = new MediaRecorder(stream, { mimeType: tipo, videoBitsPerSecond: 16e6, audioBitsPerSecond: 192e3 });
  const partes = [];
  rec.ondataavailable = e => e.data.size && partes.push(e.data);
  const fim = new Promise(ok => { rec.onstop = ok; });
  ui.aviso.textContent = 'Gravando em tempo real, não troque de aba…';
  rec.start(250);
  const f = tocar(destino);
  await new Promise(ok => { f.onended = ok; });
  rec.stop(); await fim;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(partes, { type: tipo }));
  a.download = (PROJETO.arquivo || 'motion') + '.' + (tipo.startsWith('video/mp4') ? 'mp4' : 'webm');
  a.click();
  ui.aviso.textContent = 'Vídeo baixado.';
}
function ligarPrevia() {
  ui.barra.max = DURACAO;
  ui.play.onclick = () => (prev.tocando ? parar() : tocar());
  ui.barra.oninput = () => { parar(); prev.t = +ui.barra.value; render(prev.t); mostrarTempo(prev.t); };
  ui.baixar.onclick = () => gravarNoNavegador();
  addEventListener('keydown', e => {
    if (e.key === ' ') { e.preventDefault(); ui.play.click(); }
    if (e.key === 'g') { mostrarGuia = !mostrarGuia; render(prev.t); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      parar(); prev.t = clamp(prev.t + (e.key === 'ArrowRight' ? 1 : -1) / FPS, 0, DURACAO);
      render(prev.t); mostrarTempo(prev.t);
    }
  });
}

// ----------------------------------------- API do render.mjs e inicialização
// Quadro e som vão para o render.mjs por POST no servidor local, em bytes: um PNG
// de 4 MB devolvido como texto pelo DevTools trava e nunca chega ao Node.
async function postar(rota, corpo) {
  const r = await fetch(rota, { method: 'POST', body: corpo });
  if (!r.ok) throw new Error(`${rota} respondeu ${r.status}`);
}
window.MOTION = {
  W, H, FPS, DURACAO, pronto: false, erro: null,
  async preparar(t) {
    if (typeof PREPARAR_PROJETO === 'function') {            // v2: clipes de vídeo, voz, o que o projeto precisar
      const b = (typeof BLUR === 'function') ? BLUR(t) : null;
      const j = b && b.n > 1 ? b.janela / 2 : 0;
      await PREPARAR_PROJETO(t - j, t + j);
    }
    if (!GRAV) return;
    const ids = indicesDaTela(t).map(indiceValido);
    await Promise.all(ids.map(carregarQuadro));
    if (ids.length) descartarQuadrosLonge(ids);
  },
  medida: { preparar: 0, desenho: 0, leitura: 0, envio: 0, n: 0, etapas: ETAPAS },
  async enviarQuadro(t) {                        // RGBA cru, direto para o FFmpeg
    const m = this.medida, t0 = performance.now();
    await this.preparar(t);
    const t1 = performance.now();
    renderComBlur(t);
    const t2 = performance.now();
    const px = ctx.getImageData(0, 0, W, H).data;
    const t3 = performance.now();
    await postar('/__quadro', px);
    m.preparar += t1 - t0; m.desenho += t2 - t1; m.leitura += t3 - t2; m.envio += performance.now() - t3; m.n++;
  },
  async enviarPNG(t, nome) {                     // um quadro solto, para conferir
    await this.preparar(t);
    renderComBlur(t);
    const png = await new Promise(ok => tela.toBlob(ok, 'image/png'));
    await postar('/__png?nome=' + encodeURIComponent(nome), png);
  },
  async enviarSom() { await postar('/__som', wavDe(await prepararSom())); },
};

async function carregarFontes() {
  for (const papel of ['titulo', 'texto']) {
    const f = FONTES[papel];
    for (const a of f.arquivos || []) {
      const ff = new FontFace(f.familia, `url("${encodeURI(a.src)}")`, { weight: a.peso || '100 900', style: a.estilo || 'normal' });
      document.fonts.add(await ff.load());
    }
  }
  const testes = [`500 80px "${FT}"`, `600 80px "${FT}"`, `italic 600 80px "${FT}"`,
    `400 40px "${FX}"`, `500 40px "${FX}"`, `600 40px "${FX}"`, `700 40px "${FX}"`];
  await Promise.all(testes.map(f => document.fonts.load(f, 'Ação ãé')));
}
async function iniciar() {
  document.title = PROJETO.titulo || document.title;
  await carregarFontes();
  await Promise.all(Object.entries(ARQUIVOS)
    .filter(([, src]) => typeof src === 'string')
    .map(async ([chave, src]) => { imgs[chave] = await carregarImagem(src); }));
  if (typeof CARREGAR_PROJETO === 'function') await CARREGAR_PROJETO();   // v2: voz, clipes, 3D
  prepararFundo();
  if (MODO_RENDER) { document.body.classList.add('render'); window.MOTION.pronto = true; return; }

  if (GRAV) {        // prévia: carrega a gravação inteira antes de liberar o play
    const todos = [];
    for (const [a, b] of GRAV.faixas) for (let i = a; i <= b; i++) todos.push(i);
    let feitos = 0;
    await Promise.all(todos.map(i => carregarQuadro(i).then(() => {
      feitos++;
      if (feitos % 40 === 0) ui.aviso.textContent = `Carregando a gravação… ${Math.round(feitos / todos.length * 100)}%`;
    })));
  }
  ui.aviso.textContent = 'Montando a trilha…';
  await prepararSom();
  ligarPrevia();
  render(0); mostrarTempo(0);
  ui.play.disabled = false; ui.baixar.disabled = false;
  ui.aviso.textContent = 'Espaço: play/pausa · ← →: quadro a quadro · G: faixas do Reels';
  window.MOTION.pronto = true;
}
iniciar().catch(e => {
  window.MOTION.erro = String(e && e.stack || e);
  ui.aviso.textContent = 'Erro: ' + e.message;
  console.error(e);
});
