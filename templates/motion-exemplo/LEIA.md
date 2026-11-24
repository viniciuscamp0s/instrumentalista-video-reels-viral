# Template de exemplo: motion de 16 s que renderiza sem IA

Vídeo neutro 1080×1920 a 30 fps: gancho com pancada, número que conta, passos, celular com uma tela e um toque,
fecho com a logo e a chamada. Trilha e efeitos sintetizados no próprio render.

```bash
node render.mjs --quadros 1,5,11   # 3 PNGs em _preview/ (segundos depois)
node render.mjs --ate 6            # prova curta
node render.mjs                    # MP4 completo + versão leve, ao lado da pasta
```

Precisa de Node 22+, Google Chrome (ou defina a variável `CHROME` com o caminho do Chromium) e FFmpeg no PATH.

**Para fazer o seu:** `node ../../ferramentas/novo-video.mjs <pasta>` e edite só:

- `roteiro.js` → os blocos marcados `ID VISUAL` (cores, fontes, logo), os tempos (`ROTEIRO`) e os sons (`EFEITOS`);
- `cenas.js` → o desenho de cada cena;
- `_anexos/` → a logo oficial e as imagens (os arquivos daqui são marcadores neutros).

O resto (`nucleo.js`, `trilha.js`, `render.mjs`, `index.html`) é o motor e não se edita por vídeo.
Guia completo: [`../../docs/04-motion-e-templates.md`](../../docs/04-motion-e-templates.md).

Fontes incluídas sob a SIL Open Font License: [`fonts/OFL.txt`](fonts/OFL.txt).
