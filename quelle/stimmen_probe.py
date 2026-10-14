#!/usr/bin/env python3
"""
Hörprobe für eine neue Vorlese-Stimme.

Sucht in der ElevenLabs-Stimmenbibliothek deutsche Stimmen (muttersprachlich),
lässt jede denselben kurzen Probetext sprechen (Flash v2.5, Deutsch fest) und baut
die Seite stimmprobe/index.html zum Vergleichen. Läuft auf GitHub über den Ablauf
"Stimmen-Probe". Kosten: etwa 100 Credits pro Stimme.
"""
import json, os, sys, urllib.request, urllib.error, urllib.parse, html

KEY = os.environ.get("ELEVENLABS_API_KEY") or sys.exit("ELEVENLABS_API_KEY fehlt")
ANZAHL = int(os.environ.get("ANZAHL", "8"))
ZIEL = sys.argv[1] if len(sys.argv) > 1 else "../stimmprobe"
PROBE = ("Tippe auf Zuhören. Dann hörst du die Geschichte. "
         "Der Gecko läuft einfach an der Wand hoch. Wie macht er das nur? "
         "Super gelesen! Noch ein Text, dann fährst du ein Rennen!")

def hole(url, daten=None):
    req = urllib.request.Request(url, data=json.dumps(daten).encode() if daten else None,
                                 headers={"xi-api-key": KEY, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()

FREMD = ("american", "british", "us", "uk", "english", "turkish", "russian", "polish", "arabic", "french", "italian", "spanish", "indian", "swiss", "austrian")
ROH = []
def deutsch(v):
    """Muttersprachlich deutsch: Sprache de (oder Locale de-DE) und kein fremder Akzent."""
    sp = (v.get("language") or "").lower(); lo = (v.get("locale") or "").lower()
    if not (sp.startswith("de") or lo.startswith("de")):
        return False
    akz = (v.get("accent") or "").lower()
    return not any(f in akz for f in FREMD)

stimmen = {}
for uc in ("narrative_story", "informative_educational", "conversational", ""):
    q = {"language": "de", "page_size": "100", "sort": "usage_character_count_1y"}
    if uc:
        q["use_cases"] = uc
    try:
        r = json.loads(hole("https://api.elevenlabs.io/v1/shared-voices?" + urllib.parse.urlencode(q)))
    except urllib.error.HTTPError as e:
        msg = e.read()[:300].decode("utf-8", "replace"); print("Suche fehlgeschlagen:", uc, e.code, msg)
        ROH.append({"fehler": e.code, "suche": uc, "text": msg}); continue
    ROH.extend({k: v.get(k) for k in ("name", "voice_id", "language", "locale", "accent", "gender", "age", "use_case", "usage_character_count_1y", "free_users_allowed")} for v in r.get("voices", [])[:15])
    print("Suche", uc or "alle", "->", len(r.get("voices", [])), "Stimmen")
    for v in r.get("voices", []):
        if deutsch(v) and v["voice_id"] not in stimmen:
            v["_uc"] = uc; stimmen[v["voice_id"]] = v
print(len(stimmen), "deutsche Stimmen gefunden")
for v in list(stimmen.values())[:40]:
    print(f"{v['name'][:30]:<30} {v['voice_id']} {v.get('gender')} {v.get('age')} {v.get('accent')} {v.get('use_case')} genutzt={v.get('usage_character_count_1y')} frei={v.get('free_users_allowed')}")

# je zur Hälfte Frauen und Männer, die meistgenutzten zuerst
nach = sorted(stimmen.values(), key=lambda v: -(v.get("usage_character_count_1y") or 0))
fr = [v for v in nach if v.get("gender") == "female"][:ANZAHL // 2]
ma = [v for v in nach if v.get("gender") == "male"][:ANZAHL - len(fr)]
auswahl = fr + ma

os.makedirs(ZIEL, exist_ok=True)
json.dump({"gefunden": len(stimmen), "auswahl": [v["name"] for v in auswahl], "roh": ROH}, open(os.path.join(ZIEL, "suche.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
karten = []
for v in auswahl:
    vid = v["voice_id"]; datei = f"{vid}.mp3"; ok = False; hinweis = ""
    try:
        mp3 = hole(f"https://api.elevenlabs.io/v1/text-to-speech/{vid}?output_format=mp3_44100_64",
                   {"text": PROBE, "model_id": "eleven_flash_v2_5", "language_code": "de",
                    "voice_settings": {"stability": 0.55, "similarity_boost": 0.75, "style": 0.0, "use_speaker_boost": True, "speed": 0.95}})
        open(os.path.join(ZIEL, datei), "wb").write(mp3); ok = True
    except urllib.error.HTTPError as e:
        hinweis = f"Probetext ging nicht ({e.code}), nur die Hörprobe von ElevenLabs."
        print("TTS fehlgeschlagen:", v["name"], e.code, e.read()[:300])
    print("Probe:", v["name"], vid, "ok" if ok else "nein")
    esc = lambda s: html.escape(str(s or ""))
    karten.append(f"""<section><h2>{esc(v['name'])}</h2>
<p class="m">{esc({'female':'Frau','male':'Mann'}.get(v.get('gender'), v.get('gender')))} · {esc(v.get('age'))} · {esc(v.get('accent') or 'Deutsch')}</p>
<p>{esc((v.get('description') or '')[:220])}</p>
{f'<p class="l">Unser Probetext</p><audio controls preload="none" src="{datei}"></audio>' if ok else f'<p class="m">{esc(hinweis)}</p>'}
{f'<p class="l">Hörprobe von ElevenLabs</p><audio controls preload="none" src="{esc(v.get("preview_url"))}"></audio>' if v.get('preview_url') else ''}
<p class="id">ID: <code>{esc(vid)}</code></p></section>""")

open(os.path.join(ZIEL, "index.html"), "w", encoding="utf-8").write(f"""<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Stimmen-Probe</title>
<style>body{{margin:0;background:#07202b;color:#eaf6f7;font:17px/1.45 system-ui,sans-serif;padding:16px}}
main{{max-width:640px;margin:auto}}h1{{font-size:1.5rem}}section{{background:#0f3342;border-radius:16px;padding:14px 16px;margin:14px 0}}
h2{{margin:0 0 4px;font-size:1.2rem}}.m{{color:#9cc3c9;margin:0 0 6px}}.l{{margin:10px 0 4px;font-weight:600}}audio{{width:100%}}
.id{{font-size:.85rem;color:#9cc3c9}}code{{user-select:all}}</style></head><body><main>
<h1>Welche Stimme soll vorlesen?</h1><p>Jede Stimme spricht denselben Probetext. Schreib mir einfach den Namen deiner Wahl.</p>
<p class="m">Probetext: {html.escape(PROBE)}</p>
{''.join(karten)}</main></body></html>""")
print("Seite:", os.path.join(ZIEL, "index.html"))
