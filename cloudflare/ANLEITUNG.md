# Readster-Auswertung bei Cloudflare einrichten

Dauert etwa 10 Minuten, kostenlos.

1. Auf **dash.cloudflare.com** ein kostenloses Konto anlegen und anmelden.
2. Links **Compute (Workers)** → **Workers & Pages** → **Erstellen** → **Worker** → „Hello World“ wählen.
3. Als Namen `readster-whisper` eintragen und **Bereitstellen** (Deploy) tippen.
4. **Code bearbeiten** öffnen, den ganzen Inhalt löschen, den Inhalt von `worker.js` einfügen und **Bereitstellen** tippen.
5. Im Worker auf **Einstellungen** → **Bindungen** (Bindings) → **Bindung hinzufügen** → **Workers AI**. Als Variablenname `AI` eintragen und speichern.
6. Oben steht die Adresse des Workers, etwa `https://readster-whisper.DEINNAME.workers.dev`. Diese Adresse an Claude schicken.

Kosten: Im kostenlosen Tarif sind täglich etwa 10.000 „Neuronen“ frei. Eine Minute Lesen braucht nur einen kleinen Teil davon. Ist das Tageskontingent aufgebraucht, fällt Readster für den Tag auf die Pausenmessung zurück. Es entstehen keine Kosten, solange kein bezahlter Tarif gebucht ist.
