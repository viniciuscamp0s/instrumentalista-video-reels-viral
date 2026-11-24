# Corte, legenda e edição de vídeo gravado

> Vídeo filmado (depoimento, bastidor, aula, reel falado). Motion feito do zero está em
> [`04-motion-e-templates.md`](04-motion-e-templates.md).

## Ordem de trabalho

1. **Preparar** — normalize antes de editar: SDR, 1080×1920, 30 fps, orientação correta.
   ```bash
   ffmpeg -i bruto.mov -vf "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30" -c:a aac preparado.mp4
   ```
   (sem HDR, basta `scale`, `crop` e `fps`.)
2. **Transcrever** — whisper local, com tempo por palavra:
   ```bash
   whisper preparado.mp4 --model small --language pt --word_timestamps True --output_format all
   ```
3. **Cortar silêncio** — sem IA, pela transcrição ou por `silencedetect`: vãos acima de 0,9 s viram 0,22 s; em
   reel falado, pausas acima de 0,45 s viram 0,15 s. Frase regravada: fica só a última tomada.
4. **Ouvir o arquivo inteiro** — inclusive o fim (conversa fora de cena, palavrão).
5. **Enquadrar** — meça a cabeça com detector de rosto local (MediaPipe, OpenCV) e calcule zoom e recorte a partir
   da medida. Nunca corte rosto nem cabeça.
6. **Legendar** — dinâmica, palavra a palavra (ver abaixo), fora das faixas da interface e nunca sobre o rosto.
7. **Gancho e impacto** — frase mais forte no primeiro segundo; um take de impacto no máximo.
8. **B-roll** — da atividade real; gerado por IA só quando faltar cena, sem texto, sem logo e sem pessoas.
9. **Som** — ~-14 LUFS, pico abaixo de -1 dBTP; fala aberta sem música por cima.
10. **Fecho** — logo oficial (nunca o nome escrito) e a ação final.
11. **Revisar o MP4** — folha de quadros do arquivo final, specs e volume (`ferramentas/revisar.py`).

## Legenda dinâmica

- Grupos de até 3 palavras, pop na entrada, a palavra falada acende.
- Palavra de ênfase (número, dinheiro, termo-chave) troca de fonte e cresce, com zoom curto.
- Corpo medido contra a referência (ex.: condensada ~54 px; ênfase ~90 px num quadro 1080×1920).
- Contraste garantido: placa ou sombra, conferido sobre fundo claro.
- Fora das faixas que a plataforma cobre: topo até 250 px, rodapé a partir de 1536 px, coluna direita (x > 950,
  y entre 1100 e 1700).
- Nunca duas cópias do mesmo texto na tela; nunca texto sobre o rosto.

Legenda simples queimada pelo FFmpeg (a partir do `.srt` do whisper):

```bash
ffmpeg -i video.mp4 -vf "subtitles=video.srt:force_style='FontName=Inter,FontSize=16,Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=3,Alignment=2,MarginV=420'" -c:a copy legendado.mp4
```

Para legenda palavra a palavra com animação, desenhe em código (canvas, HTML) a partir dos tempos por palavra do
whisper, renderize em PNG com alfa e componha no FFmpeg (ver "Composição", abaixo).

## Tela dividida

- Painel de cima: b-roll com véu na cor escura da marca, motion e título por cima.
- Painel de baixo: a pessoa, com a cabeça inteira (medida, nunca no olho), abaixo da legenda.
- Quando o fundo é o argumento, o take vai inteiro num cartão arredondado com borda fina.
- Selfie muito de perto: vídeo a ~88% sobre ele mesmo desfocado, título no topo.

## Composição (pessoa + gráficos)

- **Nunca** renderize a pessoa dentro da página de gráficos: fica 10× mais lento.
- Gráficos em sequência PNG com alfa → `.mov` qtrle → overlay no FFmpeg.
- Dois passes: base + pessoa; depois frente + áudio.
- Áudio com `-af` fora do grafo de vídeo (num grafo único o áudio já saiu 1,8 s mais curto).

```bash
ffmpeg -framerate 30 -i graficos/%05d.png -c:v qtrle graficos.mov
ffmpeg -i base.mp4 -i pessoa.mp4 -filter_complex "[0][1]overlay=0:820" -c:v libx264 -crf 16 -an passo1.mp4
ffmpeg -i passo1.mp4 -i graficos.mov -i voz.wav -filter_complex "[0][1]overlay" -map 2:a -c:v libx264 -crf 16 -pix_fmt yuv420p -c:a aac -b:a 192k -af "loudnorm=I=-14:TP=-1.5" -movflags +faststart final.mp4
```

## Entrega

| Versão | Tamanho | Qualidade |
|---|---|---|
| Principal | 1080×1920, 30 fps | H.264 CRF 16 (~8 Mbps), AAC 192k |
| Leve | 720×1280 | ~1 Mbps |
| Feed | 1080×1350 | igual à principal |

Antes de publicar: recodifique o áudio (envio com áudio copiado do render já foi recusado de forma intermitente) e
confira duração, fps e áudio com `python ferramentas/revisar.py specs final.mp4`.

Checklist completo: [`05-erros-que-ja-cometemos.md`](05-erros-que-ja-cometemos.md).
