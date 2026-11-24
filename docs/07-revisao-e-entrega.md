# Revisão e entrega

> Revise o **MP4**, não a prévia. Os defeitos aparecem no arquivo final, ampliado, quadro a quadro.

## As conferências (sem abrir editor)

`ferramentas/revisar.py` (Python 3 + Pillow + FFmpeg):

| Comando | Para quê |
|---|---|
| `python ferramentas/revisar.py specs final.mp4` | duração, tamanho, fps, codec, áudio |
| `python ferramentas/revisar.py folha final.mp4 --fps 1` | folha de quadros do vídeo inteiro (inclusive o fim) |
| `python ferramentas/revisar.py folha final.mp4 --fps 8 --de 10 --ate 14` | instante exato de um trecho |
| `python ferramentas/revisar.py volume final.mp4 --passo 0.5` | volume a cada meio segundo, integrado, pico e alertas |
| `python ferramentas/revisar.py recorte final.mp4 --t 12.3 --caixa 0,800,1080,1100` | ampliar um pedaço (dado pessoal borrado?) |
| `python ferramentas/revisar.py grade quadro.png` | grade numerada para medir posição de toque, texto, borrão |

No template de motion: `node render.mjs --quadros 1,5.2,11` (PNGs soltos) e `--guia` (desenha as faixas que a
interface do Reels cobre).

## Checklist antes de dizer pronto

- [ ] Rosto e cabeça inteiros em todo quadro; nenhum texto sobre o rosto.
- [ ] Quadro 0 não está vazio; gancho nos 3 primeiros segundos.
- [ ] Cada texto fica o tempo de leitura (~0,3 s por palavra + 0,5 s).
- [ ] Nada importante nas faixas da interface.
- [ ] Nenhum texto duplicado na tela; nenhuma sobreposição nas viradas.
- [ ] Número na tela só se a fala disse e se tem fonte.
- [ ] Fecho com a logo oficial (proporção certa, tamanho legível) e a ação final.
- [ ] Nenhum dado pessoal legível (conferido ampliado).
- [ ] Volume: ~-14 LUFS, pico < -1 dBTP, começo não mudo, fim não despenca.
- [ ] Fala aberta sem música por cima; música só livre ou da biblioteca da plataforma.
- [ ] Ouviu o fim do arquivo.
- [ ] Specs: 1080×1920, 30 fps, áudio presente, duração dentro do limite do canal.
- [ ] Áudio recodificado antes do envio.
- [ ] Os itens de [`05-erros-que-ja-cometemos.md`](05-erros-que-ja-cometemos.md) que se aplicam a este formato.

## Prova antes do lote

Uma peça de prova (8 a 12 s) revisada por quem aprova antes de produzir as variações. Sem modelo aprovado, 4
provas de direção de arte bem diferentes. Lote produzido antes da primeira revisão é lote no lixo.

## Entrega

Principal 1080×1920 (CRF 16) + versão leve 720×1280, numa pasta com o nome do vídeo. Entrega a cliente nunca de
madrugada (00h–06h): agende.
