#!/usr/bin/env python3
"""
Erzeugt die Vorlese-Aufnahmen fuer Readster mit ElevenLabs.

Normalerweise laeuft das Skript auf GitHub (Ablauf "Vorlesen erzeugen", siehe README).
Der Schluessel liegt dort als Secret ELEVENLABS_API_KEY.

Von Hand (Terminal, Python 3 reicht, keine Zusatzpakete):

    export ELEVENLABS_API_KEY="dein_schluessel"
    python3 vorlesen_elevenlabs.py --ordner ../audio

Es werden nur Aufnahmen erzeugt, deren Text sich geaendert hat oder die fehlen.

Optionen:
    --nur tier-02            nur einen Text erzeugen (zum Ausprobieren, kostet wenig)
    --tempi n,s              auch eine eigene langsame Fassung erzeugen; Standard: n (Langsam spielt die App mit 80 %)
    --ordner audio           Zielordner (Standard: aufnahmen)
    --voice ID               andere Stimme (Standard: Marks deutsche Stimme)
    --speed-n 0.95           Tempo "Normal"  (ElevenLabs erlaubt 0.7 bis 1.2)
    --speed-s 0.78           Tempo "Langsam"
    --model eleven_multilingual_v2   schönere Stimme, kostet doppelt so viel wie der Standard eleven_flash_v2_5

Ergebnis im Ordner "aufnahmen": pro Text und Tempo eine MP3 und eine JSON-Datei
mit den Wort-Zeiten in Millisekunden (z. B. tier-01-n-a.mp3 fuer die Geschichte und tier-01-n-b.mp3 fuer das Raetsel, dazu je eine .json).

Den Schluessel nie in den Chat schreiben.
Alte Aufnahmen von Texten, die es nicht mehr gibt, werden entfernt.
Die Sprach-Hinweise der Bedienung (hinweise.json) werden mit erzeugt: audio/hinweis-<id>.mp3. Nur Hinweise: --nur hinweise
Kosten fuer alle 24 Texte: etwa 6.300 Credits mit Flash v2.5, etwa 12.500 mit Multilingual v2; danach nur noch die geaenderten.
"""
import argparse, base64, hashlib, json, os, re, sys, time, urllib.request, urllib.error

STIMME = "3EKymYQPdS1Q9fxZBuq8"  # deutsche Stimme, von Mark gewählt 14.10. (vorher Matilda XrExE9yKIg1WjnnlVkGX, klang amerikanisch)

# ---------- Aussprache-Hilfen: nur fuer die Audio-Eingabe, angezeigt wird der Originaltext ----------
ZAHLEN = {
    "100.000": "hunderttausend", "28.000": "achtundzwanzigtausend", "384.000": "dreihundertvierundachtzigtausend",
    "80": "achtzig", "206": "zweihundertsechs", "300": "dreihundert", "1933": "neunzehnhundertdreiunddreißig",
    "2018": "zweitausendachtzehn", "4500": "viertausendfünfhundert", "2300": "zweitausenddreihundert",
    "100": "hundert", "2009": "zweitausendneun", "40": "vierzig", "41": "einundvierzig", "9,58": "neun Komma fünf acht",
    "24": "vierundzwanzig", "3,05": "drei Komma null fünf", "45": "fünfundvierzig", "2010": "zweitausendzehn",
    "6": "sechs", "68": "achtundsechzig", "7": "sieben", "70": "siebzig", "1903": "neunzehnhundertdrei",
    "37": "siebenunddreißig", "20": "zwanzig", "30": "dreißig", "15": "fünfzehn", "150": "hundertfünfzig",
    "160": "hundertsechzig", "200": "zweihundert",
}
NAMEN = {"Usain": "Jusein", "Wilbur": "Wilbör", "Orville": "Orwill", "Wright": "Reit", "Mahut": "Mahü",
         "Nicolas": "Nikola", "Gizeh": "Gisa", "Jumbo-Jet": "Dschumbo-Dschett", "John": "Dschon",
         "Isner": "Eisner", "Wimbledon": "Wimbeldon", "Dunking": "Danking"}

def gesprochen(wort):
    m = re.match(r"^([^\wÄÖÜäöüß]*)(.*?)([^\wÄÖÜäöüß]*)$", wort)
    vor, kern, nach = m.groups()
    kern = ZAHLEN.get(kern, NAMEN.get(kern, kern))
    return vor + kern + nach

def text_mit_offsets(text):
    """Baut den Sprechtext eines Teils (Geschichte oder Raetsel) und merkt sich die Position jedes Wortes."""
    out, spans, pos = "", [], 0
    for wi, w in enumerate(text.split()):
        if wi > 0:
            out += " "; pos += 1
        g = gesprochen(w)
        spans.append((g, pos)); out += g; pos += len(g)
    return out, spans

def teile(x):
    """Nur die Geschichte (Teil a). Das Raetsel am Ende zeigt die App nicht mehr an und wird nicht vertont."""
    r = x["raetsel"].strip()
    assert x["text"].strip().endswith(r), x["id"]
    return [("a", x["text"].strip()[: -len(r)].strip())]

def wortzeiten(spans, zeichen, starts, ends):
    """Ordnet jedem Wort den Zeitraum zu: von seinem Beginn bis zum Beginn des naechsten Wortes."""
    joined = "".join(zeichen)
    p, st = 0, []
    for g, _ in spans:
        i = joined.find(g, p)
        if i < 0:
            i = p
        st.append(starts[min(i, len(starts) - 1)]); p = i + len(g)
    gesamt = ends[-1]
    erg = []
    for k, s in enumerate(st):
        e = st[k + 1] if k + 1 < len(st) else gesamt
        erg.append([round(s * 1000), round(e * 1000)])
    return erg

class GuthabenLeer(Exception):
    pass

def anfrage(key, voice, model, text, speed):
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_22050_32"
    daten = {
        "text": text, "model_id": model,
        "voice_settings": {"stability": 0.55, "similarity_boost": 0.75, "style": 0.0, "use_speaker_boost": True, "speed": speed},
    }
    if "multilingual" not in model:
        daten["language_code"] = "de"  # laut ElevenLabs nicht für multilingual_v2
    body = json.dumps(daten).encode()
    req = urllib.request.Request(url, data=body, headers={"xi-api-key": key, "Content-Type": "application/json"})
    for versuch in range(3):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", "replace")[:300]
            if e.code in (429, 500, 502, 503) and versuch < 2 and "quota" not in msg:
                time.sleep(5 * (versuch + 1)); continue
            if e.code in (401, 402, 429) and ("quota" in msg or "credit" in msg or "limit" in msg):
                raise GuthabenLeer(msg)
            sys.exit(f"ElevenLabs-Fehler {e.code}: {msg}")

def selftest():
    t = "Der Gecko läuft an der Wand. Er wiegt 100 Gramm, sagt Usain Bolt. Warum fällt er nicht?"
    x = {"id": "t", "text": t, "raetsel": "Warum fällt er nicht?"}
    assert [k for k, _ in teile(x)] == ["a"] and not teile(x)[0][1].endswith("Warum fällt er nicht?")
    out, spans = text_mit_offsets(t)
    zeichen = list(out); starts = [i * 0.07 for i in range(len(zeichen))]; ends = [s + 0.07 for s in starts]
    z = wortzeiten(spans, zeichen, starts, ends)
    assert len(z) == len(t.split()), (len(z), len(t.split()))
    assert all(z[i][0] <= z[i + 1][0] for i in range(len(z) - 1))
    print("Selbsttest ok:", len(z), "Wörter"); print(out.replace("\n", "\\n"))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice"); ap.add_argument("--json", default="lesetexte_stufe1.json")
    ap.add_argument("--nur", nargs="*"); ap.add_argument("--tempi", default="n")
    ap.add_argument("--ordner", default="aufnahmen")
    ap.add_argument("--hinweise", default="hinweise.json", help="kurze Sprach-Hinweise der Bedienung (audio/hinweis-<id>.mp3)")
    ap.add_argument("--pruefen", action="store_true", help="vorhandene Aufnahmen ohne Fingerabdruck neu erzeugen")
    ap.add_argument("--speed-n", type=float, default=0.95); ap.add_argument("--speed-s", type=float, default=0.78)
    ap.add_argument("--model", default=os.environ.get("ELEVENLABS_MODEL") or "eleven_flash_v2_5"); ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--stimmen", action="store_true", help="listet die Stimmen deines Kontos mit ID auf")
    a = ap.parse_args()
    if a.selftest:
        return selftest()
    key = os.environ.get("ELEVENLABS_API_KEY")
    if a.stimmen:
        if not key:
            sys.exit("Bitte zuerst ELEVENLABS_API_KEY setzen.")
        req = urllib.request.Request("https://api.elevenlabs.io/v1/voices", headers={"xi-api-key": key})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                vs = json.load(r)["voices"]
        except urllib.error.HTTPError as e:
            sys.exit(f"ElevenLabs-Fehler {e.code}: {e.read().decode('utf-8', 'replace')[:300]}")
        for v in sorted(vs, key=lambda v: (v.get("category") != "premade", v["name"])):
            l = v.get("labels") or {}
            print(f"{v['name']:<22} {v['voice_id']}  {v.get('category','')}  {l.get('gender','')} {l.get('accent','')} {l.get('descriptive','')}")
        return
    if not a.voice:
        a.voice = os.environ.get("ELEVENLABS_VOICE") or STIMME
    daten = json.load(open(a.json, encoding="utf-8"))["texte"]
    os.makedirs(a.ordner, exist_ok=True)
    tempi = {"n": a.speed_n, "s": a.speed_s}
    stand_datei = os.path.join(a.ordner, "stand.json")
    stand = json.load(open(stand_datei)) if os.path.exists(stand_datei) else {}
    # Was gebraucht wird: pro Text, Teil und Tempo eine Aufnahme. Der Fingerabdruck merkt sich,
    # mit welchem Text und welcher Stimme sie gemacht wurde. Ändert sich etwas, wird sie neu erzeugt.
    auftraege = []
    for x in daten:
        if a.nur and x["id"] not in a.nur:
            continue
        for teil, inhalt in teile(x):
            text, spans = text_mit_offsets(inhalt)
            for t in a.tempi.split(","):
                name = f"{x['id']}-{t}-{teil}"
                fp = hashlib.sha1(json.dumps([text, a.voice, a.model, tempi[t]]).encode()).hexdigest()[:12]
                vorhanden = all(os.path.exists(os.path.join(a.ordner, name + e)) for e in (".mp3", ".json"))
                if vorhanden and (stand.get(name) == fp or (name not in stand and not a.pruefen)):
                    continue
                auftraege.append((name, fp, inhalt, text, spans, tempi[t]))
    # Sprach-Hinweise der Bedienung: je ein kurzer Satz, immer im Tempo "Normal"
    hinweise = json.load(open(a.hinweise, encoding="utf-8"))["hinweise"] if os.path.exists(a.hinweise) else {}
    for hid, satz in hinweise.items():
        if a.nur and "hinweise" not in a.nur:
            continue
        name = f"hinweis-{hid}"
        text, spans = text_mit_offsets(satz.strip())
        fp = hashlib.sha1(json.dumps([text, a.voice, a.model, tempi["n"]]).encode()).hexdigest()[:12]
        vorhanden = all(os.path.exists(os.path.join(a.ordner, name + e)) for e in (".mp3", ".json"))
        if vorhanden and (stand.get(name) == fp or (name not in stand and not a.pruefen)):
            continue
        auftraege.append((name, fp, satz.strip(), text, spans, tempi["n"]))
    gebraucht = {f"{x['id']}-{t}-{k}" for x in daten for k, _ in teile(x) for t in a.tempi.split(",")} | {f"hinweis-{hid}" for hid in hinweise}
    if not a.nur:
        for f in sorted(os.listdir(a.ordner)):
            stamm = f.rsplit(".", 1)[0]
            if f != "stand.json" and stamm not in gebraucht:
                os.remove(os.path.join(a.ordner, f)); stand.pop(stamm, None); print("entfernt (alt):", f)
    zeichen = sum(len(z[3]) for z in auftraege)
    credits = zeichen if "multilingual" in a.model else zeichen // 2
    print(f"Neu zu erzeugen: {len(auftraege)} Aufnahmen, {zeichen} Zeichen, etwa {credits} Credits ({a.model})")
    if auftraege and not key:
        sys.exit("Bitte ELEVENLABS_API_KEY setzen (siehe Kopf der Datei).")
    for nr, (name, fp, inhalt, text, spans, speed) in enumerate(auftraege):
        ziel = os.path.join(a.ordner, name)
        try:
            r = anfrage(key, a.voice, a.model, text, speed)
        except GuthabenLeer as e:
            # Was fertig ist, bleibt erhalten. Der Rest kommt beim nächsten Lauf (z. B. nach der Monatsgutschrift).
            print(f"::warning::ElevenLabs-Guthaben aufgebraucht. {len(auftraege) - nr} Aufnahmen fehlen noch und kommen beim nächsten Lauf. ({str(e)[:120]})")
            break
        al = r["alignment"]
        z = wortzeiten(spans, al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"])
        assert len(z) == len(inhalt.split()), (name, len(z))
        open(ziel + ".mp3", "wb").write(base64.b64decode(r["audio_base64"]))
        json.dump(z, open(ziel + ".json", "w"))
        stand[name] = fp
        json.dump(stand, open(stand_datei, "w"), indent=0, sort_keys=True)
        print("fertig:", name, f"{z[-1][1] / 1000:.1f} s")
    json.dump(stand, open(stand_datei, "w"), indent=0, sort_keys=True)
    print("Fertig.")

if __name__ == "__main__":
    main()
