#!/usr/bin/env python3
"""revisar.py — conferências de vídeo, sem abrir editor de vídeo.

Cada subcomando existe porque pegou um defeito real num vídeo real.

  specs   <video>                               duração, tamanho, fps, codec, áudio
  folha   <video> [--fps 1] [--de s --ate s]    folha de quadros (mapa da gravação ou revisão do MP4)
  volume  <audio|video> [--passo 0.5]           volume a cada passo + integrado + pico + alertas
  recorte <video> --t T --caixa x0,y0,x1,y1     recorte ampliado de um quadro (privacidade)
  vaos    <imagem> --y0 --y1                    vãos entre palavras numa linha de texto (borrões)
  pixel   <pasta> --de i0 --ate i1 --x --y      cor de um ponto quadro a quadro (troca de tela exata)
  grade   <imagem>                              quadro com grade numerada (medir toques e campos)
  cor     <imagem> --rgb r,g,b                  caixa dos pixels de uma cor (alvo do fio na logo)
  juntar  <imagens...> --saida X.png            junta PNGs lado a lado para revisar de uma vez

Precisa de ffmpeg/ffprobe no PATH e de Pillow.
"""
import argparse
import json
import os
import re
import statistics
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw

sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def rodar(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        sys.exit(f"falhou: {' '.join(cmd[:4])}…\n{r.stderr[-1500:]}")
    return r


def duracao(arq):
    r = rodar(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arq])
    return float(r.stdout.strip())


# --------------------------------------------------------------------- specs
def cmd_specs(a):
    r = rodar(["ffprobe", "-v", "error", "-show_entries",
               "format=duration,size,bit_rate:stream=codec_type,codec_name,profile,width,height,r_frame_rate,pix_fmt,sample_rate,channels",
               "-of", "json", a.video])
    d = json.loads(r.stdout)
    f = d["format"]
    print(f"{a.video}\n  duração {float(f['duration']):.2f} s · {int(f['size']) / 1048576:.1f} MB · {int(f['bit_rate']) / 1e6:.1f} Mbps")
    for s in d["streams"]:
        if s["codec_type"] == "video":
            print(f"  vídeo  {s['codec_name']} {s.get('profile', '')} {s['width']}×{s['height']} {s['r_frame_rate']} fps {s.get('pix_fmt', '')}")
        elif s["codec_type"] == "audio":
            print(f"  áudio  {s['codec_name']} {s.get('sample_rate')} Hz {s.get('channels')} canais")


# --------------------------------------------------------------------- folha
def cmd_folha(a):
    saida = a.saida or os.path.splitext(a.video)[0] + (f"-folha-{a.de:g}-{a.ate:g}" if a.ate else "-folha") + ".png"
    corte = []
    if a.de:
        corte += ["-ss", str(a.de)]
    if a.ate:
        corte += ["-to", str(a.ate)]
    dur = (a.ate or duracao(a.video)) - (a.de or 0)
    n = max(1, int(dur * a.fps + 0.999))
    linhas = max(1, -(-n // a.colunas))
    rodar(["ffmpeg", "-v", "error", "-y", *corte, "-i", a.video, "-vf",
           f"fps={a.fps},scale={a.largura}:-1,tile={a.colunas}x{linhas}:padding=4:color=black", "-frames:v", "1", saida])
    print(f"{saida}  ({n} quadros, {a.colunas} por linha; quadro k = {a.de or 0:g} s + k/{a.fps:g})")


# -------------------------------------------------------------------- volume
def cmd_volume(a):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", a.arquivo, "-af",
                        "ebur128=peak=true:metadata=1,ametadata=print:key=lavfi.r128.M:file=-", "-f", "null", "-"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    momentos, t = [], None
    for linha in r.stdout.splitlines():
        m = re.search(r"pts_time:([\d.]+)", linha)
        if m:
            t = float(m.group(1))
        m = re.search(r"lavfi\.r128\.M=(-?[\d.]+|-inf)", linha)
        if m and t is not None:
            momentos.append((t, float(m.group(1)) if m.group(1) != "-inf" else -120.0))
    integrado = re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)
    pico = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r.stderr)
    if not momentos:
        sys.exit("não consegui medir: o arquivo tem áudio?")
    dur = duracao(a.arquivo)
    janelas = {}
    for t, m in momentos:
        k = round(int(t / a.passo) * a.passo, 3)
        janelas.setdefault(k, m)
    print(f"{a.arquivo}  ({dur:.1f} s)")
    itens = sorted(janelas.items())
    for i in range(0, len(itens), 8):
        print("  " + " | ".join(f"{k:5.1f}s {v:6.1f}" for k, v in itens[i:i + 8]))
    I = float(integrado[-1]) if integrado else None
    P = float(pico[-1]) if pico else None
    print(f"\n  integrado {I} LUFS · pico {P} dBTP")

    # alertas: os 4 defeitos do primeiro vídeo
    corpo = [v for k, v in itens if 0.2 * dur <= k <= 0.8 * dur and v > -70]
    alertas = []
    if corpo:
        ref = statistics.median(corpo)
        inicio = [v for k, v in itens if 0.4 <= k <= 0.8]
        if inicio and max(inicio) < -35:
            alertas.append(f"começo mudo: {max(inicio):.1f} LUFS no primeiro meio segundo (o Reels não pode começar calado)")
        baixos, grupo = [], []
        for k, v in itens:
            if 0.5 <= k <= dur - 1.3 and v < ref - 8:
                grupo.append(k)
            else:
                if len(grupo) * a.passo >= 1.0:
                    baixos.append((grupo[0], grupo[-1] + a.passo))
                grupo = []
        if len(grupo) * a.passo >= 1.0:
            baixos.append((grupo[0], grupo[-1] + a.passo))
        for x, y in baixos:
            alertas.append(f"trecho baixo {x:.1f}–{y:.1f} s: mais de 8 LU abaixo do corpo ({ref:.1f} LUFS). No celular, soa como silêncio")
        fim = [v for k, v in itens if dur - 4.0 <= k <= dur - 1.3]
        if fim and statistics.median(fim) < ref - 8:
            alertas.append(f"final despenca: {statistics.median(fim):.1f} LUFS contra {ref:.1f} no corpo (o cartão final perde força)")
    if P is not None and P > -1.0:
        alertas.append(f"pico {P} dBTP: acima de -1 (o Instagram pede -1 ou menos)")
    if I is not None and not -16.5 <= I <= -12.0:
        alertas.append(f"integrado {I} LUFS: longe de -14 (o Instagram normaliza em torno disso)")
    print("\n  " + ("\n  ".join("⚠ " + x for x in alertas) if alertas else "OK: nenhum dos 4 defeitos conhecidos"))


# ------------------------------------------------------------------- recorte
def cmd_recorte(a):
    x0, y0, x1, y1 = (int(v) for v in a.caixa.split(","))
    saida = a.saida or os.path.splitext(a.video)[0] + f"-recorte-{a.t:g}.png"
    with tempfile.TemporaryDirectory() as tmp:
        q = os.path.join(tmp, "q.png")
        rodar(["ffmpeg", "-v", "error", "-y", "-ss", str(a.t), "-i", a.video, "-frames:v", "1", q])
        im = Image.open(q).crop((x0, y0, x1, y1))
        im = im.resize((int(im.width * a.zoom), int(im.height * a.zoom)), Image.LANCZOS)
        im.save(saida)
    print(saida)


# ---------------------------------------------------------------------- vaos
def cmd_vaos(a):
    fator = 4
    im = Image.open(a.imagem).convert("L").resize((a.largura * fator, a.altura * fator), Image.LANCZOS)
    x0, x1 = a.x0 * fator, a.x1 * fator
    tinta = [min(im.getpixel((x, y)) for y in range(a.y0 * fator, a.y1 * fator)) < a.limiar for x in range(x0, x1)]
    vaos, x = [], 0
    while x < len(tinta):
        if not tinta[x]:
            ini = x
            while x < len(tinta) and not tinta[x]:
                x += 1
            if (x - ini) / fator >= a.min and ini > 0 and x < len(tinta):
                vaos.append((a.x0 + ini / fator, a.x0 + x / fator))
        x += 1
    print(f"vãos ≥ {a.min} px na faixa y {a.y0}–{a.y1} (px da tela {a.largura}×{a.altura}):")
    for i, (p, q) in enumerate(vaos):
        print(f"  [{p:6.1f} – {q:6.1f}]  largura {q - p:4.1f}")
    print("O vão entre palavras é o mais largo depois da palavra; o borrão começa no meio dele.")


# --------------------------------------------------------------------- pixel
def cmd_pixel(a):
    for i in range(a.de, a.ate + 1):
        arq = os.path.join(a.pasta, f"f_{i:05d}.jpg")
        if not os.path.exists(arq):
            continue
        im = Image.open(arq).convert("RGB").resize((a.largura, a.altura))
        print(f"  {i}  {i / a.fps:7.3f} s  {im.getpixel((a.x, a.y))}")


# --------------------------------------------------------------------- grade
def cmd_grade(a):
    im = Image.open(a.imagem).convert("RGB").resize((a.largura, a.altura))
    d = ImageDraw.Draw(im, "RGBA")
    for x in range(0, a.largura, 16):
        d.line([(x, 0), (x, a.altura)], fill=(255, 0, 0, 110 if x % 64 == 0 else 30))
        if x % 64 == 0:
            d.text((x + 2, 2), str(x), fill=(0, 0, 255, 255))
    for y in range(0, a.altura, 16):
        d.line([(0, y), (a.largura, y)], fill=(255, 0, 0, 110 if y % 64 == 0 else 30))
        if y % 64 == 0:
            d.text((2, y + 2), str(y), fill=(0, 0, 255, 255))
    saida = a.saida or os.path.splitext(a.imagem)[0] + "-grade.png"
    im.save(saida)
    print(saida)


# ----------------------------------------------------------------------- cor
def cmd_cor(a):
    alvo = [int(v) for v in a.rgb.split(",")]
    im = Image.open(a.imagem).convert("RGBA")
    px = im.load()
    xs, ys = [], []
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, al = px[x, y]
            if al > 200 and abs(r - alvo[0]) + abs(g - alvo[1]) + abs(b - alvo[2]) <= a.tol:
                xs.append(x); ys.append(y)
    if not xs:
        sys.exit("nenhum pixel dessa cor (aumente --tol)")
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    print(f"{a.imagem} ({im.width}×{im.height}): caixa x {x0}–{x1}, y {y0}–{y1}")
    print(f"  logoAlvo: {{ cx: {(x0 + x1) / 2:.0f}, cy: {(y0 + y1) / 2:.0f}, r: {max(x1 - x0, y1 - y0) / 2:.0f} }}")


# -------------------------------------------------------------------- juntar
def cmd_juntar(a):
    ims = [Image.open(p).convert("RGB") for p in a.imagens]
    ims = [im.resize((a.largura, int(im.height * a.largura / im.width)), Image.LANCZOS) for im in ims]
    altura = max(im.height for im in ims)
    folha = Image.new("RGB", (a.largura * len(ims) + 4 * (len(ims) - 1), altura), (20, 20, 20))
    for i, im in enumerate(ims):
        folha.paste(im, (i * (a.largura + 4), 0))
    folha.save(a.saida)
    print(a.saida)


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    s = p.add_subparsers(dest="cmd", required=True)
    x = s.add_parser("specs"); x.add_argument("video")
    x = s.add_parser("folha"); x.add_argument("video"); x.add_argument("--fps", type=float, default=1)
    x.add_argument("--de", type=float, default=0); x.add_argument("--ate", type=float, default=None)
    x.add_argument("--largura", type=int, default=216); x.add_argument("--colunas", type=int, default=12); x.add_argument("--saida")
    x = s.add_parser("volume"); x.add_argument("arquivo"); x.add_argument("--passo", type=float, default=0.5)
    x = s.add_parser("recorte"); x.add_argument("video"); x.add_argument("--t", type=float, required=True)
    x.add_argument("--caixa", required=True); x.add_argument("--zoom", type=float, default=2); x.add_argument("--saida")
    x = s.add_parser("vaos"); x.add_argument("imagem"); x.add_argument("--y0", type=int, required=True); x.add_argument("--y1", type=int, required=True)
    x.add_argument("--x0", type=int, default=55); x.add_argument("--x1", type=int, default=200)
    x.add_argument("--largura", type=int, default=384); x.add_argument("--altura", type=int, default=832)
    x.add_argument("--limiar", type=int, default=150); x.add_argument("--min", type=float, default=1.5)
    x = s.add_parser("pixel"); x.add_argument("pasta"); x.add_argument("--de", type=int, required=True); x.add_argument("--ate", type=int, required=True)
    x.add_argument("--x", type=int, required=True); x.add_argument("--y", type=int, required=True)
    x.add_argument("--largura", type=int, default=384); x.add_argument("--altura", type=int, default=832); x.add_argument("--fps", type=float, default=30)
    x = s.add_parser("grade"); x.add_argument("imagem"); x.add_argument("--largura", type=int, default=384)
    x.add_argument("--altura", type=int, default=832); x.add_argument("--saida")
    x = s.add_parser("cor"); x.add_argument("imagem"); x.add_argument("--rgb", required=True); x.add_argument("--tol", type=int, default=90)
    x = s.add_parser("juntar"); x.add_argument("imagens", nargs="+"); x.add_argument("--largura", type=int, default=300)
    x.add_argument("--saida", required=True)
    a = p.parse_args()
    {"specs": cmd_specs, "folha": cmd_folha, "volume": cmd_volume, "recorte": cmd_recorte, "vaos": cmd_vaos,
     "pixel": cmd_pixel, "grade": cmd_grade, "cor": cmd_cor, "juntar": cmd_juntar}[a.cmd](a)


if __name__ == "__main__":
    main()
