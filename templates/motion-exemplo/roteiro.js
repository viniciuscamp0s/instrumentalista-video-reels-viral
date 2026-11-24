/* roteiro.js — os dados do projeto: o tempo do vídeo num lugar só.
 *
 * MODELO: um vídeo-exemplo de 16 s que passa por quase todas as peças do motor.
 * Num projeto novo, troque tudo daqui pelo roteiro aprovado. A animação
 * (cenas.js) e a trilha (trilha.js) leem daqui: mudou o ritmo, muda aqui e as duas
 * acompanham. Régua de leitura: cada texto fica na tela pelo menos ~0,3 s por
 * palavra mais meio segundo. As viradas de cena caem na grade da batida (0,5 s a 120 bpm).
 */
'use strict';

const PROJETO = { titulo: 'Motion · modelo', arquivo: 'motion-modelo', W: 1080, H: 1920, FPS: 30 };

// Cores tiradas do site ou da logo do cliente (nunca inventadas). rgb sem parênteses
// onde o motor monta rgba(); hexa onde vai direto.
// ID VISUAL: toda cor do vídeo sai daqui. Trocar de marca = trocar este bloco, FONTES e a logo.
const PALETA = {
  fundo: ['#040a18', '#081633', '#0a1a3b'],   // degradê de cima para baixo
  halo: '29,60,109',                          // brilho do centro
  nevoa: [52, 92, 170], fio: [240, 181, 5],   // névoa fria e fio quente
  bokeh: ['240,181,5', '90,140,230'],          // luzes desfocadas: quente e fria
  luzBaixo: ['80,130,220', '240,181,5'],       // luz de baixo (pulsa no bumbo)
  estrelas: '210,225,255',
  vinheta: '0,0,8',
  destaque: ['#ffe07a', '#f7c51c', '#d69600'], // degradê da palavra em destaque
  destaqueSolido: '#f0b505',
  destaqueEscuro: '#8e6d0b',
  brilho: '240,181,5',                         // brilho, halo e faíscas
  escuro: '#12294e',                           // texto sobre o destaque, número na bolinha ativa
};

// As fontes do site ou do manual da marca, em arquivo local (fonts/). Sem arquivos,
// a família precisa ser uma fonte do sistema.
// ID VISUAL: fontes da marca.
const FONTES = {
  titulo: { familia: 'Newsreader', arquivos: [
    { src: 'fonts/Newsreader-var.woff2', peso: '200 800' },
    { src: 'fonts/Newsreader-italic-var.woff2', peso: '200 800', estilo: 'italic' },
  ] },
  texto: { familia: 'Inter', arquivos: [{ src: 'fonts/Inter-var.woff2', peso: '100 900' }] },
};

// Imagens do projeto (chave -> caminho). logo: o arquivo OFICIAL, nunca redesenhado.
// logoAlvo: onde o "fio" pousa na logo, medido no PNG (ver scripts/revisar.py cor).
const ARQUIVOS = {
  logo: '_anexos/logo.png',   // ID VISUAL: a logo oficial, nunca redesenhada
  tela: '_anexos/tela.jpg',
  logoAlvo: { cx: 146, cy: 206, r: 120 },
};

// Início de cada cena (s)
const ROTEIRO = {
  gancho: 0,     // o sol sobe e a pancada entra (1,0 s)
  numero: 3.5,   // o sol abre num anel e o número conta
  passos: 7.0,   // as bolinhas nascem do anel que se fecha
  tela: 9.5,     // o celular entra e o botão salta no toque
  final: 13.0,   // a logo e a chamada
  fim: 16.0,
};

// Gravação de tela: null quando o celular mostra só imagem. Com gravação, ver
// docs/04-motion-e-templates.md (quadros f_<índice>.jpg a 30 fps da fonte).
const GRAVACAO = null;
// const GRAVACAO = { pasta: '_anexos/frames/', faixas: [[0, 134], [1185, 2310]], fps: 30, largura: 384, altura: 832 };

// O que a tela do celular mostra em cada segundo do vídeo
//   { v0, v1, s0, vel } trecho da gravação (vel 0 = parado) · { rolagem: [s0, s1] }
//   { imagem: 'chave' } imagem de ARQUIVOS · funde: segundos de transição com o anterior
const MONTAGEM = [
  { v0: ROTEIRO.tela, v1: ROTEIRO.final + 1, imagem: 'tela' },
];
// Toques na tela (tempo do vídeo; u, v = fração da largura e da altura da tela)
const TOQUES = [{ t: 11.5, u: 0.5, v: 0.82 }];
// Borrões de privacidade (tempo da FONTE; px da tela da gravação). Medir pixel a pixel.
const BORROES = [];

// Trilha: 1 acorde por compasso (2 s a 120 bpm)
const ARRANJO = {
  bpm: 120,
  acordes: { D: [54, 57, 62, 66], A: [52, 57, 61, 64], Bm: [54, 59, 62, 66], G: [55, 59, 62, 67] },
  baixos: { D: 38, A: 33, Bm: 35, G: 31 },
  sequencia: ['D', 'A', 'Bm', 'G', 'D', 'A', 'G', 'D'],
  bateria: [8.0, ROTEIRO.final],   // a bateria entra num compasso inteiro e para no cartão final
  respiros: [],                     // trechos sem bumbo, ex.: [[32.5, 34.0]]
  viradas: [8.0],                   // chimbal e palmas crescendo até aqui
  final: ROTEIRO.final,
};

// Efeitos no tempo do vídeo. Cada movimento importante tem o seu som.
const EFEITOS = [
  ['subida', 0.0, { dur: 1.0, vol: 0.5 }],
  ['tique', 0.12], ['tique', 0.38],
  ['impacto', 1.0, { vol: 1 }],
  ['brilho', 1.55],
  ['whoosh', ROTEIRO.numero - 0.55, { dur: 0.6, sobe: false, vol: 0.4 }],
  ['contador', ROTEIRO.numero + 0.9, { dur: 1.2, n: 50 }],
  ['cristal', ROTEIRO.numero + 2.1],
  ['whoosh', ROTEIRO.passos - 0.5, { dur: 0.5, sobe: true, vol: 0.38 }],
  ['impacto', ROTEIRO.passos, { vol: 0.55, leve: true }],
  ['pop', ROTEIRO.passos + 0.05, { nota: 74 }], ['pop', ROTEIRO.passos + 0.12, { nota: 78 }], ['pop', ROTEIRO.passos + 0.19, { nota: 81 }],
  ['whoosh', ROTEIRO.tela - 0.45, { dur: 0.55, sobe: true, vol: 0.38 }],
  ['whoosh', ROTEIRO.tela + 0.1, { dur: 1.0, sobe: true, vol: 0.5, grave: true }],
  ['pop', TOQUES[0].t + 0.02, { nota: 86, vol: 0.75 }],
  ['subida', ROTEIRO.final - 1.0, { dur: 1.0, vol: 0.4 }],
  ['impacto', ROTEIRO.final, { vol: 0.9 }],
  ['pop', ROTEIRO.final + 0.72, { nota: 81, vol: 0.5 }],
  ...TOQUES.map(tq => ['toque', tq.t]),
];
