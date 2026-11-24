# Erros que já cometemos (e a trava de cada um)

> Cada regra aqui é um vídeo que voltou: de cliente, de anúncio ou do perfil próprio. Leia antes de editar e use
> como checklist antes de entregar. Formato: **a regra** · o erro que aconteceu → a correção.
> Números (px, segundos, dB) são os que funcionaram num quadro 1080×1920 a 30 fps.

## Enquadramento e rosto

- **Nunca corte rosto nem cabeça, em enquadramento nenhum (tela dividida, zoom, recorte).** A tela dividida cortou
  o apresentador da boca para baixo. → Meça a caixa da cabeça no take com detector de rosto local, com folga para
  cabelo, queixo e orelhas; a medida é obrigatória antes do render. Na tela cheia, o zoom baixa até a cabeça
  caber; na divisão, a pessoa reduz até a cabeça inteira caber no painel, abaixo da legenda. Custa ~40 s por vídeo.
- **Take filmado muito de perto não ganha zoom.** Zoom sobre um rosto que já enche o quadro corta a cabeça. → O
  movimento vem dos cortes e do b-roll.
- **Quando o fundo é o argumento, mostre o take inteiro.** A tela dividida com corte e desfoque escondeu o cenário
  que provava o ponto. → Modo "inteiro": o take sem corte vira um cartão arredondado com borda fina na cor de
  acento, embaixo; b-roll e texto no painel de cima.
- **Nunca ponha texto sobre o rosto.** Cartão e frase caíram em cima do rosto em vários posts. → Detecte o rosto
  em ~6 quadros do trecho, leve a caixa para o enquadramento final com folga e empurre o texto para a faixa livre.
  Sem faixa livre, o render falha (ou sai sem texto), nunca com texto no rosto. Vale para o título dos vídeos falados.
- **Selfie de perto: encolha o vídeo.** O título não tinha onde ficar. → Vídeo a ~88% na base, sobre ele mesmo
  desfocado, e título no topo livre.
- **A cabeça nunca alcança a legenda.** Quando a pessoa se inclinava, o recorte cobria a legenda. → Meça o alfa do
  recorte e desça a pessoa; o que ainda subir some suave acima de um limite.
- **Enquadre por medida, não por impressão.** A pessoa ficava pequena em planos abertos. → Meça a pessoa em cada
  local e calcule zoom e alvo pela largura dos ombros (~42% do quadro, cabeça a ~17% do topo).
- **Limpe o recorte da pessoa.** Um ventilador de teto entrou no recorte e flutuou na tela dividida; o rosto de um
  banner de fundo foi recortado como "pessoa". → Limite a faixa vertical válida do recorte e apague blocos
  estranhos no alto, preservando cabelo e pele.
- **Não corte o produto ao recortar para 9:16.** → Confira cada plano já recortado, no quadro final.
- **Corrija a orientação antes de montar.** Vídeo de câmera invertido foi ao ar. → Detecte a orientação e gire.

## Gancho e take de impacto

- **O take de impacto mostra uma informação só.** O gancho tinha título, rótulo, 4 selos e um painel animados ao
  mesmo tempo, e nada se destacava. → Só a informação de maior peso, enchendo o painel: uma linha gigante com o
  destaque na cor de alerta e uma linha menor embaixo. Animação pesada casada com a palavra falada (batida seca,
  tremor, vidro rachando, clarão) e som de alerta (tambor grave, vidro quebrando). Sem legenda durante o take.
- **O destaque tem de caber na largura.** A palavra passou da borda. → Encolha até caber e confira no MP4.
- **Nunca deixe o quadro 0 vazio.** Abertura escura e vazia é gancho perdido. → O elemento principal já aparece
  no primeiro quadro; pancada, tremor ou clarão nos 3 primeiros segundos.
- **Em anúncio, algo novo a cada ~0,5 s e nenhuma tela parada além de ~1,2 s.** A primeira prova voltou como
  "morta": cartão girando, 4 s por preço, acordes lentos. → Takes rápidos, com no máximo 1/3 dos elementos se
  mexendo ao mesmo tempo.
- **Abra pelo motivo para agir, não pelo "como".** → Oferta primeiro (pancada em ~1 s), passo a passo depois.
  Nunca comece com o nome da empresa.
- **Teste dois ganchos.** → Duas versões do mesmo vídeo que só mudam o gancho.
- **Pancada de texto transforma, não duplica.** Três textos ficaram sobrepostos na troca do título. → As mesmas
  palavras mudam de lugar e viram o título seguinte.
- **Título que só rotula não retém.** Cortes com título do tipo "a pergunta que cala empresário" tiveram zero
  compartilhamentos. → Abra com a frase mais forte no 1º segundo e uma legenda curta com a tese.
- **Motion mudo não é post.** Frase curta sobre animação, sem voz, segurou só ~15% das pessoas e ~2,4 s de tempo
  médio. → Dê voz e tese ao motion, ou não publique como post inteiro.

## Legenda e texto na tela

- **Respeite a régua de leitura.** Um texto de 4 palavras ficou 0,65 s na tela e voltou com "mais tempo para ler".
  → Mínimo de ~0,3 s por palavra + 0,5 s depois de terminar de entrar. Se o efeito come o tempo, estique a cena,
  nunca a leitura.
- **Dê contraste à legenda.** Um letreiro sumiu sobre parede branca. → Placa ou sombra, conferido sobre fundo claro.
- **Nunca duas cópias do mesmo texto ao mesmo tempo.** A legenda repetia o texto do painel. → O texto se transforma;
  em cena cujo painel repete a fala, tire a legenda.
- **A linha que sai termina antes de a nova entrar.** Título velho e legenda nova ocuparam o mesmo lugar; dois
  cartões lado a lado se encostaram e esconderam o "+". → Saída antes da entrada e vão entre os elementos.
- **Fique fora das faixas que a plataforma cobre.** Texto no topo, no rodapé ou na coluna de botões sumiu sob a
  interface. → Em 1080×1920: topo até 250 px, rodapé a partir de 1536 px e coluna direita (x > 950, y entre 1100 e
  1700) livres de informação. Confira com o guia desenhado no quadro (`render.mjs --guia`).
- **Texto variável precisa caber sozinho.** Nomes longos saíram cortados na borda. → Encolha o corpo até caber
  (largura menos 100 px) ou quebre em 2 linhas, por código.
- **Limite o zoom pela largura do número.** No zoom de 1,45 o "R$" saiu cortado. → Zoom de cada preço limitado pela
  largura medida, com folga para pulso e soco.
- **Dígito com a largura real do glifo.** A largura fixa do "0" deixou um buraco ("21 .900"). → Use a largura real
  de cada glifo no número animado.
- **O texto principal cresce até o maior tamanho que cabe.** Card com área morta parece frouxo. → Cada card mede o
  espaço e põe o número ou a headline no maior corpo possível.
- **Título do painel não fica sobre outro elemento nem sob a legenda.** → Confira sobreposições nos quadros de
  cada virada.
- **Todo vídeo com fala aberta leva legenda dinâmica.** → Palavra a palavra, grupos de até 3, pop na entrada; a
  palavra falada acende; a de ênfase (número, dinheiro, termo-chave) troca de fonte e tamanho.
- **Meça a tipografia contra a referência, não a olho.** Legenda saiu com o dobro do tamanho e fonte errada. →
  Folha lado a lado com a referência, corpo medido (ex.: legenda condensada ~54 px, ênfase ~90 px). Só fonte de
  licença livre.
- **Confira o final do vídeo.** Legendas sobrepostas no fim e logo minúscula no fecho passaram despercebidas. →
  Folha de 1 quadro por segundo do MP4 inteiro, inclusive os últimos segundos.
- **Número na tela só se a fala disse.** Número solto vira promessa sem lastro. → Conferência por código antes do
  render.
- **Efeito de texto novo fica desligado até ter prova.** → Ligue depois de comparar com exemplos reais.

## Narração, áudio e trilha

- **Voz de locutor: grave, madura, em ritmo rápido.** Rodadas de vozes sintéticas foram reprovadas por jovens e
  lentas; outra trouxe 7 vozes pouco graves e quase iguais. → Voz grave com ênfase e respiro nos momentos-chave
  (preço, economia, chamada). Toda rodada de amostras tem contraste grande entre as opções. Quem decide o timbre é
  uma pessoa ouvindo, por amostra.
- **Sotaque estrangeiro na voz local vem do conversor de texto em fonemas.** → Use o fonemizador do próprio modelo;
  se persistir, troque por voz nativa do idioma.
- **Preço por extenso, sem vírgula de milhar.** A vírgula fez a voz parar no meio do número. → "nove mil trezentos
  e nove reais"; centavos como no varejo, sem a palavra "centavos". A tela mostra o valor exato.
- **Termo em inglês se escreve em inglês no texto da fala.** A grafia "fonética" deslocou a tônica. → Escreva o
  original e confira a tônica.
- **Dicionário de pronúncia por marca.** Nome da marca e valores saíram mal pronunciados. → Registre a pronúncia
  de cada nome e emende só a palavra errada.
- **Gerador de voz com semente fixa devolve o mesmo áudio.** → Para refazer uma palavra, mude o texto.
- **Modelos de voz engolem o fim de texto longo.** → Confira a duração e leia a transcrição take a take antes do
  render; frase engolida é gerada sozinha.
- **Não rode voz pesada na CPU de um notebook.** Uma frase curta levou ~13 min e um modelo travou a fila por quase
  uma hora. → Uma fala por vez, nunca pedir de novo enquanto processa, e GPU para modelos grandes.
- **Volume: começo nunca mudo, abertura até ~6 LU abaixo do corpo, final sem despencar.** Um vídeo abria a -30
  LUFS contra -11 do corpo e fechava a -29 justo no endereço. → Som no quadro 0, ~-14 LUFS integrado, pico abaixo
  de -1 dBTP; meça a cada 0,5 s (`python ferramentas/revisar.py volume`).
- **Limite o pico depois do AAC.** O loudnorm sozinho deixou pico real de -0,6 dBTP. → Limitador a 192 kHz em
  -2 dBFS depois do loudnorm. Corrige sem re-renderizar a imagem:
  `ffmpeg -i in.mp4 -c:v copy -af "aresample=192000,alimiter=limit=0.79:attack=1:release=60:level=false,aresample=48000" -c:a aac out.mp4`
- **Compressor do Web Audio tem ganho de compensação embutido.** → Meça de novo (ebur128) depois de qualquer
  mudança no som.
- **Redutor de ruído neural destrói voz reverberante.** Tirou 12,6 dB da voz e a deixou "debaixo d'água". →
  Redutor adaptativo que nunca tira mais de 3 dB; devolva corpo em 150–350 Hz, abaixe a dureza em 2,5–4,5 kHz,
  expansor nas pausas, compressão só de pico.
- **Trilha sem cara de toque de celular.** Osciladores puros e melodia aguda foram reprovados. → Equilíbrio por
  oitava medido, com energia acima de 200 Hz (é o que o celular toca). Se duas trilhas reprovam, o vídeo vai só
  com voz e efeitos.
- **Nunca ponha música sobre fala aberta.** Um corte de aula saiu com a fala e um áudio da plataforma por cima;
  mesmo a -23 dB soou como duas falas. → Fala aberta sobe só com o som próprio.
- **Cena de fé ou luto nunca leva frase ou áudio incongruente.** Um vídeo de oração saiu com frase de humor. →
  Detecte a cena sem IA (pose, olhos fechados), marque o clima de cada áudio, e o render recusa a combinação errada.
- **Frase que cita um áudio usa exatamente aquele áudio, ou o post não sai.** → Guarde o id do som da referência e
  confira antes de agendar.
- **Som e imagem saem da mesma tabela de eventos.** Tempo duplicado em dois lugares dessincronizou. → Uma lista
  única de pancadas alimenta tremor, clarão e som.
- **Cada movimento importante tem o seu som, na grade da batida.** → A 120 bpm, viradas em múltiplos de 0,5 s;
  entrada da bateria e cartão final em compasso inteiro (múltiplos de 2 s).

## Corte e ritmo

- **Corte silêncio sem IA, deixando respiro.** → Vãos acima de 0,9 s viram 0,22 s; em reel falado, pausas acima de
  0,45 s viram 0,15 s. Frase regravada: fica só a última tomada.
- **Ouça o arquivo inteiro antes de entregar.** Um depoimento terminava com conversa fora de cena e palavrão. →
  Ouça o fim e corte antes.
- **Em motion de anúncio não há corte seco.** → Toda troca tem transição (clarão, zoom, desfoque, deslize, peça que
  vira outra).
- **Movimento com easing intencional.** → Entrada desacelera (outExpo, outQuint, outBack no que salta), saída
  acelera, deslocamento é inOut. Nunca linear. Nada atravessa mais de 1/3 da tela sem chave intermediária.
- **Acelere a espera, nunca o momento que ensina.** → Em gravação de tela, transição cruzada de 0,12–0,3 s em todo
  salto de tempo; a escolha-chave em tempo real.
- **Folha de 1 quadro por segundo erra o instante exato.** Uma confirmação parecia estar em 67 s e estava em 73 s.
  → 4 a 10 quadros por segundo nos trechos que importam; troca de tela conferida pixel a pixel.
- **Reel de bastidor com texto: 8 a 15 s.** A meta de ~20 s era longa demais (mediana medida: 9 s). → Um plano,
  câmera fixa ou ponto de vista, texto do começo ao fim, sem olhar para a lente.
- **Luz que pisca em 3D (z-fighting).** → Separe as superfícies coplanares e use deslocamento de profundidade.

## B-roll e cenário

- **Na tela dividida, b-roll no painel de cima com véu na cor escura da marca.** → Prefira clipe da atividade
  real (equipe trabalhando).
- **O cenário tem o padrão do público que se quer atingir.** Saiu com cara de público mais popular quando o alvo era
  de renda alta. → Região, fachada e ambientes do padrão aquisitivo do público, sempre com aspecto de foto real.
- **Use a cidade real do cliente, nunca a capital por padrão.** → Para um marco da cidade, pesquise, olhe uma foto
  e descreva forma, cor e tamanho no prompt: só o nome deixa a IA inventar o monumento.
- **Imagem gerada por IA: sem texto, sem rótulo, sem logo, sem pessoas.** → Peça no prompt e confira todas numa
  folha antes do render. Vídeo gerado costuma trazer texto queimado e errado: use só os trechos limpos.
- **3D com cara de videogame é reprovado.** → Quadro inicial em foto real e o prompt "real-world look and natural
  colors, never CGI, never a video game".
- **Produto em 3D não pode parecer desenho.** → Estúdio com ciclorama, luzes de área e sombra macia, pós-processo
  discreto (oclusão, profundidade de campo, brilho só nos reflexos), imperfeição mínima. A cor da marca só no
  fundo e nos brilhos.
- **Uma ação contínua cabe num take só.** Clipes separados fizeram o prédio "aparecer do nada" e a abertura virou
  um "frankenstein". → Take único com quadro inicial e final, o alvo visível desde o primeiro quadro, e o quadro
  final com a logo oficial intacta.
- **Tecido simulado em 3D parece plástico.** → Fumaça leve e atmosfera em vez de tecido.
- **Demonstração com avatar: o mesmo modelo, só muda o ator.** Reconstruir o cenário do zero gerou tentativa e erro
  demais. → Reproduza movimentos, caminhadas, portas, sentar e levantar da referência; troque só a pessoa. Cenário
  muda o mínimo, sem objeto estranho ao contexto; pessoa fictícia, roupa lisa, sem marca alheia.
- **Logo na roupa do avatar entra por código, nunca desenhada por IA.** Em corpo inteiro ela deformou. → Se o
  modelo deformar, a logo sai.
- **Resíduos da referência saem por código.** A troca de pessoa deixou legenda e logo da referência queimadas. →
  Borrão de borda na faixa do resíduo, a sua legenda e a sua logo por cima.
- **Geração paga de vídeo: verba curta e conta escrita antes de cada chamada.** → Guias curtos (~8 s), resolução
  baixa e interpolação depois; no máximo 2 chamadas por plano.

## Marca, logo e cor

- **O fecho é a logo oficial, nunca o nome escrito.** O fecho mostrou só o nome em texto. → A cena de fecho exige o
  arquivo da logo; sem ele, o gerador para com erro.
- **Sempre uma versão oficial da logo.** A versão branca por padrão e variantes mascaradas foram reprovadas. →
  Completa para fundo escuro, simplificada para fundo claro ou só o símbolo; a branca só onde a colorida some.
  Confira que o arquivo "oficial" não é uma cópia da branca.
- **A logo mantém a proporção e nunca é redesenhada.** Uma caixa fixa achatou logos. → Caixa por largura e altura
  máximas; nunca redesenhada por IA, nunca minúscula no fecho.
- **Efeito na cor da marca, não da referência.** Um efeito azul copiado da referência foi reprovado. → Meça a cor
  na logo oficial (nunca a olho); cor fora da paleta da marca soa amadora.
- **Todo modelo nasce como template.** Modelo preso a uma cor não escala. → Identidade num arquivo só, cada ponto de
  cor marcado `ID VISUAL`, e o modelo aprovado vira ponto de partida das versões novas.
- **O elemento condutor sai de uma forma medida na logo.** → Meça no PNG (caixa dos pixels da cor) e planeje onde
  ele aparece em cada cena.
- **Nada fixo na tela o vídeo todo.** Rodapé legal e selo fixos poluíram. → Cada informação tem o seu take.
- **A mesma frase não aparece em dois lugares.** → Uma casa para cada texto.
- **Nenhum telefone na arte de anúncio.** Telefone rouba o clique do botão. → O fecho aponta para o botão.
- **"A partir de" antes do valor, "à vista" depois.** → Prefixo e sufixo do preço em campos separados.
- **Nenhum dado pessoal legível em gravação de tela.** Nome, telefone e a sugestão do teclado (que oferece o
  próprio número) apareceram. → Borrão em todo quadro, um conjunto de retângulos para cada arrumação da tela,
  medido pixel a pixel e conferido ampliado no MP4 final.

## Motion e template

- **A régua é o melhor vídeo aprovado antes, e só sobe.** → Todo motion novo parte da qualidade do último aprovado.
- **Prova curta antes do vídeo inteiro.** Lote produzido antes da primeira revisão foi para o lixo. → Prova de 8 a
  12 s revisada; sem modelo aprovado, 4 provas de direção de arte bem diferentes (até 8 s cada).
- **Revise o MP4, não a prévia.** Os defeitos do primeiro vídeo só apareceram no arquivo final, ampliado. →
  Quadros soltos de cada cena e de cada virada, mais a folha de 1 quadro por segundo.
- **Render é função pura do tempo.** Prévia e MP4 saíram diferentes por causa de aleatório no desenho. → Nada de
  `Math.random` ou `Date` no desenho; acaso só com semente.
- **Não melhore o motor só dentro do projeto.** A melhoria some no próximo vídeo. → Volta para o template.
- **Tela de aplicativo só se for gravação real.** Notificação ilustrativa imitando app alheio engana. → O resto é
  genérico, no desenho do vídeo.
- **Confira o site ou app no ar antes de ensinar um fluxo.** A gravação mostrava uma promessa que a regra do cliente
  proibia. → O trecho sai e vira aviso ao responsável.
- **Gravação de tela chega comprimida pelo mensageiro.** Chegou em 384×832. → Peça a original (ou como documento);
  sem ela, amplie 2× e ponha os pontos-chave em cartões nítidos por cima.
- **Rolagem em gravação de tela.** Com poucas cópias de desfoque a logo aparecia em degraus; a limpeza de memória
  apagou o quadro em uso. → ~13 cópias com desfoque leve; a limpeza poupa os quadros em uso.
- **Celular 3D: topo, toque e respiração.** O topo subiu sobre o título e o toque caiu na faixa da interface. →
  Limites medidos e uma "respiração" leve, porque celular parado parece imagem colada.
- **Brilho é luz, não bola.** Degradê deslocado parecia bola de bilhar. → Disco de luz com degradê centrado.
- **Contador de preço trava na primeira palavra do número e pulsa a cada palavra.** → A câmera foca no valor quando
  a narração o diz.
- **Motion blur real só onde há pancada.** → Média de 5 subquadros nas pancadas e viradas; o resto custa um render.
- **A cena obedece à fala.** Tempos fixos desalinharam quando a voz mudou. → Alinhe a narração palavra a palavra e
  ancore as cenas nas palavras, nunca num número fixo.

## Render e técnica

- **Não renderize a pessoa dentro da composição de gráficos.** Custava ~1,2 s por quadro (34 s de vídeo = 25 min).
  → Gráficos em PNG com alfa (~0,12 s por quadro) e pessoa e áudio compostos no FFmpeg.
- **Componha em dois passes.** O grafo único perdia a pessoa depois de ~16 s. → Passe 1: base + pessoa; passe 2:
  frente + áudio.
- **Sequência PNG com alfa entra por `.mov` qtrle.** O PNG direto no overlay perdia a interface 2 a 3 quadros antes
  do corte.
- **Áudio fora do filtergraph do vídeo.** No FFmpeg 7.0.2, com os dois no mesmo grafo, o MP4 saiu com 1,8 s de áudio
  a menos. → `-af` fora do grafo; confira a duração final.
- **Fixe a versão do FFmpeg no ambiente de render.** A versão da distribuição não conhecia uma opção do motor.
- **Não rode duas coisas pesadas ao mesmo tempo.** Render + recorte de pessoa estourou a memória. → Uma coisa
  pesada por vez.
- **Renderize em pedaços e junte sem recodificar.** → `render.mjs --pedaco` e `ferramentas/juntar-pedacos.sh`, com a
  trilha normalizada à parte (`--so-som --normalizada`); confira as emendas.
- **Rasterizador por software desenha diferente.** Num servidor sem GPU, profundidade de 16 bits gerou trama e o
  ruído mudou a cada abertura. → Alvos de 24 bits, semente fixa, versão leve do 3D para esse ambiente.
- **HDR e orientação se normalizam antes de editar.** Take de celular em HDR vertical exigiu conversão. → SDR
  1080×1920 no preparo.
- **Modelo de recorte dentro do ambiente.** Baixado na primeira execução, falhou sem internet. → Empacote modelo e
  runtime; recorte só as janelas em que a pessoa aparece.
- **Nome único para arquivo temporário.** Duas filas se atropelaram no mesmo áudio. → PID no nome.
- **Parar a fila mata a árvore de processos.** No Windows o filho seguia para o próximo vídeo.
- **Serviço externo fora do ar: reserva e cache.** → Servidores reserva e cache local.
- **Quadros do navegador voltam por POST, em bytes.** PNG de 4 MB devolvido como texto pelo DevTools travou. →
  POST em bytes; espere fontes e imagens antes de capturar.
- **Entrega padrão.** → Principal 1080×1920 (CRF 16, ~8 Mbps) e leve 720×1280 (~1 Mbps), 30 fps; feed 1080×1350.
  Confira duração, fps e áudio (`python ferramentas/revisar.py specs`).
- **Estimativa honesta de tempo.** ~0,6 s por quadro em motion 2D (45 s ≈ 15 min); 3D cheio ~1,6–1,9 s por quadro.
- **Lote pesado roda de madrugada.** O computador do dia é de quem trabalha nele.

## Roteiro

- **Pesquise o que o mercado já escreve antes de escrever.** Roteiros feitos sem olhar o mercado usaram termos que
  ninguém usa e rebaixaram a solução a "mais ou menos". → Método em [`01-roteiro-e-gancho.md`](01-roteiro-e-gancho.md).
- **Estrutura de retenção.** → Gancho 0–3 s, agitação, solução, prova, oferta, chamada específica.
- **Prova social só com dado confirmado.** → Nunca invente nome, cidade ou valor; sem número confirmado, a frase sai.
- **Nada de "caiu" sem queda comprovada.** → "Por apenas" ou "a partir de", igual ao que a tela mostra.
- **Nome de empresa terceira só com decisão registrada.** → Por padrão, linguagem genérica.
- **Nenhuma frase depende de uma filmagem específica.** → Frase funciona sobre qualquer bastidor; o casamento com o
  trecho é por clima.
- **Texto que contraria a imagem da marca não sai.** Autodepreciação queimou a imagem de quem vende solução.
- **Motion de notícia conta o fato direto, no presente.** Narrar a fonte ("fulano disse") enfraqueceu. → Gancho em
  até 7 palavras, o fato com data ou número, o mecanismo, a virada para o público, o fecho; a fonte na legenda do post.
  Opinião entra marcada como hipótese, nunca no gancho.
- **Fecho de orgânico chama para comentar uma palavra-chave, não para o "link da bio".**
- **Limite de duração e de palavras, com trava antes e depois do render.** → Ex.: até ~88 palavras num motion narrado.
- **Anúncio fecha com o botão de ação.** → Chamada única e específica.

## Publicação e postagem automática

- **Envio recusado de forma intermitente: recodifique o áudio e tente com contêiner novo.** Arquivos com o áudio
  copiado do render falharam 2 de 2; com o áudio recodificado, passaram 2 de 2. → Recodifique o áudio antes do
  envio, até 3 tentativas com contêiner novo, e um conferidor de envio sem publicar antes da agenda. Não atribua
  recusa à duração sem medir.
- **Mixe a música dentro do arquivo.** A plataforma descartou o parâmetro de áudio da API sem erro.
- **Reel de teste pela API tem requisito de conta.** → Sem o requisito, caia para reel normal e tente depois.
- **Contra "conteúdo não original", varie o recorte.** → O mesmo trecho não volta em menos de 7 dias e, na volta,
  muda recorte, velocidade (0,9–1,1), cor e estilo do texto; legenda queimada de terceiro é coberta.
- **A legenda do post completa a frase da tela, nunca a repete.**
- **Confira que todo post agendado tem mídia.** Um arquivo solto travou a agenda em "sem mídia". → Conferência
  antes do horário; falha vai a um canal de erros, não a quem aprova.
- **Idempotência do envio inclui o arquivo.** O 2º vídeo do mesmo cliente foi dado como "já enviado".
- **Entrega a cliente nunca de madrugada.** → Silêncio das 00h às 06h; o envio fica agendado.
- **Corte de reunião: só a fala de quem autorizou.** → Transcrição com identificação de quem fala; nunca voz, rosto,
  nome ou dado de participante; sem câmera, a voz sai sobre bastidores sem boca visível.
- **Aprovação sem resposta é decisão explícita.** Uma máquina parou esperando aprovação; outra publicaria sem ninguém
  ver. → Padrão deste repositório: sem resposta, não publica; publicar por prazo é interruptor ligado por quem
  responde pela conta.

## Referência de terceiros e direitos

- **O conteúdo nunca se copia; o estilo pode.** → Roteiro, texto e exemplos nascem do zero com a referência fechada.
  Estilo de edição pode sair idêntico quando se pede "igual à referência". Voz e texto queimado da referência nunca
  entram.
- **Texto na tela que virou trend pode ser copiado.** → Só o formato que muita gente repete.
- **Trilha de terceiro não se copia.** Vídeo foi recusado por música com direitos. → Música livre do mesmo estilo
  ou a biblioteca da própria plataforma.
- **Não clone voz de terceiro sem autorização escrita do dono da voz.** Mudar a frequência não resolve.
- **Logo e marca de terceiros saem.** → Troque ou borre em código.
- **Crédito quando a licença exige.** → Imagem CC BY leva crédito na tela; fontes OFL.
- **Decupe por medida e veja se um template existente já cobre o estilo** antes de criar outro.
