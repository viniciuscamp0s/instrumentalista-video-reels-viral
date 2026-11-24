---
name: edicao-de-video
description: Edita vídeo gravado (depoimento, bastidor, aula, reel falado) com FFmpeg e whisper - preparo, corte de silêncio, enquadramento sem cortar rosto, legenda dinâmica, tela dividida, b-roll, som e entrega. Use quando pedirem para editar, cortar, legendar, enquadrar ou finalizar um vídeo filmado.
---

# Edição de vídeo gravado

1. Leia `docs/03-corte-legenda-e-edicao.md` (ordem de trabalho, legenda, tela dividida, composição, entrega) e
   `docs/06-narracao-e-som.md` (volume e limpeza de voz).
2. Siga a ordem: preparar → transcrever → cortar silêncio → ouvir o arquivo inteiro → enquadrar por medida →
   legendar → gancho e impacto → b-roll → som → fecho com logo oficial → revisar o MP4.
3. Meça, não estime: cabeça (detector de rosto), volume (`revisar.py volume`), instante exato
   (`revisar.py folha --fps 8`).
4. Antes de entregar, rode o checklist de `docs/07-revisao-e-entrega.md` e as seções que se aplicam de
   `docs/05-erros-que-ja-cometemos.md`.

Nunca: cortar rosto ou cabeça, texto sobre o rosto, música sobre fala aberta, logo redesenhada, dado pessoal
legível, entregar sem ouvir o fim.
