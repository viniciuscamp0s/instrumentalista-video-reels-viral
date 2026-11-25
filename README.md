# instrumentalista-video-reels-viral

**A inteligência de edição de vídeo com IA, pronta para instalar no Claude Code, no Codex ou em qualquer estrutura.**

Roteiro, captura de referência por link do Instagram, corte, legenda, motion graphics, narração, revisão e,
opcional, uma automação de postagens que entrevista você antes de montar. Tudo agrupado por função, com as skills
abertas que usamos creditadas aos autores originais e, principalmente, **os erros que já cometemos em vídeos de
clientes e do perfil próprio, cada um virado em regra**.

O que você leva:

- **Templates que não gastam assinatura depois de prontos.** O vídeo animado é código: o Chrome tira os quadros e o
  FFmpeg monta o MP4, sem IA no render. Identidade visual num bloco só: trocar de marca é trocar cores, fontes e logo.
  Trilha e efeitos sintetizados no próprio render, sem direito autoral.
- **Captura por link.** Cole o link de um reel e saem o vídeo, a legenda do post, a música, a transcrição local e a
  folha de quadros para estudar o estilo. Só conteúdo público, com aviso de uso responsável.
- **Edição que não erra o básico.** Rosto e cabeça nunca cortados, texto nunca sobre o rosto, legenda fora das faixas
  da interface, fecho com a logo oficial, take de impacto com uma informação só, volume medido.
- **Mais de 140 erros reais viraram regra** em [`docs/05-erros-que-ja-cometemos.md`](docs/05-erros-que-ja-cometemos.md):
  enquadramento, gancho, legenda, voz, trilha, corte, b-roll, marca, motion, render, publicação e direitos.
- **Automação de postagens opcional.** Depois de instalar, a IA pergunta se você quer. Se sim, entrevista
  (posicionamento, estilos de edição, quantidade, canais, horários, aprovação) e monta a sua máquina em camadas,
  criando modelos novos a partir do que você gosta.

## Instalar

Cole no Claude Code ou no Codex o prompt de [`INSTALAR.md`](INSTALAR.md). A IA instala, testa e, no fim, pergunta
sobre a automação de postagens.

## Por onde começar

| Você quer | Leia |
|---|---|
| Escrever o roteiro e o gancho | [`docs/01-roteiro-e-gancho.md`](docs/01-roteiro-e-gancho.md) |
| Baixar uma referência pelo link | [`docs/02-captura-por-link.md`](docs/02-captura-por-link.md) |
| Editar vídeo gravado (corte, legenda, tela dividida) | [`docs/03-corte-legenda-e-edicao.md`](docs/03-corte-legenda-e-edicao.md) |
| Motion graphics e templates sem IA no render | [`docs/04-motion-e-templates.md`](docs/04-motion-e-templates.md) |
| **Os erros e as travas (leia antes de entregar)** | [`docs/05-erros-que-ja-cometemos.md`](docs/05-erros-que-ja-cometemos.md) |
| Narração, volume e trilha | [`docs/06-narracao-e-som.md`](docs/06-narracao-e-som.md) |
| Revisar e entregar | [`docs/07-revisao-e-entrega.md`](docs/07-revisao-e-entrega.md) |
| Usar no Codex, num chat, no N8N ou no Make | [`docs/08-como-conectar.md`](docs/08-como-conectar.md) |
| Configurar a automação de postagens | [`postagens/ENTREVISTA.md`](postagens/ENTREVISTA.md) + [`postagens/FLUXO.md`](postagens/FLUXO.md) |
| As skills por função | [`skills/README.md`](skills/README.md) |
| Quem fez as skills e ferramentas de terceiros | [`CREDITOS.md`](CREDITOS.md) |

## O caminho de um vídeo

```text
referência (link) ──> captura/baixar.mjs ──> vídeo + legenda + transcrição + folha de quadros
                                │
                         decupagem por medida (estilo sim, conteúdo nunca)
                                │
roteiro (4 takes, gancho em 3 s) ──┬──> vídeo gravado: preparar → cortar → enquadrar → legendar → som
                                   └──> motion: template → roteiro.js + cenas.js → render sem IA
                                │
                    revisão do MP4 (folha de quadros, volume, specs) + checklist de erros
                                │
                    entrega 1080×1920 + leve ──> (opcional) automação de postagens
```

**A IA cria, o código repete.** IA só onde há julgamento (roteiro, decupagem, frase). Render, corte, legenda,
medição e publicação são código: custam zero de assinatura.

## Experimente em 1 minuto

```bash
git clone https://github.com/viniciuscamp0s/instrumentalista-video-reels-viral.git && cd instrumentalista-video-reels-viral
npm test                                               # testes, sem dependências
node templates/motion-exemplo/render.mjs --quadros 1,5,11   # 3 quadros do template em _preview/
node templates/motion-exemplo/render.mjs               # o MP4 completo do exemplo
```

Precisa de Node 22+, Google Chrome e FFmpeg.

## O que não está aqui

Nenhum dado de cliente, nenhuma marca real, nenhuma voz de pessoa real, nenhuma arte de cliente. As skills de
terceiros não são redistribuídas: a instalação baixa cada uma do repositório original.

## Desenvolvimento

```bash
npm test                         # testes (node --test)
node ferramentas/varredura.mjs   # varredura de privacidade antes de publicar um fork
```

## Licença e créditos

MIT. Feito por Vinicius Campos ([@viniciuscamp0s_](https://www.instagram.com/viniciuscamp0s_/) no Instagram), a
partir dos vídeos que editamos para clientes e para o perfil próprio. Skills e ferramentas de terceiros: ver
[`CREDITOS.md`](CREDITOS.md).
