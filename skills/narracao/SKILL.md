---
name: narracao
description: Narração de vídeo com voz própria, TTS local (Kokoro, Piper, Chatterbox) ou na nuvem - texto preparado para a voz, alinhamento palavra a palavra, volume medido e trilha. Use quando o vídeo precisar de voz, locução, narração ou quando a voz soar robótica, lenta ou fora de volume.
---

# Narração

1. Leia `docs/06-narracao-e-som.md`.
2. Escolha a voz pela régua: locutor comercial, grave, madura, ritmo rápido com ênfase nos momentos-chave. Rodada
   de amostras com contraste grande; quem decide é uma pessoa ouvindo.
3. Prepare o texto: valores por extenso sem vírgula de milhar, termo estrangeiro no original, dicionário de
   pronúncia da marca, blocos curtos.
4. Gere, confira a duração e a transcrição de cada bloco, alinhe palavra a palavra (whisper) e ancore as cenas nas
   palavras.
5. Volume: ~-14 LUFS, pico < -1 dBTP, limitador depois do loudnorm (`ferramentas/revisar.py volume`).

Nunca clone a voz de alguém sem autorização escrita dessa pessoa. TTS na nuvem só com o custo escrito e aprovado.
