# Readster-Auswertung bei Cloudflare einrichten

Dauert etwa 10 Minuten, kostenlos.

1. Auf **dash.cloudflare.com** ein kostenloses Konto anlegen und anmelden.
2. Links **Compute (Workers)** → **Workers & Pages** → **Erstellen** → **Worker** → „Hello World“ wählen.
3. Als Namen `readster-whisper` eintragen und **Bereitstellen** (Deploy) tippen.
4. **Code bearbeiten** öffnen, den ganzen Inhalt löschen, den Inhalt von `worker.js` einfügen und **Bereitstellen** tippen.
5. Im Worker auf **Einstellungen** → **Bindungen** (Bindings) → **Bindung hinzufügen** → **Workers AI**. Als Variablenname `AI` eintragen und speichern.
6. Oben steht die Adresse des Workers, etwa `https://readster-whisper.DEINNAME.workers.dev`. Diese Adresse an Claude schicken.

Kosten: Im kostenlosen Tarif sind täglich etwa 10.000 „Neuronen“ frei. Eine Minute Lesen braucht nur einen kleinen Teil davon. Ist das Tageskontingent aufgebraucht, fällt Readster für den Tag auf die Pausenmessung zurück. Es entstehen keine Kosten, solange kein bezahlter Tarif gebucht ist.

## Fortschritt pro Code speichern (Anmeldung mit Code)

Damit sich Testpersonen mit einem Code anmelden können, braucht der Worker einen kleinen Speicher (Workers KV). Einmalig, etwa 5 Minuten:

1. Im Cloudflare-Dashboard links **Storage & Databases** → **Workers KV** → **Create instance**. Name: `readster-fortschritt`, speichern.
2. Den Worker `readster-whisper` öffnen → **Code bearbeiten**, den ganzen Inhalt durch die neue `worker.js` ersetzen und **Bereitstellen** tippen.
3. Im Worker **Einstellungen** → **Bindungen** → **Bindung hinzufügen** → **KV-Namespace**. Variablenname `FORTSCHRITT`, Namespace `readster-fortschritt` wählen, speichern.
4. Prüfen: Die Adresse des Workers im Browser öffnen. Dort muss `"fortschritt":true` stehen.

Codes verteilen: Einfach einen Code ausdenken (Buchstaben, Zahlen und Bindestrich, mindestens 4 Zeichen, z. B. `MOND-4821`) und der Testperson diesen Link schicken: `https://asimplemanslab.com/readster/?code=MOND-4821`. Beim ersten Öffnen fragt Readster, ob der Code neu angelegt werden soll. Man kann den Code auch in der App unter „Mit Code anmelden“ eintippen.

Nur bestimmte Codes erlauben (optional): Im Worker unter **Einstellungen** → **Variablen** eine Variable `CODES` anlegen, z. B. `MOND-4821, TIGER-1234`. Dann funktionieren nur diese Codes. Ohne die Variable ist jeder Code erlaubt. Wer einen Code kennt, sieht dessen Fortschritt, darum Codes nicht zu einfach wählen.

Gespeichert werden nur Fortschritt und Einstellungen (Level, gelesene Texte, Wörter, Tempo), keine Aufnahmen. Die Aufnahmen bleiben auf dem Gerät. Im kostenlosen Tarif sind 1.000 Speichervorgänge pro Tag frei, das reicht für viele Testpersonen.
