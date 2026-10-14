# Readster

Leseübungs-App (eine HTML-Datei). Läuft über GitHub Pages: https://mbroyer.github.io/readster/

Aufnahmen und Fortschritt bleiben lokal auf dem Gerät.

## Aufbau

- `index.html`: die fertige App. Wird aus `quelle/` gebaut, nicht von Hand ändern.
- `quelle/`: Vorlage, Lesetexte (`lesetexte_stufe1.json`) und Skripte.
- `audio/`: Vorlese-Aufnahmen (MP3 plus Wortzeiten), erzeugt von ElevenLabs.
- `cloudflare/`: Whisper-Dienst für die genaue Auswertung.

## Vorlesen erzeugen

Der Ablauf „Vorlesen erzeugen“ (`.github/workflows/vorlesen.yml`) nimmt die Texte mit ElevenLabs auf und baut die Seite neu.
Er startet von selbst, wenn sich etwas in `quelle/` ändert, und per Hand unter Actions → Vorlesen erzeugen → Run workflow.
Neu aufgenommen werden nur Texte, die sich geändert haben.

Einmalig nötig: unter Settings → Secrets and variables → Actions ein Secret `ELEVENLABS_API_KEY` mit dem ElevenLabs-Schlüssel anlegen.

## Prototyp

`prototyp/` ist eine Testfassung für neue Ideen (gerade: zu Beginn „Allein“ oder „Mit Partner“ wählen): https://mbroyer.github.io/readster/prototyp/
Sie speichert ihren Fortschritt getrennt und berührt die echte App nicht. Bauen: `quelle/` in einen leeren Ordner kopieren, `prototyp/template.html` als `template.html` hineinlegen, dann `AUDIO_DIR=<repo>/audio AUDIO_MODE=dateien OUT=<repo>/prototyp/index.html python3 build.py`.
