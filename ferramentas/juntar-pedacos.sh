#!/bin/bash
# juntar-pedacos.sh <saida.mp4> <trilha.wav> <pedaco1.mp4> <pedaco2.mp4> ...   (rodar na pasta dos arquivos, caminhos relativos)
# Cola os pedaços mudos (render.mjs --pedaco a,b) na ordem, sem recodificar o vídeo, e põe a trilha (a mesma
# do render inteiro: node render.mjs --so-som) em AAC 192k. Mesmo contêiner do render inteiro (+faststart).
S="$1"; W="$2"; shift 2
L="./.lista-$$.txt"; : > "$L"; for p in "$@"; do echo "file '$p'" >> "$L"; done
ffmpeg -y -loglevel error -f concat -safe 0 -i "$L" -i "$W" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$S"
rm -f "$L"; echo "juntado: $S"
