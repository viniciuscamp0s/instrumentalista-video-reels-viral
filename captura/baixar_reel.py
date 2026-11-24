#!/usr/bin/env python3
"""Baixa um Reel/post de VIDEO publico do Instagram a partir do link, le legenda/autor/musica
e transcreve a fala localmente (sem API paga). So conteudo publico; sem login.
Requisitos: yt-dlp e ffmpeg/ffprobe no PATH; transcricao: pip install faster-whisper numpy
Uso: python baixar_reel.py "https://www.instagram.com/reel/CODIGO/" saida/ [--sem-transcricao]"""
import json, re, shutil, subprocess, sys, urllib.parse, wave
from pathlib import Path


def normalizar(url):
    """Reconstroi a URL a partir do codigo: nada que o usuario colou vai cru para a linha de comando."""
    u = urllib.parse.urlparse(url.strip().rstrip(").,;!?]*_"))
    if u.scheme not in ("http", "https") or (u.hostname or "").lower() not in (
            "instagram.com", "www.instagram.com", "m.instagram.com"):
        raise ValueError("so links do Instagram")
    partes = [p for p in u.path.split("/") if p]
    for i, p in enumerate(partes[:-1]):
        if p in ("reel", "reels", "p", "tv") and re.fullmatch(r"[\w-]{5,40}", partes[i + 1]):
            return f"https://www.instagram.com/{'p' if p == 'p' else 'reel'}/{partes[i + 1]}/"
    raise ValueError("nao e link de reel/post")


def baixar(url, pasta):
    video = pasta / "video.mp4"
    if not video.exists():
        p = subprocess.run(
            ["yt-dlp", "--no-warnings", "--no-playlist", "-q", "-f", "mp4/bv*+ba/b",
             "--merge-output-format", "mp4", "--write-info-json",
             "-o", str(pasta / "video.%(ext)s"), "--", url],
            capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=600)
        if p.returncode != 0 or not video.exists():
            raise RuntimeError("yt-dlp falhou: " + (p.stderr or "").strip()[-200:])
    info = json.loads((pasta / "video.info.json").read_text(encoding="utf-8"))
    return {"autor": info.get("uploader_id") or info.get("channel") or info.get("uploader"),
            "legenda": info.get("description") or "",
            "musica": " - ".join(x for x in (info.get("track"), info.get("artist")) if x) or None}


def transcrever(video, pasta, modelo="small"):
    audio = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries",
                            "stream=index", "-of", "csv=p=0", str(video)],
                           capture_output=True, text=True).stdout.strip()
    if not audio:
        return []  # reel sem audio
    wav = pasta / "audio.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(video), "-vn", "-ac", "1", "-ar", "16000",
                    str(wav)], check=True)           # whisper quer mono, 16 kHz
    import numpy as np
    from faster_whisper import WhisperModel
    with wave.open(str(wav), "rb") as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
    segs, _ = WhisperModel(modelo, device="cpu", compute_type="int8").transcribe(
        x, language="pt", vad_filter=True, beam_size=1)
    wav.unlink(missing_ok=True)
    return [{"ini": round(s.start, 2), "fim": round(s.end, 2), "texto": s.text.strip()} for s in segs]


def folha_de_quadros(video, pasta, max_quadros=60):
    """1 quadro por segundo, 10 por linha, para o modelo (ou voce) ler o estilo do video."""
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of",
                                "csv=p=0", str(video)], capture_output=True, text=True).stdout or 0)
    fps = 1.0 if dur <= max_quadros else max_quadros / dur
    n = min(max_quadros, max(1, int(dur * fps + 0.999)))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(video), "-vf",
                    f"fps={fps:.4f},scale=144:256:force_original_aspect_ratio=decrease,"
                    f"pad=144:256:(ow-iw)/2:(oh-ih)/2,tile=10x{(n + 9) // 10}:padding=2",
                    "-frames:v", "1", "-q:v", "5", str(pasta / "folha.jpg")], check=True)
    return round(dur, 1)


if __name__ == "__main__":
    if len(sys.argv) < 3 or not shutil.which("yt-dlp"):
        sys.exit(__doc__)
    pasta = Path(sys.argv[2])
    pasta.mkdir(parents=True, exist_ok=True)
    meta = baixar(normalizar(sys.argv[1]), pasta)
    if "--sem-transcricao" not in sys.argv:
        meta["transcricao"] = transcrever(pasta / "video.mp4", pasta)
    meta["duracao_s"] = folha_de_quadros(pasta / "video.mp4", pasta)
    (pasta / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"ok: {pasta}/video.mp4 + meta.json + folha.jpg")
