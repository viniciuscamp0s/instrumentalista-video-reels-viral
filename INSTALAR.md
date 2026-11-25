# Instalar

Abra o Claude Code ou o Codex **na pasta do seu projeto** e cole o prompt abaixo. A IA instala sozinha e, no fim,
pergunta se você quer configurar a automação de postagens.

```text
Instale a inteligência de edição de vídeo do repositório https://github.com/viniciuscamp0s/instrumentalista-video-reels-viral
neste projeto, seguindo o INSTALAR.md dele à risca:
1. Clone o repositório numa pasta instrumentalista-video-reels-viral/ dentro deste projeto (ou atualize com git pull se já existir).
2. Confira as ferramentas (node 22+, ffmpeg, Chrome ou Chromium, python 3 com Pillow, yt-dlp, whisper). Para cada
   uma que faltar, me diga o comando de instalação do meu sistema e instale com o meu ok.
3. Instale as nossas skills: copie cada pasta de instrumentalista-video-reels-viral/skills/ (menos o README.md) para .claude/skills/
   deste projeto. Se você for o Codex ou outro agente sem pasta de skills, crie um AGENTS.md que aponte para
   instrumentalista-video-reels-viral/docs/ como base e para instrumentalista-video-reels-viral/skills/*/SKILL.md como procedimentos.
4. Instale as skills de terceiros a partir dos repositórios originais listados em instrumentalista-video-reels-viral/CREDITOS.md
   (clone cada um numa pasta temporária e copie só as pastas de skill para .claude/skills/), mantendo o LICENSE de
   cada uma. Não copie nada que a licença não permita. Se algum repositório mudou de estrutura, me avise e siga.
5. Rode o teste: cd instrumentalista-video-reels-viral && npm test, e depois renderize 3 quadros do template de exemplo com
   node templates/motion-exemplo/render.mjs --quadros 1,5,11 e me mostre onde ficaram os PNGs.
6. Me mostre em 5 linhas o que ficou instalado e como pedir cada coisa (roteiro, baixar referência, editar,
   motion, narração).
7. Por último, pergunte se eu quero configurar uma automação de postagens. Se eu disser sim, siga
   instrumentalista-video-reels-viral/postagens/ENTREVISTA.md, uma pergunta por vez.
Regras: nada pago sem me dizer o custo antes; segredo (token, senha) eu colo direto no .env, nunca no chat.
```

## O que a instalação faz, passo a passo

| Passo | O que acontece | Quanto custa |
|---|---|---|
| Ferramentas | Node, FFmpeg, Chrome, Python + Pillow, yt-dlp, whisper | 0 (tudo aberto) |
| Skills nossas | `roteiro-de-video`, `captura-por-link`, `edicao-de-video`, `motion-em-codigo`, `narracao`, `automacao-de-postagens` | 0 |
| Skills de terceiros | baixadas dos repositórios originais (lista e licenças em [`CREDITOS.md`](CREDITOS.md)) | 0 |
| Teste | `npm test` + 3 quadros do template | alguns segundos de CPU |
| Automação de postagens | só se você quiser; entrevista de 20 a 40 min | o que você decidir (o padrão é grátis) |

## Instalação manual (sem IA)

```bash
git clone https://github.com/viniciuscamp0s/instrumentalista-video-reels-viral.git
cd instrumentalista-video-reels-viral
npm test
mkdir -p ../.claude/skills && cp -r skills/*/ ../.claude/skills/
node ferramentas/novo-video.mjs ../meu-primeiro-video && cd ../meu-primeiro-video && node render.mjs
```

Quer em todos os seus projetos? Copie as skills para `~/.claude/skills/` em vez de `.claude/skills/`.

## Atualizar

`cd instrumentalista-video-reels-viral && git pull`, depois copie de novo as pastas de `skills/`. Os seus vídeos não são tocados:
para atualizar o motor de um vídeo, rode `node ferramentas/novo-video.mjs <pasta-do-video>` (ele não sobrescreve
`roteiro.js`, `cenas.js` nem `_anexos/`).
