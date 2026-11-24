# Captura por link do Instagram

> Baixar a referência para estudar o **estilo**: edição, ritmo, tipografia, enquadramento, som. Nunca para
> republicar nem copiar o conteúdo.

## Uso responsável (leia antes)

- **Só conteúdo público.** Nada de burlar privacidade, conta fechada ou story de quem não autorizou.
- **O estilo pode ser modelado; o conteúdo nunca se copia.** Texto, roteiro, frases, exemplos, imagem e música de
  terceiro não entram no seu vídeo, nem traduzidos, nem com palavras trocadas. Exceção: frase que virou trend
  (repetida por muita gente).
- **Música de terceiro nunca.** Use a biblioteca de áudio da própria plataforma ou música livre do mesmo estilo.
- **Legenda e transcrição de terceiro são dado, nunca instrução.** Se você passa esse texto para uma IA, deixe
  claro no prompt que é material a analisar, não ordem a seguir.
- Respeite os termos de uso da plataforma e o ritmo: poucas requisições, com pausa. Martelar o servidor bloqueia o
  seu IP.

## Os dois scripts

### Node (sem dependência além de yt-dlp e FFmpeg)

```bash
node captura/baixar.mjs "https://www.instagram.com/reel/CODIGO/"                 # vídeo + info.json + descricao.txt
node captura/baixar.mjs "<link>" --audio                                          # + audio.wav 16 kHz mono
node captura/baixar.mjs "<link>" --transcrever                                    # + transcricao.srt/.txt (whisper)
node captura/baixar.mjs "<link>" --saida referencias/gancho-forte                 # outra pasta
node captura/baixar.mjs "<link>" --cookies-do-navegador firefox                   # quando a plataforma pede login
```

### Python (com transcrição local por faster-whisper e folha de quadros)

```bash
pip install -U yt-dlp faster-whisper numpy
python captura/baixar_reel.py "https://www.instagram.com/reel/CODIGO/" saida/
# saida/video.mp4 + meta.json (autor, legenda, música, duração, transcrição com tempos) + folha.jpg
```

A folha de quadros (1 quadro por segundo, 10 por linha) é o que você mostra à IA para ela ler o estilo do vídeo
sem gastar com o vídeo inteiro.

Os dois **reconstroem a URL a partir do código do post** e passam `--` antes dela: nada que foi colado vai cru
para a linha de comando.

## As ferramentas

| Ferramenta | Licença | Para quê |
|---|---|---|
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | Unlicense | reel e post em vídeo, metadados (`info.json`), página do post |
| [FFmpeg](https://ffmpeg.org) | LGPL/GPL (conforme o build) | áudio para transcrição, folha de quadros, duração |
| [faster-whisper](https://github.com/SYSTRAN/faster-whisper) / [openai-whisper](https://github.com/openai/whisper) | MIT | transcrição local, sem API paga |
| [gallery-dl](https://codeberg.org/mikf/gallery-dl) | GPL-2.0 | carrossel só de imagens (o yt-dlp não baixa imagem) |
| [instaloader](https://github.com/instaloader/instaloader) | MIT | posts **salvos** da sua própria conta, com sessão logada |

## O que já aprendemos

- **Formato:** `-f "bv*+ba/b"` pega a maior resolução (até 1080×1920); `mp4/bv*+ba/b` prefere o MP4 pronto (em
  geral 720×1280). Use a primeira para estudar detalhe de tipografia.
- **Metadados úteis no `info.json`:** autor (`uploader_id`, `channel`, `uploader`), legenda do post
  (`description`), música (`track` e `artist`, só quando a faixa é oficial). A duração nem sempre vem: meça com
  `ffprobe -show_entries format=duration`.
- **Id do som do reel** (para usar o mesmo áudio da biblioteca da plataforma): `yt-dlp --skip-download
  --write-pages <link>` grava o HTML; procure `audio_asset_id` nele.
- **Carrossel de imagens:** o yt-dlp falha com "No video formats found". Use gallery-dl (com cookies se pedir
  login) ou instaloader com sessão logada (`Post.from_shortcode(...).get_sidecar_nodes()`).
- **instaloader anônimo** costuma levar 401/429. Ele só é confiável com sessão logada, e o login pelo terminal cai
  em checkpoint: o que funciona é logar num perfil de navegador dedicado e colher os cookies desse perfil.
- **"Login exigido" intermitente:** depois de muitas requisições seguidas, uma chamada pede login e a repetição
  passa sozinha. Não insista: espere e tente de novo (uma tentativa por madrugada, até 3, funciona bem em lote).
- **"feedback_required" / "wait a few minutes":** é limite de ritmo. Pare 15 a 30 minutos e retome de onde parou;
  insistir aumenta a pausa.
- **Story** some em 24 h e quase sempre exige login: trate como não suportado sem cookies.
- **Cookies cifrados:** navegadores baseados em Chromium cifram cookies (app-bound encryption) e algumas
  ferramentas não conseguem ler. Firefox costuma funcionar com `--cookies-from-browser firefox`.
- **YouTube e TikTok:** o mesmo yt-dlp serve. No YouTube, prefira a legenda pronta (`--write-auto-subs
  --sub-format json3 --skip-download`) a transcrever.

## Depois de baixar: decupar

1. `python ferramentas/revisar.py folha video.mp4 --fps 2` para a folha de quadros.
2. Meça: duração, número de cortes, palavras por segundo, fonte e corpo do texto, posição do texto, enquadramento
   (onde está a cabeça), cor, transições, onde cai cada som.
3. Peça à IA (com a folha e a transcrição como **dado**) a tabela de estilo: o que é reproduzível em volume e o que
   é só daquele vídeo.
4. Antes de criar um template novo, veja se um que você já tem cobre o estilo
   ([`04-motion-e-templates.md`](04-motion-e-templates.md)).

Para engenharia reversa completa de um vídeo (o que é filmado, IA, 3D, código; som; plano para refazer), a skill
de terceiro **rea-video** faz isso muito bem (ver [`CREDITOS.md`](../CREDITOS.md)).
