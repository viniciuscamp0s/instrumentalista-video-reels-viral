/* trilha.js — o motor de som dos vídeos em motion: trilha e efeitos
 * sintetizados com Web Audio, sem arquivo de áudio nenhum.
 *
 * O projeto manda no roteiro.js:
 *   ARRANJO  bpm, acordes, sequência (1 acorde por compasso), onde entra a bateria,
 *            os respiros sem bumbo, as viradas e o início do cartão final
 *   EFEITOS  [[nome, tempo, opções]] no tempo do vídeo (ver FX abaixo)
 * Tudo é agendado num OfflineAudioContext e vira um AudioBuffer: a prévia toca esse
 * buffer e o render grava o mesmo buffer em WAV. O acaso vem de sementes fixas.
 *
 * Os volumes já saem calibrados pelo que foi medido no primeiro vídeo (25/09/2026):
 * abertura a no máximo ~6 LU abaixo do corpo, nada de começo mudo, cartão final sem
 * despencar, integrado perto de -14 LUFS e pico abaixo de -1 dBTP. Mexeu no volume?
 * Meça de novo com scripts/revisar.py volume.
 */
'use strict';
const TRILHA = (() => {
  const SR = 48000;
  const A = ARRANJO;
  const BATIDA = 60 / A.bpm, COMPASSO = 4 * BATIDA;
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);
  const ARPEJO = [0, 1, 2, 3, 2, 1, 3, 2];
  const emRespiro = t => (A.respiros || []).some(([a, b]) => t >= a && t < b);
  const temBumbo = t => t >= A.bateria[0] && t < A.bateria[1] && !emRespiro(t);

  function montar(ac, dur) {
    const r = mulberry32(4242);
    const ruido = ac.createBuffer(2, SR * 3, SR);
    for (let ch = 0; ch < 2; ch++) { const d = ruido.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1; }

    // ---- barramentos: mestre -> compressor -> limitador -> ganho de saída
    const mestre = ac.createGain(); mestre.gain.value = 0.84;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -18; comp.knee.value = 10; comp.ratio.value = 3; comp.attack.value = 0.005; comp.release.value = 0.2;
    const lim = ac.createDynamicsCompressor();
    lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.08;
    // o ataque do limitador deixa passar o transiente: o ganho depois dele segura o pico abaixo de -1 dBTP
    const saida = ac.createGain(); saida.gain.value = 0.88;
    mestre.connect(comp); comp.connect(lim); lim.connect(saida); saida.connect(ac.destination);
    mestre.gain.setValueAtTime(0.84, Math.max(0, dur - 1.0));
    mestre.gain.linearRampToValueAtTime(0.0001, dur);

    const reverb = ac.createConvolver(); reverb.buffer = sala(ac, mulberry32(99));
    const volReverb = ac.createGain(); volReverb.gain.value = 0.32; reverb.connect(volReverb); volReverb.connect(mestre);
    const musica = ac.createGain(); musica.gain.value = 0.55; musica.connect(mestre);
    const bomba = ac.createGain(); bomba.connect(musica);               // abaixa a música a cada bumbo
    const bateria = ac.createGain(); bateria.gain.value = 0.85; bateria.connect(mestre);
    const efeitos = ac.createGain(); efeitos.gain.value = 0.85; efeitos.connect(mestre);
    const eco = ac.createDelay(1); eco.delayTime.value = BATIDA * 0.75;  // colcheia pontuada
    const ecoFiltro = ac.createBiquadFilter(); ecoFiltro.type = 'lowpass'; ecoFiltro.frequency.value = 2600;
    const ecoVolta = ac.createGain(); ecoVolta.gain.value = 0.28;
    const ecoSaida = ac.createGain(); ecoSaida.gain.value = 0.35;
    eco.connect(ecoFiltro); ecoFiltro.connect(ecoVolta); ecoVolta.connect(eco); ecoFiltro.connect(ecoSaida); ecoSaida.connect(bomba);

    const envia = (no, destino, vol) => { const g = ac.createGain(); g.gain.value = vol; no.connect(g); g.connect(destino); };
    const osc = (tipo, f) => { const o = ac.createOscillator(); o.type = tipo; o.frequency.value = f; return o; };
    const ganho = v => { const g = ac.createGain(); g.gain.value = v; return g; };
    const filtro = (tipo, f, q = 0.7) => { const b = ac.createBiquadFilter(); b.type = tipo; b.frequency.value = f; b.Q.value = q; return b; };
    const fonteRuido = (t, d) => {
      const s = ac.createBufferSource(); s.buffer = ruido; s.loop = true;
      s.start(t, r() * 2.5, d); return s;
    };
    const env = (g, t, vol, a, queda) => {            // sobe em a, cai exponencial
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + queda);
    };

    // ---- instrumentos
    function pad(t0, t1, notas, vol) {
      const f = filtro('lowpass', 700, 0.4);
      f.frequency.setValueAtTime(700, t0);
      f.frequency.linearRampToValueAtTime(1500, t0 + (t1 - t0) * 0.6);
      f.frequency.linearRampToValueAtTime(950, t1 + 0.9);
      const g = ac.createGain();
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.35);
      g.gain.setValueAtTime(vol, t1 - 0.05); g.gain.linearRampToValueAtTime(0, t1 + 0.9);
      f.connect(g); g.connect(bomba); envia(g, reverb, 0.5);
      for (const n of notas) for (const det of [-7, 7]) {
        const o = osc('sawtooth', midi(n)); o.detune.value = det;
        const p = ac.createStereoPanner(); p.pan.value = det < 0 ? -0.45 : 0.45;
        const gn = ganho(0.18);
        o.connect(gn); gn.connect(p); p.connect(f);
        o.start(t0); o.stop(t1 + 1.0);
      }
    }
    function pluck(t, nota, vol, pan) {
      const o = osc('triangle', midi(nota)), o2 = osc('square', midi(nota) * 1.002);
      const f = filtro('lowpass', 3800, 2);
      f.frequency.setValueAtTime(3800, t); f.frequency.exponentialRampToValueAtTime(700, t + 0.22);
      const g2 = ganho(0.22), g = ac.createGain(), p = ac.createStereoPanner(); p.pan.value = pan;
      env(g, t, vol, 0.004, 0.42);
      o.connect(f); o2.connect(g2); g2.connect(f); f.connect(g); g.connect(p); p.connect(bomba); p.connect(eco);
      envia(p, reverb, 0.25);
      o.start(t); o2.start(t); o.stop(t + 0.5); o2.stop(t + 0.5);
    }
    function baixo(t0, t1, nota, vol) {
      const o = osc('sine', midi(nota)), o2 = osc('triangle', midi(nota + 12));
      const f = filtro('lowpass', 420, 0.8), g2 = ganho(0.3), g = ac.createGain();
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.03);
      g.gain.setValueAtTime(vol, t1 - 0.06); g.gain.linearRampToValueAtTime(0, t1);
      o.connect(g); o2.connect(g2); g2.connect(f); f.connect(g); g.connect(bomba);
      o.start(t0); o2.start(t0); o.stop(t1 + 0.05); o2.stop(t1 + 0.05);
    }
    function bumbo(t, vol) {
      const o = osc('sine', 155), g = ac.createGain();
      o.frequency.setValueAtTime(155, t); o.frequency.exponentialRampToValueAtTime(46, t + 0.11);
      env(g, t, vol, 0.002, 0.36);
      o.connect(g); g.connect(bateria); o.start(t); o.stop(t + 0.42);
      const s = fonteRuido(t, 0.02), hp = filtro('highpass', 3000), gs = ac.createGain();
      env(gs, t, vol * 0.12, 0.001, 0.012);
      s.connect(hp); hp.connect(gs); gs.connect(bateria);
      bomba.gain.setValueAtTime(1, t);
      bomba.gain.linearRampToValueAtTime(0.55, t + 0.012);
      bomba.gain.setTargetAtTime(1, t + 0.03, 0.09);
    }
    function palma(t, vol) {
      const s = fonteRuido(t, 0.3), bp = filtro('bandpass', 1400, 0.8), g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      for (const d of [0, 0.011, 0.022]) { g.gain.setValueAtTime(vol, t + d); g.gain.exponentialRampToValueAtTime(vol * 0.3, t + d + 0.009); }
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      s.connect(bp); bp.connect(g); g.connect(bateria); envia(g, reverb, 0.35);
    }
    function chimbal(t, vol) {
      const s = fonteRuido(t, 0.08), hp = filtro('highpass', 7200), g = ac.createGain();
      env(g, t, vol, 0.001, 0.05);
      const p = ac.createStereoPanner(); p.pan.value = 0.25;
      s.connect(hp); hp.connect(g); g.connect(p); p.connect(bateria);
    }
    function chocalho(t, vol) {
      const s = fonteRuido(t, 0.08), bp = filtro('bandpass', 6000, 1.2), g = ac.createGain();
      env(g, t, vol, 0.008, 0.05);
      const p = ac.createStereoPanner(); p.pan.value = -0.3;
      s.connect(bp); bp.connect(g); g.connect(p); p.connect(bateria);
    }

    // ---- efeitos: cada um casa com um tipo de movimento na tela
    function sino(t, nota, vol, d = 1.5) {
      const f = midi(nota), car = osc('sine', f), mod = osc('sine', f * 3.5), idx = ac.createGain();
      idx.gain.setValueAtTime(f * 2.2, t); idx.gain.exponentialRampToValueAtTime(f * 0.05, t + d * 0.7);
      mod.connect(idx); idx.connect(car.frequency);
      const g = ac.createGain(); env(g, t, vol, 0.004, d);
      car.connect(g); g.connect(efeitos); envia(g, reverb, 0.6);
      car.start(t); mod.start(t); car.stop(t + d + 0.1); mod.stop(t + d + 0.1);
    }
    const FX = {
      subida(t, { dur: d = 1, vol = 0.5 }) {           // antes de uma pancada ou de a bateria entrar
        const s = fonteRuido(t, d + 0.05), bp = filtro('bandpass', 350, 5), g = ac.createGain();
        bp.frequency.setValueAtTime(350, t); bp.frequency.exponentialRampToValueAtTime(7500, t + d);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + d * 0.95); g.gain.linearRampToValueAtTime(0, t + d + 0.04);
        s.connect(bp); bp.connect(g); g.connect(efeitos); envia(g, reverb, 0.4);
        const o = osc('sine', 180), go = ac.createGain();
        o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(760, t + d);
        go.gain.setValueAtTime(0.0001, t); go.gain.exponentialRampToValueAtTime(vol * 0.22, t + d * 0.95); go.gain.linearRampToValueAtTime(0, t + d + 0.03);
        o.connect(go); go.connect(efeitos); o.start(t); o.stop(t + d + 0.1);
      },
      impacto(t, { vol = 1, leve = false }) {          // pancada de texto, clarão, logo
        const o = osc('sine', leve ? 120 : 95), g = ac.createGain();
        o.frequency.setValueAtTime(leve ? 120 : 95, t); o.frequency.exponentialRampToValueAtTime(36, t + 0.5);
        env(g, t, vol * (leve ? 0.5 : 0.95), 0.003, leve ? 0.7 : 1.4);
        o.connect(g); g.connect(efeitos); o.start(t); o.stop(t + 1.5);
        const s = fonteRuido(t, 1.1), lp = filtro('lowpass', leve ? 2500 : 1800), gn = ac.createGain();
        lp.frequency.setValueAtTime(leve ? 2500 : 1800, t); lp.frequency.exponentialRampToValueAtTime(200, t + 0.9);
        env(gn, t, vol * (leve ? 0.25 : 0.45), 0.002, 1.0);
        s.connect(lp); lp.connect(gn); gn.connect(efeitos); envia(gn, reverb, 0.8);
        if (!leve) for (const n of [86, 90, 93, 98]) sino(t + 0.01, n, vol * 0.05, 1.6);
      },
      brilho(t) {                                      // faixa de luz passando, confirmação
        [86, 90, 93, 98].forEach((n, i) => sino(t + i * 0.07, n, 0.045, 0.9));
        const s = fonteRuido(t, 0.8), hp = filtro('highpass', 8000), g = ac.createGain();
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + 0.35); g.gain.linearRampToValueAtTime(0, t + 0.8);
        s.connect(hp); hp.connect(g); g.connect(efeitos);
      },
      whoosh(t, { dur: d = 0.6, sobe = true, vol = 0.45, grave = false }) {   // tudo que atravessa a tela
        const s = fonteRuido(t, d + 0.05), bp = filtro('bandpass', 1000, 1.1), g = ac.createGain();
        const f0 = grave ? 250 : 500, f1 = grave ? 2500 : 5000;
        bp.frequency.setValueAtTime(sobe ? f0 : f1, t); bp.frequency.exponentialRampToValueAtTime(sobe ? f1 : f0, t + d);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + d * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        const p = ac.createStereoPanner();
        p.pan.setValueAtTime(sobe ? -0.5 : 0.5, t); p.pan.linearRampToValueAtTime(sobe ? 0.5 : -0.5, t + d);
        s.connect(bp); bp.connect(g); g.connect(p); p.connect(efeitos); envia(g, reverb, 0.3);
      },
      tique(t, { vol = 0.1 } = {}) {                   // palavra-chave ou legenda nova entrando
        const o = osc('sine', 2300), g = ac.createGain();
        o.frequency.setValueAtTime(2300, t); o.frequency.exponentialRampToValueAtTime(1700, t + 0.02);
        env(g, t, vol, 0.001, 0.035);
        o.connect(g); g.connect(efeitos); o.start(t); o.stop(t + 0.05);
      },
      // n tiques no mesmo ritmo de um contador que anda em inOutCubic por dur
      contador(t, { dur: d = 1.2, n = 50 }) {
        const invCurva = y => (y < 0.5 ? Math.cbrt(y / 4) : 1 - Math.cbrt(2 * (1 - y)) / 2);
        for (let i = 0; i < n; i++) {
          const ti = t + d * invCurva((i + 0.5) / n), o = osc('sine', 900 + 1300 * i / n), g = ac.createGain();
          const p = ac.createStereoPanner(); p.pan.value = i % 2 ? 0.3 : -0.3;
          env(g, ti, 0.055, 0.001, 0.02);
          o.connect(g); g.connect(p); p.connect(efeitos); o.start(ti); o.stop(ti + 0.03);
        }
      },
      cristal(t) {                                     // algo que se completa (anel, selo)
        [86, 90, 93, 98].forEach((n, i) => sino(t + i * 0.02, n, 0.08, 2.0));
        const o = osc('sine', 220), g = ac.createGain();
        o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(110, t + 0.3);
        env(g, t, 0.18, 0.005, 0.4);
        o.connect(g); g.connect(efeitos); o.start(t); o.stop(t + 0.5);
      },
      pop(t, { nota = 81, vol = 0.6 }) {               // cartão, bolinha ou botão que salta
        const f = midi(nota), o = osc('sine', f * 1.6), g = ac.createGain();
        o.frequency.setValueAtTime(f * 1.6, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.035);
        env(g, t, vol * 0.3, 0.002, 0.16);
        o.connect(g); g.connect(efeitos); envia(g, reverb, 0.3); o.start(t); o.stop(t + 0.2);
        const s = fonteRuido(t, 0.01), hp = filtro('highpass', 3000), gs = ac.createGain();
        env(gs, t, vol * 0.08, 0.001, 0.005);
        s.connect(hp); hp.connect(gs); gs.connect(efeitos);
      },
      toque(t) {                                       // toque na tela do celular
        const s = fonteRuido(t, 0.012), hp = filtro('highpass', 2500), gs = ac.createGain();
        env(gs, t, 0.25, 0.001, 0.008);
        s.connect(hp); hp.connect(gs); gs.connect(efeitos);
        const o = osc('sine', 1400), g = ac.createGain();
        o.frequency.setValueAtTime(1400, t); o.frequency.exponentialRampToValueAtTime(700, t + 0.03);
        env(g, t, 0.22, 0.001, 0.07);
        o.connect(g); g.connect(efeitos); o.start(t); o.stop(t + 0.1);
        const b = osc('sine', 180), gb = ac.createGain();
        b.frequency.setValueAtTime(180, t); b.frequency.exponentialRampToValueAtTime(90, t + 0.08);
        env(gb, t, 0.3, 0.002, 0.08);
        b.connect(gb); gb.connect(efeitos); b.start(t); b.stop(t + 0.12);
      },
      tecla(t) {                                       // tecla do celular, bem mais leve que o toque
        const s = fonteRuido(t, 0.02), bp = filtro('bandpass', 3200, 1.2), g = ac.createGain();
        env(g, t, 0.14, 0.001, 0.016);
        const p = ac.createStereoPanner(); p.pan.value = (r() - 0.5) * 0.4;
        s.connect(bp); bp.connect(g); g.connect(p); p.connect(efeitos);
      },
      ding(t) {                                        // confirmação, cadastro feito
        sino(t, 88, 0.14, 2.2); sino(t + 0.09, 95, 0.11, 2.4);
        const o = osc('sine', 240), g = ac.createGain();
        o.frequency.setValueAtTime(240, t); o.frequency.exponentialRampToValueAtTime(120, t + 0.25);
        env(g, t, 0.16, 0.004, 0.35);
        o.connect(g); g.connect(efeitos); o.start(t); o.stop(t + 0.4);
      },
      notificacao(t) {                                 // mensagem chegando
        [[88, 0], [93, 0.13]].forEach(([n, d]) => {
          const o = osc('triangle', midi(n)), g = ac.createGain();
          env(g, t + d, 0.16, 0.004, 0.55);
          o.connect(g); g.connect(efeitos); envia(g, reverb, 0.5); o.start(t + d); o.stop(t + d + 0.7);
        });
      },
      caneta(t, { dur: d = 0.85 }) {                   // assinatura se escrevendo
        const s = fonteRuido(t, d + 0.05), bp = filtro('bandpass', 2800, 2.2), hp = filtro('highpass', 1200), g = ac.createGain();
        g.gain.setValueAtTime(0.0001, t);
        for (let x = 0; x < d; x += 0.03) g.gain.linearRampToValueAtTime(0.02 + 0.08 * r(), t + x);
        g.gain.linearRampToValueAtTime(0.0001, t + d);
        s.connect(bp); bp.connect(hp); hp.connect(g); g.connect(efeitos);
      },
    };

    // ---- arranjo: 1 acorde por compasso. Abertura mais leve (sem bateria), mas
    // presente desde o quadro 0; no cartão final o arpejo segue até o fade.
    const introAte = A.introAte ?? A.bateria[0], final = A.final ?? A.bateria[1];
    for (let c = 0; c < A.sequencia.length; c++) {
      const t0 = c * COMPASSO, acorde = A.acordes[A.sequencia[c]];
      if (t0 >= dur) break;
      const intro = t0 < introAte, fim = t0 >= final;
      pad(t0, t0 + COMPASSO, acorde, intro ? 0.2 : fim ? 0.22 : 0.14);
      for (let i = 0; i < 8; i++) {
        const t = t0 + i * BATIDA / 2;
        if (t < (A.arpejoDesde ?? 2.0) || t >= dur - 0.8) continue;
        pluck(t, acorde[ARPEJO[i]] + 12, intro ? 0.09 : fim ? 0.08 : 0.07, i % 2 ? 0.35 : -0.35);
      }
      const nb = A.baixos[A.sequencia[c]];
      if (intro) baixo(Math.max(t0, A.baixoDesde ?? 1.0), t0 + COMPASSO, nb, 0.16);
      else baixo(t0, t0 + COMPASSO, nb, temBumbo(t0) ? 0.32 : 0.2);
    }
    const [b0, b1] = A.bateria;
    for (let t = b0; t < b1 - 1e-6; t += BATIDA) if (temBumbo(t)) bumbo(t, 0.85);
    for (let t = b0 + BATIDA; t < b1; t += 2 * BATIDA) if (temBumbo(t)) palma(t, 0.32);
    for (let t = b0 + BATIDA / 2; t < b1; t += BATIDA) chimbal(t, 0.11);
    for (let i = 0, t = b0; t < b1; i++, t = b0 + i * BATIDA / 4) chocalho(t, i % 2 ? 0.028 : 0.045);
    for (const v of A.viradas || []) {                 // chimbal e palmas crescendo até v
      for (let t = v - 3 * BATIDA; t < v; t += BATIDA / 4) chimbal(t, 0.03 + 0.1 * (t - v + 3 * BATIDA) / (3 * BATIDA));
      for (let t = v - 2 * BATIDA; t < v; t += BATIDA / 4) palma(t, 0.05 + 0.22 * (t - v + 2 * BATIDA) / (2 * BATIDA));
    }

    for (const [nome, t, opc] of EFEITOS) {
      if (t == null || t >= dur) continue;
      if (!FX[nome]) throw new Error('efeito desconhecido: ' + nome);
      FX[nome](t, opc || {});
    }
  }

  // sala sintética para o reverb: ruído que decai e escurece
  function sala(ac, r, seg = 2.4) {
    const n = Math.floor(seg * ac.sampleRate), buf = ac.createBuffer(2, n, ac.sampleRate);
    const ataque = 0.012 * ac.sampleRate;
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < n; i++) {
        const k = i / n, x = (r() * 2 - 1) * Math.pow(1 - k, 3.2);
        lp += (x - lp) * (0.25 + 0.6 * (1 - k));
        d[i] = lp * (i < ataque ? i / ataque : 1);
      }
    }
    return buf;
  }

  async function renderizar(dur) {
    const ac = new OfflineAudioContext(2, Math.ceil(SR * dur), SR);
    montar(ac, dur);
    return ac.startRendering();
  }
  return { renderizar, temBumbo };
})();
