---
name: motion-em-codigo
description: Vídeo em motion graphics feito 100% em código (canvas + Web Audio + render quadro a quadro pelo Chrome e FFmpeg), como template que renderiza sem IA depois de pronto. Use quando pedirem motion, vídeo animado, vinheta, tutorial com gravação de tela num celular, Reels animado, ou um vídeo no estilo de uma referência de motion.
---

# Motion em código

1. Leia `docs/04-motion-e-templates.md` (conceito de template, peças do motor, régua de qualidade, gravação de tela).
2. Brief: sobre o quê, marca (logo oficial, cores e fontes do site ou manual), ação final exata, destino, duração.
3. Comece do template: `node ferramentas/novo-video.mjs <pasta>`; reescreva só `roteiro.js` (identidade em
   `ID VISUAL`, tempos em `ROTEIRO`, sons em `EFEITOS`) e `cenas.js`.
4. Prova curta antes do vídeo inteiro: `node render.mjs --ate 10`; quadros soltos com `--quadros`; faixas da
   interface com `--guia`.
5. Vídeo inteiro: `node render.mjs` → principal 1080×1920 + versão leve.
6. Revise o MP4 (`docs/07-revisao-e-entrega.md`) e as seções **Motion**, **Gancho**, **Legenda** e **Marca** de
   `docs/05-erros-que-ja-cometemos.md`.
7. Melhoria no motor volta para `templates/motion-exemplo/`. Modelo aprovado vira template: a próxima versão parte
   dele, sem IA.

Para 3D de verdade, timeline em HTML ou componentes prontos, use as skills de terceiros `threejs-*`, `gsap-*` e
`hyperframes*` (ver `CREDITOS.md`).
