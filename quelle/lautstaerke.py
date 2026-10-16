#!/usr/bin/env python3
"""Gleicht die Lautstärke der Sprach-Hinweise an (audio/hinweis-*.mp3).

ElevenLabs liefert die Hinweise unterschiedlich laut (gemessen 16.10.: -21,5 bis -29,5 LUFS).
Jede Datei wird auf ZIEL LUFS gebracht; Dateien, die schon passen, bleiben unverändert,
damit erneute Läufe nichts ändern. Braucht ffmpeg.

Aufruf: python3 lautstaerke.py [AUDIO_DIR]
"""
import glob, os, re, subprocess, sys

ZIEL = -24.0      # LUFS, etwas lauter als die Lesetexte (ca. -27), damit Hinweise gut zu hören sind
SPIEL = 0.7       # so viel Abweichung ist in Ordnung


def messen(pfad):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", pfad, "-af", "ebur128", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    werte = re.findall(r"I:\s+(-?[\d.]+) LUFS", out)
    return float(werte[-1]) if werte else None


def main():
    ordner = sys.argv[1] if len(sys.argv) > 1 else "../audio"
    for pfad in sorted(glob.glob(os.path.join(ordner, "hinweis-*.mp3"))):
        i = messen(pfad)
        if i is None or abs(i - ZIEL) <= SPIEL:
            continue
        neu = pfad + ".tmp.mp3"
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", pfad,
                        "-af", f"volume={ZIEL - i:.2f}dB,alimiter=limit=0.95:level=disabled",
                        "-ar", "22050", "-ac", "1", "-b:a", "48k", neu], check=True)
        os.replace(neu, pfad)
        print(f"{os.path.basename(pfad)}: {i:.1f} -> {messen(pfad):.1f} LUFS")


if __name__ == "__main__":
    main()
