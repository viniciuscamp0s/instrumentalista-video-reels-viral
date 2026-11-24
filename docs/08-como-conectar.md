# Como conectar em qualquer estrutura de IA

Este repositório é texto e código simples: qualquer IA que lê arquivos e roda comandos consegue usar.

## Claude Code

O jeito mais direto: siga o [`INSTALAR.md`](../INSTALAR.md). A instalação copia as skills de
[`skills/`](../skills/) para `.claude/skills/` do seu projeto (ou para `~/.claude/skills/`, se você quer em todos
os projetos), instala as skills de terceiros pelos repositórios originais (ver [`CREDITOS.md`](../CREDITOS.md)) e
confere as ferramentas.

## Codex (OpenAI) e outros agentes de código

Codex, Cursor, Gemini CLI e afins leem `AGENTS.md` (ou o arquivo de instruções equivalente). A instalação cria um
`AGENTS.md` no seu projeto que aponta para:

- [`docs/`](./) como base de conhecimento (leia antes de editar qualquer vídeo);
- [`skills/*/SKILL.md`](../skills/) como procedimentos: o agente abre o da função que vai executar;
- [`docs/05-erros-que-ja-cometemos.md`](05-erros-que-ja-cometemos.md) como checklist obrigatório antes de entregar.

## ChatGPT, Claude.ai e outros chats (sem terminal)

Sem terminal, o chat não renderiza vídeo, mas usa a inteligência:

1. Suba como conhecimento do projeto: `docs/01-roteiro-e-gancho.md`, `docs/03-corte-legenda-e-edicao.md`,
   `docs/05-erros-que-ja-cometemos.md` e, se for automatizar postagens, `postagens/ENTREVISTA.md`.
2. Peça roteiro, decupagem de referência, revisão de um vídeo (mande os quadros) e a entrevista da cartilha.
3. O render fica para quando houver um computador com Node, Chrome e FFmpeg.

## N8N, Make e automações

Os comandos são de linha de comando, então qualquer orquestrador que roda comando local chama:

- `node captura/baixar.mjs <link>` para baixar uma referência;
- `node render.mjs` na pasta de um template para gerar o MP4;
- `python ferramentas/revisar.py specs <video>` para conferir antes de publicar.

A IA entra só onde precisa de julgamento (roteiro, frase, decupagem). Render, corte, legenda e publicação são
código: custam zero de assinatura.

## O que precisa estar instalado

| Ferramenta | Para quê | Obrigatória |
|---|---|---|
| Node 22+ | render, captura, ferramentas | sim |
| Google Chrome ou Chromium | render quadro a quadro | sim, para motion |
| FFmpeg | montar, cortar, legendar, medir | sim |
| Python 3 + Pillow | `revisar.py` (folhas de quadros, volume, grade) | recomendada |
| yt-dlp | baixar referência por link | para captura |
| whisper (openai-whisper ou faster-whisper) | transcrever e gerar legenda | para legenda |
