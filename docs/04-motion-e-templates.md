# Motion graphics e templates que não gastam assinatura depois de prontos

## A ideia

A IA é cara na **criação**: entender a referência, escrever o roteiro, desenhar as cenas. Depois que um vídeo
foi aprovado, refazer ele para outra marca, outro preço ou outra frase **não precisa de IA nenhuma**. Por isso todo
vídeo animado aqui nasce como **template**:

1. **Render por código, determinístico.** O vídeo é uma função do tempo: `render(t)` desenha o quadro do segundo
   `t` num `<canvas>`. O Chrome sem janela tira os quadros um a um e o FFmpeg monta o MP4. O mesmo quadro sai
   sempre igual (nada de `Math.random()` no desenho: acaso só com semente). A prévia no navegador e o arquivo
   final rodam o mesmo código: o que você vê é o que sai.
2. **Identidade num arquivo só.** Cores, fontes e logo moram num bloco só (`PALETA`, `FONTES`, `ARQUIVOS.logo` em
   `roteiro.js`), e todo ponto que usa a identidade leva a marca `ID VISUAL` no comentário. Trocar de marca =
   trocar esse bloco e a logo.
3. **Tempo num lugar só.** O início de cada cena mora em `ROTEIRO`; animação e trilha leem dali. Mudou o ritmo,
   muda num lugar e tudo acompanha.
4. **Som sintetizado.** Trilha e efeitos saem do Web Audio no próprio render (acordes, bumbo, whoosh, impacto,
   "pop"), já normalizados a -14 LUFS com teto de -1,5 dBTP. Sem banco de música, sem direito autoral.
5. **Sem dependência de npm.** Node 22+, Chrome instalado e FFmpeg. Nada de serviço externo.

Custo de uma versão nova depois do template pronto: **zero de assinatura**, alguns minutos de CPU.

## O template de exemplo

[`templates/motion-exemplo/`](../templates/motion-exemplo/) é um vídeo neutro de 16 s, 1080×1920, que passa por
quase todas as peças do motor: gancho com pancada, número que conta, passos, celular com a tela e um toque, fecho
com a logo e a chamada.

```bash
node ferramentas/novo-video.mjs meu-video      # copia o motor + o exemplo para a pasta
cd meu-video
node render.mjs --quadros 1,5,11               # PNGs soltos em _preview/ para conferir
node render.mjs --ate 6                        # prova curta em _preview/
node render.mjs                                # MP4 final + versão leve
```

Prévia ao vivo: sirva a pasta (`npx serve` ou `python -m http.server`) e abra `index.html`.

| Arquivo | O que é | Edita por vídeo? |
|---|---|---|
| `roteiro.js` | `PROJETO` (tamanho, fps), `PALETA`, `FONTES`, `ARQUIVOS`, `ROTEIRO` (tempos), `ARRANJO` (trilha), `EFEITOS` (sons no tempo), gravação de tela | **sim** |
| `cenas.js` | `desenharCenas(c, t)`: o desenho de cada cena, com as peças do motor; a ordem das chamadas é a ordem das camadas | **sim** |
| `nucleo.js` | o motor: fundo com névoa e grão, texto palavra a palavra, destaque em degradê, cartão em 3D (WebGL), celular com gravação e toques, borrões de privacidade, logo, contadores | não |
| `trilha.js` | motor de som: trilha por acordes e efeitos | não |
| `render.mjs` | servidor local + Chrome sem janela + FFmpeg; `--ate`, `--quadros`, `--pedaco`, `--so-som`, `--guia` | não |

Melhoria no motor volta para o template, nunca fica só num projeto: assim o próximo vídeo começa de onde o
último parou (rode `novo-video.mjs` de novo na pasta para atualizar o motor sem tocar no seu roteiro).

## Gravação de tela dentro do celular

Para tutorial e passo a passo: extraia os quadros da gravação (`f_<índice>.jpg` a 30 fps), declare `GRAVACAO`,
monte a `MONTAGEM` (que trecho aparece em que segundo), marque os `TOQUES` no tempo exato do toque na gravação e
cubra todo dado pessoal com `BORROES` medidos pixel a pixel (`python ferramentas/revisar.py grade` e `recorte`).
Confira no site ou app no ar se a gravação ainda bate com o que existe hoje.

## Régua de qualidade do motion

- **3 primeiros segundos prendem.** Pancada visual e sonora no gancho, nunca título parado.
- **Cada movimento importante tem o seu som.** Sem som, a animação parece apresentação de slides.
- **Leitura:** cada texto fica na tela pelo menos ~0,3 s por palavra mais meio segundo.
- **Viradas de cena na grade da batida** (0,5 s a 120 bpm).
- **Faixas seguras:** nada importante onde a interface do Reels cobre (`--guia` desenha as faixas).
- **Logo oficial, nunca redesenhada**, e o fecho termina nela com a ação final (botão, endereço exato).
- **Prova antes do lote:** uma peça revisada antes de produzir as variações.
- Erros que já cometemos em motion: [`05-erros-que-ja-cometemos.md`](05-erros-que-ja-cometemos.md).

## Criar um template novo a partir de uma referência

1. Baixe a referência ([`02-captura-por-link.md`](02-captura-por-link.md)) e faça a folha de quadros:
   `python ferramentas/revisar.py folha referencia.mp4 --fps 2`.
2. Decupe: duração, ritmo de corte, palavras por segundo, tipografia, fundo, luz, cartões, som em cada evento.
3. Reescreva `roteiro.js` e `cenas.js` com o **estilo** da referência e o **conteúdo** seu (texto, roteiro e trilha
   de terceiro nunca se copiam).
4. Identidade no bloco `ID VISUAL`, tempos no `ROTEIRO`, sons no `EFEITOS`.
5. Prova curta (`--ate`), revisão, vídeo inteiro, e guarde a pasta como template aprovado: a próxima versão parte
   dela, sem IA.

## Quando o motor não basta

| Precisa de | Use | Onde |
|---|---|---|
| 3D de verdade (cena, câmera, luz) | Three.js | skills `threejs-*` (ver [`skills/README.md`](../skills/README.md)) |
| Animação de interface em HTML com timeline | GSAP | skills `gsap-*` |
| Vídeo inteiro escrito em HTML com componentes prontos | HyperFrames | skills `hyperframes*` |
| Narração | voz própria, TTS local ou na nuvem | [`06-narracao-e-som.md`](06-narracao-e-som.md) |
