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

Readster lässt sich nur noch mit einem gültigen Code benutzen. Ohne Code sieht man nur den Anmeldebildschirm.

Codes vergeben:
1. Im Worker unter **Einstellungen** → **Variablen und Geheimnisse** eine Variable vom Typ Text anlegen: Name `CODES`, Wert z. B. `MOND-4821, TIGER-1234` (Buchstaben, Zahlen, Bindestrich, mindestens 4 Zeichen). **Bereitstellen** tippen.
2. Der Testperson den Link schicken: `https://asimplemanslab.com/readster/?code=MOND-4821`. Sie kann den Code auch selbst auf dem Anmeldebildschirm eintippen.
3. Neue Testperson: Code zur Liste hinzufügen. Code aus der Liste streichen: Die Person wird beim nächsten Öffnen mit Internet abgemeldet. Ihr Fortschritt bleibt gespeichert und ist wieder da, wenn der Code zurück in die Liste kommt.

Die Liste gilt auch für die Whisper-Auswertung: Ohne gültigen Code nimmt der Worker keine Aufnahmen an. Ohne Variable `CODES` ist jeder Code erlaubt, dann kann sich jeder mit einem ausgedachten Code anmelden.

Gespeichert werden nur Fortschritt und Einstellungen (Level, gelesene Texte, Wörter, Tempo), keine Aufnahmen. Die Aufnahmen bleiben auf dem Gerät. Im kostenlosen Tarif sind 1.000 Speichervorgänge pro Tag frei, das reicht für viele Testpersonen.

## Feedback sammeln

In Readster gibt es oben auf der Startseite einen Feedback-Knopf (Sprechblase) und unter Lesehilfen → Für Erwachsene → Hilfe den Link „Feedback an Mark senden“. Testpersonen tippen dort ein Gesicht an, sprechen eine Sprachnachricht auf (bis 2 Minuten) und/oder schreiben etwas. Das Feedback landet mit Code, Uhrzeit und Gerät im selben Speicher wie der Fortschritt (`readster-fortschritt`).

Einmalig einrichten, etwa 3 Minuten:

1. Den Worker `readster-whisper` öffnen → **Code bearbeiten**, den ganzen Inhalt durch die neue `worker.js` ersetzen und **Bereitstellen** tippen.
2. Im Worker **Einstellungen** → **Variablen und Geheimnisse** → **Hinzufügen**. Typ **Geheimnis** (Secret), Name `FEEDBACK_SCHLUESSEL`, als Wert ein langes, ausgedachtes Passwort. **Bereitstellen** tippen.
3. Feedback lesen: `https://readster-whisper.mark-broyer.workers.dev/feedback` öffnen und den Schlüssel eingeben. Am besten die Adresse mit `?k=SCHLÜSSEL` als Lesezeichen speichern. Neueste Nachrichten stehen oben, Sprachnachrichten lassen sich direkt abspielen, jedes Feedback kann einzeln gelöscht werden.

Ohne gültigen Code nimmt der Worker kein Feedback an. Ohne `FEEDBACK_SCHLUESSEL` lässt sich die Ansicht nicht öffnen.
