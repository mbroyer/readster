import json,sys
import os
AUD_DIR=os.environ.get("AUDIO_DIR","tts/out")
AUD_MODE=os.environ.get("AUDIO_MODE","eingebettet")  # "dateien": MP3s nur verlinken (GitHub-Seite)
sys.path.insert(0,".")
import syl2
# Aufruf im Projektordner: python3 build.py  (Audio: AUDIO_DIR=aufnahmen python3 build.py)
# GitHub-Seite: AUDIO_DIR=../audio AUDIO_MODE=dateien OUT=../index.html python3 build.py
SRC=os.environ.get("TEXTE","lesetexte_stufe1.json")
OUT=os.environ.get("OUT","lesemonster.html")
d=json.load(open(SRC,encoding="utf-8"))
NAME={"tier-01":"Gecko","tier-02":"Chamäleon","tier-03":"Krake","tier-04":"Delfin","tier-05":"Igel","tier-06":"Gepard","tier-07":"Wanderfalke","tier-08":"Blauwal","weltall-01":"Sonne","weltall-02":"Mond","weltall-03":"Saturn","technik-01":"Rakete","technik-02":"Flugzeug","technik-03":"Kompass","koerper-01":"Herz","koerper-02":"Gänsehaut","koerper-03":"Knochen","sport-01":"Schnellster Mensch","sport-02":"Basketballkorb","sport-03":"Längstes Match","raetsel-01":"Bermuda-Dreieck","raetsel-02":"Nessie","raetsel-03":"Pyramiden","raetsel-04":"Atlantis"}
CARD={"tier-01":"Millionen winziger Härchen an den Zehen halten ihn fest.","tier-02":"Mit der Farbe zeigt es vor allem seine Laune.","tier-03":"Der Krake hat drei Herzen und blaues Blut.","tier-04":"Er schläft mit nur einer Hälfte vom Gehirn.","tier-05":"Im Winterschlaf schlägt sein Herz nur noch etwa fünf Mal pro Minute.","tier-06":"Etwa 100 km/h schnell, aber nur ganz kurz.","tier-07":"Im Sturzflug schneller als 300 km/h.","tier-08":"Bis zu 30 Meter lang und er frisst winzigen Krill.","weltall-01":"Über eine Million Erden passen hinein.","weltall-02":"Die Fußspuren der ersten Menschen sind noch da.","weltall-03":"Seine Ringe bestehen aus Milliarden Eisbrocken.","technik-01":"Eine Rakete fliegt mit Rückstoß, wie ein Luftballon.","technik-02":"Der erste Flug dauerte nur zwölf Sekunden.","technik-03":"Die Erde ist wie ein riesiger Magnet.","koerper-01":"Dein Herz schlägt über 100.000 Mal am Tag.","koerper-02":"Winzige Muskeln stellen die Haare auf.","koerper-03":"206 Knochen, der kleinste sitzt im Ohr.","sport-01":"100 Meter in 9,58 Sekunden.","sport-02":"Der Korb hängt 3,05 Meter hoch.","sport-03":"Über elf Stunden, verteilt auf drei Tage.","raetsel-01":"Dort verschwinden nicht mehr Schiffe als anderswo.","raetsel-02":"Im See fand man Erbgut von Aalen, aber kein Monster.","raetsel-03":"Mehr als zwei Millionen Steinblöcke.","raetsel-04":"Platon erzählte von der versunkenen Insel."}
out=[]
for x in d["texte"]:
    out.append({"id":x["id"],"cat":x["kategorie"],"title":x["titel"],"name":NAME[x["id"]],"syl":syl2.conv(x["text"]),
                "q":[{"q":f["frage"],"a":f["antwort"],"f":f.get("falsch",[])} for f in x["fragen"]],"next":x["folge_id"],"card":CARD[x["id"]],"r":x["raetsel"]})
assert len(out)==24 and all(o["next"] in {z["id"] for z in out} for o in out)
data=json.dumps(out,ensure_ascii=False).replace("</","<\\/")
t=open("template.html",encoding="utf-8").read()
t=t.replace("__MON_JS__",open("monsters.js",encoding="utf-8").read().replace("if(typeof module!=='undefined')module.exports=MON;",""))
t=t.replace("__MADEBY__",open("parts/madeby.txt").read().strip())
t=t.replace("__LOGO__",open("parts/logo.txt").read().strip() if os.path.exists("parts/logo.txt") else "")
WHS=os.environ.get("WH_SERVER") or (open("parts/whserver.txt").read().strip() if os.path.exists("parts/whserver.txt") else "")
t=t.replace("__WHSERVER__",WHS)
t=t.replace("__ICON__",open("parts/icon.txt").read().strip() if os.path.exists("parts/icon.txt") else "data:,")
import base64,hashlib
AUD={};TIM={}
raet={x["id"]:x for x in d["texte"]}
for o in out:
    AUD[o["id"]]={};TIM[o["id"]]={}
    x=raet[o["id"]];nr=len(x["raetsel"].split());nw=len(o["syl"].split(" "));assert x["text"].endswith(x["raetsel"]),o["id"]
    for sp in "ns":
        fa=f"{AUD_DIR}/{o['id']}-{sp}-a";fb=f"{AUD_DIR}/{o['id']}-{sp}-b"
        if not os.path.exists(fa+".json"): continue
        # Teil b (Rätsel) wird seit 14.10. nicht mehr vertont; alte Dateien werden noch mitgenommen
        hb=os.path.exists(fb+".json") and os.path.exists(fb+".mp3")
        ta=json.load(open(fa+".json"));tb=json.load(open(fb+".json")) if hb else None
        if not (len(ta)==nw-nr and (tb is None or len(tb)==nr)):
            print("WARNUNG: Aufnahme passt nicht mehr zum Text, wird weggelassen:",o["id"],sp);continue
        if AUD_MODE=="dateien":
            # Aufnahmen bleiben einzelne Dateien neben der Seite; die App lädt nur, was gerade gebraucht wird.
            # Der Anhang ?v= ändert sich mit dem Inhalt, damit Browser keine alte Fassung aus dem Zwischenspeicher nehmen.
            rel=os.path.relpath(AUD_DIR,os.path.dirname(os.path.abspath(OUT)))
            AUD[o["id"]][sp]={k:f"{rel}/{o['id']}-{sp}-{k}.mp3?v="+hashlib.sha1(open(f+".mp3","rb").read()).hexdigest()[:8] for k,f in (("a",fa),("b",fb)) if k=="a" or hb}
        else:
            AUD[o["id"]][sp]={k:base64.b64encode(open(f+".mp3","rb").read()).decode() for k,f in (("a",fa),("b",fb)) if k=="a" or hb}
        TIM[o["id"]][sp]={"a":ta,"b":tb} if hb else {"a":ta}
# Sprach-Hinweise der Bedienung: Text immer (für die Gerätestimme als Ersatz), MP3 wenn vorhanden
HIN={}
if os.path.exists("hinweise.json"):
    for hid,satz in json.load(open("hinweise.json",encoding="utf-8"))["hinweise"].items():
        e={"t":satz};f=f"{AUD_DIR}/hinweis-{hid}.mp3"
        if os.path.exists(f):
            if AUD_MODE=="dateien":
                rel=os.path.relpath(AUD_DIR,os.path.dirname(os.path.abspath(OUT)))
                e["u"]=f"{rel}/hinweis-{hid}.mp3?v="+hashlib.sha1(open(f,"rb").read()).hexdigest()[:8]
            else:
                e["u"]="data:audio/mpeg;base64,"+base64.b64encode(open(f,"rb").read()).decode()
        HIN[hid]=e
t=t.replace("__HINTS__",json.dumps(HIN,separators=(",",":"),ensure_ascii=False))
t=t.replace("__DATA__",data).replace("__TIMES__",json.dumps(TIM,separators=(",",":"))).replace("__AUDIO__",json.dumps(AUD,separators=(",",":")))
n_aud=sum(len(v) for v in AUD.values())
open(OUT,"w",encoding="utf-8").write(t)
mb=len(t.encode("utf-8"))/1024/1024
print("gebaut:",OUT,f"{mb:.1f} MB,",n_aud,"Texte mit Aufnahme (Tempo-Varianten einzeln gezählt)")
if mb>15: print("ACHTUNG: über 15 MB. Artifacts dürfen höchstens 16 MB groß sein. Nur ein Tempo einbetten (--tempi n), Langsam macht die App selbst.")
