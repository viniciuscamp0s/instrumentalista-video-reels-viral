/* cenas.js — o desenho de cada cena do projeto, com as peças do nucleo.js.
 *
 * MODELO: as cenas do vídeo-exemplo de 16 s do roteiro.js. Num projeto novo, este é
 * o arquivo que se reescreve (junto com o roteiro.js). A ordem das chamadas em
 * desenharCenas() é a ordem das camadas: o que vem depois fica na frente.
 * Guia completo: docs/04-motion-e-templates.md.
 */
'use strict';
const R = ROTEIRO;

// ------------------------------------------------ o fio do vídeo (o "sol")
// Nasce como sol, abre num anel com o número e se fecha num ponto de onde saem as
// bolinhas dos passos. No fim volta como selo e pousa sobre a logo.
function estadoSol(t) {
  if (t > R.passos + 0.3) return null;
  const s = { x: W / 2 };
  s.y = lerp(1990, 1430, ease.outCubic(inv(0, 1.25, t))) - 25 * inv(1.25, R.numero, t);   // no quadro 0 já desponta
  const kAbre = ease.inOutCubic(inv(R.numero, R.numero + 0.8, t));
  s.y = lerp(s.y, 1110, kAbre); s.r = lerp(165, 205, kAbre); s.anel = kAbre;
  const kFecha = ease.inCubic(inv(R.passos - 0.45, R.passos, t));
  s.r = lerp(s.r, 16, kFecha); s.y = lerp(s.y, 1180, kFecha); s.fecha = kFecha;
  s.alfa = 1 - inv(R.passos, R.passos + 0.22, t);
  s.brilho = 1 + 0.9 * pico(t, 1.0, 0.1, 0.35) + 0.7 * pico(t, R.passos, 0.08, 0.2);
  return s;
}
const LOGO = { cx: W / 2, cy: 760, largura: 860 };
function estadoSelo(t) {
  const k = inv(R.final - 0.25, R.final + 0.1, t);
  if (k <= 0 || t > R.final + 0.85) return null;
  const alvo = alvoDaLogo(LOGO), kVoa = ease.inOutCubic(inv(R.final - 0.05, R.final + 0.5, t));
  return {
    x: lerp(W / 2, alvo.x, kVoa), y: lerp(930, alvo.y, kVoa), r: lerp(110 * ease.outBack(k, 2.0), alvo.r, kVoa),
    check: 0, alfa: 1 - inv(R.final + 0.45, R.final + 0.8, t),
  };
}

// clarões (o motor desenha esta lista por cima das cenas) e faíscas
const CLAROES = [
  { t: 1.0, x: W / 2, y: 980, forca: 0.5, raio: 1150 },
  { t: R.passos, x: W / 2, y: 1180, forca: 0.6, raio: 1000 },
  { t: R.final, x: W / 2, y: 900, forca: 0.5, raio: 1200 },
];
const FAISCAS = [
  { t: 1.0, x: W / 2, y: 960, n: 46, semente: 1, vel: 1100, dur: 1.3 },
  { t: R.numero + 2.1, x: W / 2, y: 1110, n: 64, semente: 2, anel: 205, vel: 380, dur: 1.0 },
  { t: R.passos, x: W / 2, y: 1180, n: 40, semente: 3, vel: 800, dur: 0.9 },
];

// ------------------------------------------------ o celular: chaves de pose
// Perto de um toque embaixo da tela, o celular sobe: o rodapé do Reels cobre o fim da tela.
const CHAVES_CEL = [
  { t: R.tela + 0.15, p: pose(2230, 1, 0.62, -0.5, 420, 0.12) },
  { t: R.tela + 1.35, p: pose(1190, 1, 0.07, -0.16), e: 'outQuint' },
  { t: TOQUES[0].t - 0.7, p: pose(1180, 1, 0.06, -0.1), e: 'inOutSine' },
  { t: TOQUES[0].t - 0.2, p: pose(1060, 1.08, 0.02, -0.02) },
  { t: R.final - 0.3, p: pose(1070, 1.08, 0.02, 0.02), e: 'inOutSine' },
  { t: R.final + 0.4, p: pose(2400, 0.96, 0.5, 0.3, 320, -0.12), e: 'inCubic' },
];
function poseCelular(t) {
  const p = interpolar(CHAVES_CEL, t);
  const vivo = inv(R.tela + 1.0, R.tela + 1.6, t);            // respiração depois de pousar
  p.ry += 0.025 * Math.sin((t - R.tela) * 1.3) * vivo;
  p.y += 5 * Math.sin((t - R.tela) * 1.1) * vivo;
  return p;
}

// ------------------------------------------------------------------- cenas
function cenaGancho(c, t) {
  if (t > R.numero) return;
  linha(c, t, { y: 640, t0: 0.12, passo: 0.26, dur: 0.6, saida: R.numero - 0.7, durSaida: 0.3,
    palavras: [['Modelo', F.titulo], ['de', F.titulo], ['motion', F.titulo]] });
}
function cenaNumero(c, t, s) {
  const N = R.numero;
  if (s && s.anel > 0) {
    desenharMedidor(c, s, {
      prog: ease.inOutCubic(inv(N + 0.9, N + 2.1, t)), valor: 50, marcas: 50,
      cima: 'CONTAGEM', baixo: 'marcas', entra: inv(N + 0.05, N + 0.3, t), pulso: pico(t, N + 2.1, 0.04, 0.18),
    });
  }
  if (t < N - 0.9 || t > R.passos + 0.4) return;
  const sai = R.passos - 0.55;
  linha(c, t, { y: 578, t0: N + 0.1, passo: 0.1, saida: sai, palavras: [['Cada', F.tituloM], ['número', emDestaque(F.tituloM)]] });
  linha(c, t, { y: 650, t0: N + 0.4, passo: 0.05, saida: sai + 0.03,
    palavras: 'conta na frente de quem assiste'.split(' ').map(p => [p, F.texto]) });
}
function cenaPassos(c, t) {
  if (t < R.passos || t > R.tela + 0.3) return;
  linha(c, t, { y: 880, t0: R.passos + 0.24, passo: 0.1, saida: R.tela - 0.5, palavras: [['3', F.destaqueG], ['passos', F.destaqueG]] });
  linha(c, t, { y: 975, t0: R.passos + 0.42, passo: 0.05, saida: R.tela - 0.45,
    palavras: 'para mostrar um fluxo'.split(' ').map(p => [p, F.texto]) });
}
function cenaTela(c, t, p) {
  if (t < R.tela - 0.1 || t > R.final + 0.2) return;
  const tq = TOQUES[0].t;
  linha(c, t, { y: 398, t0: R.tela + 0.02, saida: tq - 0.8, palavras: [['Passo 1', F.rotulo]] });
  linha(c, t, { y: 470, t0: R.tela + 0.12, passo: 0.08, saida: tq - 0.75,
    palavras: [['Toque', F.textoForte], ['no', F.textoForte], ['botão', F.destaqueP]] });
  // o botão salta da tela no toque e sobe quando a cena acaba
  const t0 = tq + 0.02, kB = inv(t0, t0 + 0.55, t), kSai = ease.inCubic(inv(R.final - 0.45, R.final, t));
  if (kB > 0 && kSai < 1) {
    const e = ease.outBack(kB, 1.5), o = localDaTela(TOQUES[0].u, TOQUES[0].v), origem = G3.projetar(p, o.x, o.y);
    const pz = {
      x: lerp(origem.x, W / 2, e), y: lerp(origem.y, 1300, e), z: lerp(0, -280, e),
      rx: lerp(0, -0.14, e), ry: lerp(0, 0.22, e), rz: lerp(0, -0.035, e), s: lerp(0.66, 1, e),
    };
    pz.y += Math.sin((t - t0) * 2.4) * 5 * e;
    pz.y = lerp(pz.y, 560, kSai); pz.s *= 1 - 0.55 * kSai; pz.z = lerp(pz.z, 0, kSai);
    halo(c, pz.x, pz.y, 520, PALETA.brilho, 0.3 * e * (1 - kSai));
    cartao3D(c, cartaoBotao('Fazer agora'), pz, clamp(kB * 4) * (1 - kSai));
  }
}
function cenaFinal(c, t) {
  if (t < R.final - 0.3) return;
  const F0 = R.final;
  desenharLogo(c, t, { ...LOGO, t0: F0 + 0.35 });
  const kB = inv(F0 + 0.7, F0 + 1.2, t);
  if (kB > 0) {
    const e = ease.outBack(kB, 1.6);
    const pz = { x: W / 2, y: 1020 + (1 - e) * 40 + Math.sin((t - F0) * 2) * 3 * e, z: lerp(120, -40, e), rx: 0.05 * (1 - e), s: lerp(0.8, 1, e) };
    halo(c, pz.x, pz.y, 460, PALETA.brilho, 0.22 * clamp(kB * 2));
    cartao3D(c, cartaoBotao('Faça agora'), pz, clamp(kB * 3));
  }
  linha(c, t, { y: 1160, t0: F0 + 0.95, passo: 0.12, junto: true, palavras: [['exemplo.com.br', F.url], ['/caminho', F.urlDestaque]] });
  linha(c, t, { y: 1260, t0: F0 + 1.15, passo: 0.06, palavras: [['até', F.destaqueP], ['31', F.destaqueP], ['de', F.destaqueP], ['outubro', F.destaqueP]] });
}

// A ordem aqui é a ordem das camadas.
function desenharCenas(c, t) {
  const s = estadoSol(t);
  desenharSol(c, s, t);
  cenaGancho(c, t);
  textoPancada(c, t, {
    palavras: ['Nível', 'estúdio'], t0: 1.0, centro: { x: W / 2, y: 960 }, tam: 212, linhas: [-40, 150],
    morph: [R.numero - 0.5, R.numero + 0.1], destino: { y: 420, tam: 80 },
    saida: [R.passos - 0.55, R.passos - 0.2], brilho: [1.55, 2.3],
  });
  cenaNumero(c, t, s);
  cenaPassos(c, t);
  desenharFaiscas(c, t, FAISCAS);
  let p = null;
  if (t >= R.tela + 0.1 && t <= R.final + 0.45) { p = poseCelular(t); desenharCelular(c, t, p); }
  desenharTrilhaPassos(c, t, {
    n: 3, tempos: [R.tela - 0.2, TOQUES[0].t + 0.3, R.final - 0.6, R.final - 0.3],
    nascer: R.passos, subir: [R.tela - 0.45, R.tela + 0.1], sumir: [R.final - 0.35, R.final + 0.15],
  });
  if (p) cenaTela(c, t, p);
  cenaFinal(c, t);
  desenharSelo(c, estadoSelo(t));
}
