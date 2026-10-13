import re,pyphen
dic=pyphen.Pyphen(lang='de_DE',left=1,right=1)
V=re.compile(r"[aeiouyäöüAEIOUYÄÖÜ]")
ONS={"pl","pr","bl","br","tr","dr","fl","fr","gl","gr","kl","kr","kn","schl","schr","schm","schn","schw","sch","spr","spl","str","st","sp","sk","skl","ch","qu","tw","zw","ph","th","gn","pf"}
OVR={"Aale":"Aa·le","Aalen":"Aa·len","Energie":"E·ner·gie","ersten":"ers·ten","erster":"ers·ter","kleinste":"kleins·te","schnellste":"schnells·te","schnellsten":"schnells·ten","längste":"längs·te","halbes":"hal·bes","kurze":"kur·ze","hinaus":"hi·naus","hineinpassen":"hi·nein·pas·sen","Verrückteres":"Ver·rück·te·res","halbem":"hal·bem","kopfüber":"kopf·über","Puerto":"Puer·to","Aquarium":"A·qua·ri·um","Orville":"Or·ville","Wright":"Wright","Basketballkorb":"Bas·ket·ball·korb","Nicolas":"Ni·co·las","Gizeh":"Gi·zeh"}
def onset(s):
    m=re.match(r"^([^aeiouyäöüAEIOUYÄÖÜ]*)",s); return m.group(1).lower()
def fix(sy):
    changed=True
    while changed and len(sy)>1:
        changed=False
        for i,s in enumerate(sy):
            if not V.search(s):
                if i==0: sy[1]=s+sy[1]
                elif i==len(sy)-1: sy[i-1]+=s
                else:
                    n=onset(sy[i+1])
                    if n and (s+n).lower() in ONS or (n and (s.lower()+n[:1]) in ONS): sy[i+1]=s+sy[i+1]
                    else: sy[i-1]+=s
                del sy[i]; changed=True; break
    return sy
def syl(core):
    if core in OVR: return OVR[core]
    if not re.search(r"[A-Za-zÄÖÜäöüß]",core) or re.search(r"\d",core): return core
    out=[]
    for p in core.split("-"):
        if len(p)<=2: out.append(p); continue
        out.append("·".join(fix(dic.inserted(p,hyphen="·").split("·"))))
    return "-".join(out)
def conv(text):
    res=[]
    for tk in text.split(" "):
        m=re.match(r"^([^A-Za-zÄÖÜäöüß0-9]*)(.*?)([^A-Za-zÄÖÜäöüß0-9]*)$",tk)
        pre,core,post=m.groups(); res.append(pre+syl(core)+post)
    return " ".join(res)
