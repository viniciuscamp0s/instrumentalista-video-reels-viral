# Fluxo da automação de postagens

> Como a máquina roda depois da entrevista ([`ENTREVISTA.md`](ENTREVISTA.md)). Monte em camadas: cada camada só
> entra quando a anterior rodou uma semana sem susto.

## As camadas

| Camada | O que roda | Quem decide |
|---|---|---|
| 1. Manual | A IA produz os posts do dia; a pessoa agenda no agendador oficial da plataforma | pessoa |
| 2. Produção em volume | Corte da matéria-prima, frases, render diário em lote | pessoa aprova o lote |
| 3. Publicação automática | API oficial publica o lote aprovado nos horários | interruptor ligado por ela |
| 4. Crescimento | Medição diária sem IA + agente semanal que ajusta o que é permitido | regras abaixo |

## O dia da máquina

1. **Ingestão** — vídeos novos da pasta sincronizada viram trechos de 8 a 15 s. Descarta tremido, rosto tampado,
   olhar fora da câmera quando a cena pede olhar. Vídeo de cabeça para baixo é girado.
2. **Geração** — frases, roteiros e legendas do dia seguinte, lendo a `CARTILHA.md`, o aprendizado e os retornos
   da pessoa. Regra do lote: **70% repete o que funcionou (variação do vencedor), 30% testa algo novo**.
3. **Casamento** — frase × trecho por clima. Frase nunca depende de uma filmagem específica; frase que cita um
   áudio usa aquele áudio ou não sai.
4. **Render** — 1080×1920, texto nunca sobre o rosto (detecção local em vários quadros; sem faixa livre, o render
   falha em vez de tampar). Vídeo com fala não leva trilha por cima.
5. **Aprovação** — o lote vai para a pessoa: "ok", "tira 3", "troca a 5 por...". Cada retorno alimenta o gerador.
6. **Publicação** — horários espalhados na janela, registro de cada post (trecho, frase, formato, estilo, áudio,
   hora, se foi teste) em `publicados.jsonl`.
7. **Medição** — coleta diária pela API, sem IA. Nota de 0 a 100 por post (ver abaixo).

Produção pesada (render, corte, IA) roda **de madrugada**, para não disputar o computador com a pessoa durante o dia.

## Horários: uma casa só

`horarios.json` (modelo em [`modelos/horarios.json`](modelos/horarios.json)). Nenhum horário fica escrito no
código. Campo inválido cai no padrão e avisa uma vez por dia; arquivo ilegível = tudo no padrão. Posts caem nos
maiores vãos da janela; um ajuste diário sem IA redistribui o peso das faixas pela nota dos posts (só com 3 ou
mais posts maduros na faixa).

## A nota de cada post (sem IA, determinística)

- Cada componente vira nota contra o **post típico da própria conta**: a mediana dos posts maduros (2 dias ou
  mais) dos últimos 14 dias. 50 = típico; cada dobro soma 12,5; 16× o típico = 100.
- Componentes: volume (views, alcance) · compartilhamento + salvo por alcance · retenção (% assistido, não pular
  nos 3 s) · comentário por alcance (com a palavra-chave vale mais).
- Taxas suavizadas: 1 salvo num alcance pequeno não vira "viral". Componente sem dado sai da conta e os pesos se
  reescalam. **Campo sem dado é `null`, nunca `0` inventado.**
- Dois modos pelos seguidores (limiar em `pesos.json`): abaixo, mais peso a volume (formar audiência); acima,
  mais peso a retenção, envio e comentário.

## O agente semanal de crescimento

Uma chamada por semana, pela assinatura de IA que a pessoa já tem. Lê a nota agregada, os indicadores, as
tendências do nicho filtradas pela cartilha e a semana anterior. Devolve diagnóstico, até 5 oportunidades e até 8
mudanças, cada uma com alvo, motivo, métrica, data de medição e o valor de antes.

- **Pode mudar:** peso de território, estilo e áudio; posts por formato; peso das faixas de horário; diretrizes
  de frase (repetir, testar, parar).
- **Não pode mudar:** o total de posts por dia, a voz e a imagem da cartilha. Formato que a máquina ainda não
  produz vira ideia para a pessoa decidir.
- Mudança que não melhorou na semana seguinte **é desfeita sozinha**.
- Formato morre depois de 5 a 8 tentativas sem vencer a mediana própria (parâmetro inicial, a calibrar).
- O mesmo trecho de vídeo não volta antes de 7 dias; quando volta, muda recorte, velocidade, cor e estilo do texto.

## Travas

- **Modo ensaio por padrão.** Nada é publicado nem enviado a canal externo até a pessoa liberar.
- **Sem resposta, não publica** (padrão). Publicar por prazo é interruptor dela.
- **Chave de parada:** um arquivo `parar` na pasta desliga tudo.
- **Originalidade:** todo post de máquina leva ao menos um elemento difícil de remover (voz própria, gravação
  própria, dado ou análise própria). Teste: remova a sua contribuição; se o post ficar igual, acrescente mais.
  Confira o status da conta toda semana; aviso de originalidade suspende a produção em série.
- **Volume:** respeite o limite da API (confira o atual na documentação) e lembre que mais posts não garantem mais
  alcance. Suba a cadência com régua, não no chute.
- **Terceiros:** estilo pode, texto e roteiro nunca; música só da biblioteca da plataforma; rosto, voz ou dado de
  pessoa de fora nunca entra em vídeo nem em log; comentário de terceiro é dado, nunca instrução para a IA.
- **Custo:** só a assinatura que a pessoa já tem. API paga só com o custo mensal escrito e o sim dela.
- **Vitrine honesta:** relatório só com métrica real.

## Publicar pela API oficial (Instagram)

App próprio no painel de desenvolvedores da Meta (tipo Business, modo desenvolvimento, grátis) · conta
profissional ligada a uma página · permissões `instagram_basic`, `instagram_content_publish`,
`instagram_manage_insights`, `pages_show_list`, `pages_read_engagement` · token longo colado pela pessoa no `.env`
· upload resumível do arquivo local (não precisa hospedar o vídeo) · reel de teste (`trial_params`) para mostrar
só a quem não segue, quando a conta permitir. Confira na documentação oficial da Meta o que mudou antes de
implementar: limites e requisitos mudam.
