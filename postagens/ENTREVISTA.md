# Entrevistador da automação de postagens

> Instruções para a IA que está instalando este repositório (Claude Code, Codex ou qualquer outra).
> Este módulo é **opcional**: só começa depois que a inteligência geral de vídeo estiver instalada e a pessoa
> disser que quer configurar a automação de postagens.

## Como conduzir

- **Uma pergunta por vez** (no máximo três quando forem curtas e do mesmo assunto). Nunca um questionário inteiro.
- Depois de cada bloco, **resuma em duas linhas** o que entendeu e peça confirmação.
- **Nunca invente**: história, número, depoimento, dado do produto. O que não se sabe, pergunta-se. A história é
  contada pela pessoa; a IA só edita a forma.
- Quando houver escolha, **proponha de 2 a 3 versões** com a sua recomendação primeiro e o motivo.
- Toda ferramenta ou assinatura nova chega **com o custo mensal escrito antes**, e só entra com o sim da pessoa.
- Segredo (token, senha, chave) **nunca no chat**: a pessoa cola direto no `.env`, e a IA nunca mostra o conteúdo dele.
- Tudo que a entrevista produz vira arquivo na pasta da pessoa (`minha-automacao/`, fora deste repositório).

## Pergunta de abertura (no fim da instalação geral)

> A inteligência de vídeo está instalada. Você quer configurar também uma **automação de postagens**? Eu te
> entrevisto (uns 20 a 40 minutos), monto a sua cartilha de posicionamento, os seus estilos de edição e o seu
> calendário, e deixo a máquina pronta para produzir e publicar com a sua aprovação. Se preferir, fica para
> depois: é só me pedir "configurar automação de postagens".

Se a resposta for não, encerre a instalação. Se for sim, siga os blocos abaixo, na ordem.

## Bloco 1 · Posicionamento (Primal Branding, 7 peças)

Para cada peça: pergunte, proponha de 2 a 3 versões, a pessoa escolhe ou ajusta, grave a escolhida.

| Peça | Perguntas |
|---|---|
| História de origem | Qual foi o ponto de virada? O que aconteceu que fez você criar o que oferece? Qual dor você viveu que hoje resolve para os outros? |
| Credo | O que você acredita que a maioria ainda não entendeu? Que verdade você defenderia mesmo perdendo seguidores? |
| Ícones | O que já é "a sua cara"? Cor, objeto, lugar, jeito de falar, roupa, gesto? |
| Rituais | Que conversa você teria toda semana com a sua comunidade? Que momento fixo faria as pessoas esperarem por você? |
| Léxico | Que palavras você usa que ninguém mais usa? Como chamaria quem pensa como você? |
| Não crentes (o inimigo) | O que te irrita no seu mercado? Que crença comum atrasa a vida das pessoas? **O inimigo é uma ideia ou comportamento, nunca uma pessoa ou marca com nome.** |
| Líder | Quando alguém fala de você para um amigo, o que você quer que diga? Que papel você ocupa (guia, mentora, pioneira, rebelde, cuidadora)? |

Depois: **mapa de marca**. Como cada produto ou serviço expressa o credo? Produto que não cabe no credo é alerta,
e você diz isso.

## Bloco 2 · Oferta

Nome, tema e promessa principal (o que muda na vida de quem usa) · para quem foi feito · onde se compra, preço,
data de lançamento · ativos que já existem (capa, prints, depoimentos reais, logo, cores, link) · se os produtos
conversam entre si.

## Bloco 3 · Perfil hoje e público novo

Qual é o perfil · por que as pessoas seguem hoje · os 3 posts que mais deram certo · país e idade da audiência
(peça o print do painel de estatísticas) · a audiência atual é a que compra? · quem compra (perfil, dor, desejo),
onde está e o que já consome.

## Bloco 4 · Voz e imagem

Como quer ser vista · o que nunca quer parecer · temas proibidos · tom (inspirador, técnico, bem-humorado, firme).
Feche o bloco com **20 frases de calibragem** no tom proposto: a pessoa aprova, corrige ou recusa cada uma. As
corrigidas ensinam mais que as aprovadas.

## Bloco 5 · Estilos de conteúdo e de edição

- Peça de **3 a 10 links ou prints de posts de referência**. Analise cada um numa tabela: duração, tipo de cena,
  texto na tela, ritmo de corte, gancho, por que funciona, se dá para produzir em volume. Para baixar, use
  [`docs/02-captura-por-link.md`](../docs/02-captura-por-link.md). **Do terceiro se copia o estilo, nunca o texto
  nem o roteiro.**
- Estilo de texto na tela (2 a 3 mais 1 de apoio): serifado elegante, caixa tipo nota, sans pesado com contorno...
- Legenda dinâmica nos vídeos com fala? Motion graphics? Narração com a própria voz ou voz sintética?
- Música: só a biblioteca da própria plataforma (música de terceiro derruba post).
- Fecho padrão: palavra-chave nos comentários, link, botão.
- **Se o estilo que a pessoa quer ainda não existe aqui**, crie um modelo novo a partir das referências dela
  (ver "Criar modelos novos", abaixo), mesmo que isso exija outra skill ou assinatura: diga qual e quanto custa
  antes.

## Bloco 6 · Quantidade, canais e horários

Posts por dia e por semana (padrão sugerido: começar com 1 a 3 por dia e subir quando a produção rodar sozinha) ·
mix de formatos em % · canais (Reels, Stories, carrossel, outras redes) · a conta é profissional e ligada a uma
página? · janela de publicação · horário de silêncio · dia sem postagem.

## Bloco 7 · Matéria-prima e rotina

Que vídeos já existem guardados · quanto tempo por semana para gravar · pasta sincronizada para jogar vídeos do
celular (Drive, iCloud, Dropbox) · quer um roteiro diário para gravar?

## Bloco 8 · Aprovação humana

Onde aprova (o próprio chat da IA, um grupo de mensagem, um painel) · prazo de resposta · **sem resposta, o que
acontece?** Padrão deste repositório: **sem resposta, não publica**. Publicar por prazo vencido é um interruptor
que a pessoa liga conscientemente, e você registra que foi decisão dela.

## Bloco 9 · Ferramentas, assinaturas e orçamento

Computador e sistema (fica ligado à noite?) · que IA já assina · nuvem de arquivos · já usa o agendador da
plataforma? · limite mensal de gasto · aceita só ferramentas grátis?

Monte a tabela do que vai usar:

| Peça | Opção grátis | Opção paga (se ela quiser) | Custo |
|---|---|---|---|
| Agendar à mão | agendador oficial da plataforma | — | 0 |
| Publicar sozinho | API oficial da plataforma (app próprio, modo desenvolvimento) | agendador de terceiros | conferir na hora |
| Transcrever | whisper local | API de transcrição | conferir na hora |
| Voz | voz própria ou TTS local | TTS na nuvem | conferir na hora |
| Render | motor deste repositório (ffmpeg + Chrome) | — | 0 |
| IA de texto | a assinatura que ela já tem | API paga | conferir na hora |

Nunca escreva preço de memória: confira na página do fornecedor no dia e diga a data.

## Bloco 10 · Metas

Meta das 4 primeiras semanas · métrica de sucesso (comentário com palavra-chave, clique, venda) · palavra-chave do
CTA · o que queimaria a marca.

## O que você entrega no fim

Na pasta `minha-automacao/` da pessoa, a partir dos modelos em [`modelos/`](modelos/):

1. `CARTILHA.md` — posicionamento em 3 linhas, as 7 peças, mapa de marca, territórios de conteúdo com %, voz,
   riscos de imagem e as frases de calibragem. **Fonte única da voz**: todo gerador lê a cartilha antes de escrever.
2. `FORMATOS.md` — a régua de cada formato, o mix em %, a tradução de cada peça da cartilha em formato recorrente
   (série de origem, frase de convicção, quadro semanal, conteúdo contra o inimigo, bastidor).
3. `ESTILOS.md` — estilos de texto e de edição, cada um como template (identidade num arquivo só).
4. `horarios.json` e `pesos.json` — calendário e régua de desempenho (copiados dos modelos e ajustados).
5. `config.json` — interruptores (ensaio, publicação, aprovação), canais, teto de gasto, chave de parada.
6. A **primeira entrega na mesma sessão**: os 3 a 5 primeiros posts prontos, para ela agendar à mão. A automação
   completa vem depois, em camadas (ver [`FLUXO.md`](FLUXO.md)), e se uma camada travar a manual continua.

## Criar modelos novos a partir do interesse da pessoa

1. Ela manda o link de uma referência → baixe (só conteúdo público), transcreva localmente, decupe (duração,
   ritmo de corte, palavras por segundo, estilo de texto, fundo, som).
2. Da decupagem nasce um **template**: identidade num arquivo só, render por código, sem IA no render (ver
   [`docs/04-motion-e-templates.md`](../docs/04-motion-e-templates.md)).
3. **Uma peça de prova** revisada por ela antes de produzir o lote.
4. Se o modelo exigir outra skill (ex.: 3D, avatar, voz clonada) ou assinatura, diga qual, o custo e a
   alternativa grátis, e espere o sim.
