# 🃏 Sprint Poker

Planning Poker Tool für agile Teams — mit klassischem Modus und Casino-Spielmodus.

Live: [bastianbinus.github.io/Sprint-Poker](https://bastianbinus.github.io/Sprint-Poker/)

---

## Features

- **Classic Mode** — Einfaches Planning Poker, Host deckt auf, Auswertung mit Durchschnitt & Agreement
- **Casino Mode** — Chip-Einsätze, The House als Gegner, Gewinner kriegt Bonus-Chips
- **Fibonacci-Schätzwerte** — 1, 2, 3, 5, 8, 13, 21
- **Sonderwerte** — ☕ Pause / ? Nochmal besprechen
- **Echtzeit** — Mehrere Spieler gleichzeitig via Firebase Realtime Database
- **Einladungslink** — Session per URL teilen, kein Login nötig

---

## Tech Stack

- Vanilla HTML / CSS / JavaScript
- [Firebase Realtime Database](https://firebase.google.com/) — Echtzeit-Sync
- [Lucide Icons](https://lucide.dev/) — Coffee Icon
- [Google Fonts](https://fonts.google.com/) — Playfair Display, DM Sans, DM Mono

---

## Installation

```bash
git clone https://github.com/bastianbinus/Sprint-Poker.git
cd Sprint-Poker
npm install
```

---

## Scripts

### Dev-Server starten

```bash
npm run dev
```

Öffnet einen lokalen Server auf `http://localhost:5501`.  
Hier kannst du Änderungen testen bevor du sie live stellst.

### Code linten

```bash
npm run lint
```

Prüft `app.js` auf Fehler und schlechten Stil via ESLint.  
Sollte immer **0 errors** zeigen bevor du deployest.

### Deployen

```bash
npm run deploy
```

Pusht die aktuellen Dateien direkt auf den `gh-pages` Branch.  
Die Seite ist danach unter der Homepage-URL live.  
⚠️ Immer zuerst auf `main` mergen und `npm run lint` ausführen.

---

## Workflow

```
Entwickeln → npm run dev     (lokal testen)
           → npm run lint    (Fehler prüfen)
           → git commit      (Code sichern)
           → git push        (auf GitHub)
           → npm run deploy  (live stellen)
```

---

## Projektstruktur

```
Sprint-Poker/
├── src/
│   ├── index.html          # Markup & Struktur
│   ├── app.js              # Gesamte Logik (Firebase, Classic, Casino)
│   └── style.css           # Styling & CSS-Variablen
├── .vscode/
│   └── settings.json
├── .gitignore
├── eslint.config.mjs
├── LICENSE
├── package.json
└── README.md
```

---

## License

MIT © Bastian Binus
