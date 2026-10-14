# Readster

Leseübungs-App (eine HTML-Datei). Läuft über GitHub Pages: https://mbroyer.github.io/readster/

Readster ist nur mit einem Code nutzbar (Liste `CODES` beim Cloudflare-Worker, siehe `cloudflare/ANLEITUNG.md`). Der Fortschritt wird pro Code beim Worker gespeichert, Aufnahmen bleiben auf dem Gerät.

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


## Rennen

Statt Monster-Stufen sammelt das Kind Autos aus dem Drag Racer Strip 402. Das Spiel liegt im Readster-Modus unter `rennen/strip402.html` (`?readster`), die Bilder unter `rennen/autos/`. Die Stufen (ab welchem Level welches Auto, welche Hilfen) stehen in `RSTAGES` in `quelle/template.html`. Neue Spielversion: Datei nach `rennen/strip402.html` kopieren. Neues Auto: eine Zeile in `RSTAGES` und ein Bild (480×320 PNG).
