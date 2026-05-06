# Sprint Poker ♠

Ein browserbasiertes Planning-Poker-Tool für agile Teams — im Stil eines Blackjack-Tisches.

🔗 **Live:** [bastianbinus.github.io/Sprint-Poker](https://bastianbinus.github.io/Sprint-Poker/)

---

## Was ist Sprint Poker?

Sprint Poker hilft Teams dabei, User Stories im Sprint Planning schnell und fair zu schätzen. Jede Person gibt ihre Schätzung verdeckt ab — erst wenn alle eingelockt haben, deckt der Host die Karten auf. Das verhindert Anker-Effekte und sorgt für ehrliche, unabhängige Einschätzungen.

---

## Features

- **Blackjack-Tisch-Design** — grüner Filztisch, Spielkarten pro Spieler, Fibonacci-Chips
- **Host erstellt eine Session** mit Story-Name und bekommt automatisch einen Einladungslink
- **Gäste joinen per Link** — kein Account, kein Login, einfach Name eingeben und losspielen
- **Fibonacci-Skala** — 1, 2, 3, 5, 8, 13, 21, 34, ?, ∞
- **Verdeckte Karten** — erst wenn alle abgestimmt haben, kann der Host aufdecken
- **Auswertungs-Box** nach dem Reveal:
  - Stimmen gruppiert nach Wert (inkl. Voter-Namen)
  - Durchschnitt & Median
  - Agreement-Bar (grün / orange / rot)
- **Neue Runde** — mit optionalem neuem Story-Namen, ohne die Session zu verlassen

---

## Nutzung

### Session starten (Host)

1. [Sprint Poker öffnen](https://bastianbinus.github.io/Sprint-Poker/)
2. Story-Namen und deinen Namen eingeben
3. **„Session erstellen"** klicken
4. Den generierten **Einladungslink** an dein Team schicken

### Beitreten (Teammitglied)

1. Einladungslink öffnen
2. Namen eingeben — fertig
3. Schätzung per Chip wählen und **einlocken**

### Ablauf

| Schritt | Wer | Aktion |
|--------|-----|--------|
| 1 | Alle | Schätzung wählen und einlocken |
| 2 | Host | „Karten aufdecken" (aktiv wenn alle gelockt) |
| 3 | Alle | Auswertung & Diskussion |
| 4 | Host | „Neue Runde" für nächste Story |

---

## Technisches

- **Reine HTML/CSS/JS Single-Page-App** — keine Abhängigkeiten, kein Framework
- **Sync** via `BroadcastChannel` + `localStorage` (funktioniert zwischen Tabs/Fenstern im selben Browser)
- **Hosting** via GitHub Pages — einfach `planning-poker.html` ins Repo, fertig

> **Hinweis:** Die Echtzeit-Synchronisation funktioniert aktuell nur zwischen Tabs im selben Browser. Für vollständiges Cross-Device-Multiplayer wäre ein kleines Backend (z.B. Firebase, Supabase oder Partykit) notwendig.

---

## Lokale Nutzung

```bash
git clone https://github.com/bastianbinus/Sprint-Poker.git
cd Sprint-Poker
# Einfach planning-poker.html im Browser öffnen
open planning-poker.html
```

---

## Lizenz

MIT — frei verwendbar und anpassbar.
