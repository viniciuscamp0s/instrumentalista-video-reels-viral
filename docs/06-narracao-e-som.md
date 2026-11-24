# Narração e som

## Voz

**A régua:** voz de locutor comercial, grave e madura, que passa credibilidade, em ritmo rápido com ênfase e
respiro nos momentos-chave (preço, ganho, chamada). Voz jovem ou lenta reprova.

| Opção | Custo | Quando |
|---|---|---|
| **Voz própria** gravada no celular | 0 | sempre que der: é o elemento mais difícil de copiar e o que mais prende |
| **TTS local** ([Kokoro](https://github.com/hexgrad/kokoro), [Piper](https://github.com/rhasspy/piper), [Chatterbox](https://github.com/resemble-ai/chatterbox)) | 0 (CPU ou GPU sua) | volume, template, narração que muda a cada versão |
| **TTS na nuvem** | por caractere ou por minuto (confira o preço no dia) | quando a qualidade local não passa na régua e há verba aprovada |

Confira a licença de cada modelo **e dos pesos** antes de usar em anúncio: algumas licenças de pesos têm cláusulas
de uso responsável ou restrição comercial.

**Nunca clone a voz de alguém sem autorização escrita dessa pessoa.** Mudar a frequência não resolve: a voz
continua sendo dela.

## Texto para a voz

- Valor por extenso, sem vírgula de milhar: "nove mil trezentos e nove reais". Centavos como no varejo, sem a
  palavra "centavos". A tela mostra o número exato.
- Termo estrangeiro escrito no original (a grafia "fonética" desloca a tônica).
- Dicionário de pronúncia por marca: nome, produto, siglas.
- Velocidade 1,0 e ênfase pela pontuação e pelo texto, não acelerando o áudio depois.
- Modelos engolem o fim de texto longo: gere por blocos curtos, confira a duração e leia a transcrição de cada
  bloco antes do render.
- Gerador com semente fixa devolve o mesmo áudio para o mesmo texto: para refazer, mude o texto.
- Rodada de amostras sempre com **contraste grande** entre as opções (timbres bem diferentes); quem decide é uma
  pessoa ouvindo.

## A cena obedece à fala

Alinhe a narração palavra a palavra (whisper com `--word_timestamps True`) e ancore cada evento visual numa
palavra, nunca num segundo fixo. Assim, trocar a voz não desalinha o vídeo.

## Volume (medido, nunca no ouvido)

- ~-14 LUFS integrado, pico real abaixo de -1 dBTP.
- Som já no quadro 0; abertura no máximo ~6 LU abaixo do corpo; final sem despencar.
- Limitador **depois** do loudnorm, a 192 kHz, em -2 dBFS (o AAC sobe o pico).
- Meça a cada 0,5 s: `python ferramentas/revisar.py volume final.mp4`.

```bash
# corrigir o pico sem re-renderizar a imagem
ffmpeg -i in.mp4 -c:v copy -af "aresample=192000,alimiter=limit=0.79:attack=1:release=60:level=false,aresample=48000" -c:a aac -b:a 192k out.mp4
```

## Limpeza de voz gravada

- Redutor de ruído neural destrói voz com eco ("debaixo d'água"). Use redutor adaptativo que nunca tira mais de 3 dB.
- Devolva corpo em 150–350 Hz, abaixe a dureza em 2,5–4,5 kHz, expansor nas pausas, compressão só de pico.
- Take de celular baixo (ex.: -30 LUFS): ganho antes de comprimir, e a trilha bem abaixo da voz.

## Trilha e efeitos

- **Fala aberta não leva música por cima.** Nem baixinha: soa como duas falas.
- Trilha sintetizada precisa de energia acima de 200 Hz (é o que o celular toca) e não pode ter cara de toque de
  celular (oscilador puro, melodia aguda simples).
- Se duas trilhas reprovam, o vídeo vai só com voz e efeitos.
- **Cada movimento importante tem o seu som**, tirado da mesma lista de eventos da imagem.
- Grade da batida: a 120 bpm, viradas em múltiplos de 0,5 s; entradas grandes em compasso inteiro (2 s).
- Música de terceiro nunca: biblioteca da própria plataforma ou música livre de licença comercial.
- O template de motion já sintetiza trilha e efeitos em código ([`04-motion-e-templates.md`](04-motion-e-templates.md)).
