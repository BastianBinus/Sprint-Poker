# Sprint Poker

Planning Poker Tool für agile Teams — mit klassischem Modus und Casino-Spielmodus.

**Live:** [bastianbinus.github.io/Sprint-Poker](https://bastianbinus.github.io/Sprint-Poker/)

---

## Quick Start

```bash
git clone https://github.com/bastianbinus/Sprint-Poker.git
cd Sprint-Poker
npm install
npm run dev
```

Öffnet einen lokalen Server auf `http://localhost:5501`.

---

## Features

- **Classic Mode** — Einfaches Planning Poker, Host deckt auf, Auswertung mit Durchschnitt & Agreement
- **Casino Mode** — Chip-Einsätze, The House als Gegner, Gewinner kriegt Bonus-Chips
- **Fibonacci-Schätzwerte** — 1, 2, 3, 5, 8, 13, 21
- **Sonderwerte** — ☕ Pause / ? Nochmal besprechen
- **Echtzeit** — Mehrere Spieler gleichzeitig via Firebase Realtime Database
- **Einladungslink** — Session per URL teilen, kein Login nötig
- **Bot Tester** — Bis zu 4 Bots joinen und voten automatisch

---

## Scripts

| Script     | Befehl                      | Beschreibung                                           |
| ---------- | --------------------------- | ------------------------------------------------------ |
| Dev-Server | `npm run dev`               | Lokaler Server auf `http://localhost:5501`             |
| Lint       | `npm run lint`              | Prüft `app.js` via ESLint — immer vor Deploy ausführen |
| Deploy     | `npm run deploy`            | Pusht `src/` auf `gh-pages` Branch → Live              |
| Bot Test   | `npm run usertest -- "URL"` | Startet 4 Bots auf einer Session                       |

### Bot Tester

```bash
npm run usertest -- "http://localhost:5501/src/?s=SESSION_ID&m=casino"
```

Die 4 Bots (Alice, Bob, Charlie, Diana) joinen die Session, wählen zufällige Fibonacci-Werte und verlassen die Session nach 30 Sekunden. Kein Browser nötig — schreibt direkt in Firebase.

---

## Workflow

```
Entwickeln → npm run dev        (lokal testen)
           → npm run lint       (Fehler prüfen)
           → git commit         (Code sichern, patch version auto-bump)
           → git push           (auf GitHub)
           → npm run deploy     (live stellen)
```

---

## Universelles UI-System

Das Styling besteht aus zwei Dateien:

| Datei               | Zweck                                                                            |
| ------------------- | -------------------------------------------------------------------------------- |
| `src/variablen.css` | Alle Design-Werte als CSS-Variablen — **nur hier anpassen**                      |
| `src/universal.css` | Alle Komponenten-Styles — nutzt ausschliesslich Variablen, nie direkt bearbeiten |

**Nur `variablen.css` bearbeiten** — `universal.css` bleibt immer unberührt.

### Wichtigste Variablen

```css
/* src/variablen.css */
:root {
  /* Markenfarben */
  --color-brand-pax-green: #8ccd0f; /* Primärakzent */
  --color-brand-pax-purple: #3c0078; /* Hintergrundfarbe */
  --color-brand-deep-green: #003018; /* Dunkelton */

  /* Fonts */
  --font-primary: Arial, Helvetica, sans-serif;

  /* Poker-Tisch */
  --table-felt: #003d1e; /* Filzfarbe */
  --felt: #003018; /* Kartenhintergründe */

  /* Logo (leer = kein Logo) */
  --logo-display: none;
  --logo-position: fixed;
  --logo-top: 24px;
  --logo-left: 24px;
  --logo-max-height: 48px;
}
```

### Eigenes Theme (White-Labeling)

Eine neue `mein-theme.css` anlegen, dieselben Variablen überschreiben, und in `universal.css` den `@import` anpassen:

```css
/* universal.css — erste Zeile */
@import "mein-theme.css";
```

### Logo einbinden

In `variablen.css`:

```css
--logo-display: block;
--logo-position: fixed;
--logo-top: 24px;
--logo-left: 24px;
--logo-max-height: 48px;
```

In `index.html`:

```html
<img id="site-logo" src="logo.png" alt="Logo" />
```

---

## Tech Stack

- Vanilla HTML / CSS / JavaScript
- [Firebase Realtime Database](https://firebase.google.com/) — Echtzeit-Sync

---

## Projektstruktur

```
Sprint-Poker/
├── src/
│   ├── index.html          # Markup & Struktur
│   ├── app.js              # Gesamte Logik (Firebase, Classic, Casino)
│   ├── universal.css       # Komponenten-Styles (nicht direkt bearbeiten)
│   └── variablen.css       # Theme-Variablen (hier das Design anpassen)
├── test-bots.js            # Bot Tester Script
├── eslint.config.mjs
├── package.json
└── README.md
```

---

## Versioning

Patch-Version wird automatisch bei jedem Commit erhöht (via Husky pre-commit hook).

```bash
npm version patch   # 1.0.0 → 1.0.1 (Bugfix)
npm version minor   # 1.0.0 → 1.1.0 (Neue Funktion)
npm version major   # 1.0.0 → 2.0.0 (Grosser Umbau)
```

---

## License

MIT © Bastian Binus
