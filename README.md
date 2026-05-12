# Sprint Poker

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
- [Lucide Icons](https://lucide.dev/) — Icon-Set
- [Google Fonts](https://fonts.google.com/) — Playfair Display, DM Sans, DM Mono
- [Pax UI](https://www.npmjs.com/package/@pax-product/pax-ui) — Design-System als Basis

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

## Universelles UI-System

Das Styling besteht aus zwei Dateien:

| Datei | Zweck |
|---|---|
| `src/variablen.css` | Alle Design-Werte als CSS-Variablen — **nur hier anpassen** |
| `src/universal.css` | Alle Komponenten-Styles — nutzt ausschliesslich Variablen, keine hardcoded Werte |

### Wie man das Design anpasst

**Nur `variablen.css` bearbeiten** — `universal.css` bleibt immer unberührt.

```css
/* src/variablen.css */
:root {

  /* Markenfarben */
  --color-brand-pax-green:      #8ccd0f;  /* Primärakzent */
  --color-brand-pax-purple:     #3c0078;  /* Hintergrundfarbe */
  --color-brand-deep-green:     #003018;  /* Dunkelton für Text auf Akzent */

  /* Fonts */
  --font-primary: Arial, Helvetica, sans-serif;
  --font-mono:    Arial, Helvetica, sans-serif;
  --font-serif:   Arial, Helvetica, sans-serif;

  /* Abstände (Spacing Scale) */
  --space-xs:  0.25rem;   /*  4px */
  --space-s:   0.5rem;    /*  8px */
  --space-m:   0.75rem;   /* 12px */
  --space-l:   1rem;      /* 16px */
  --space-xl:  1.25rem;   /* 20px */
  --space-2xl: 1.5rem;    /* 24px */

  /* Poker-Tisch */
  --table-felt:  #003d1e;  /* Filzfarbe */
  --felt:        #003018;  /* Kartenhintergründe */

  /* Logo (leer lassen = kein Logo) */
  --logo-display:    none;
  --logo-position:   fixed;
  --logo-top:        24px;
  --logo-left:       24px;
  --logo-max-height: 48px;
}
```

### Pax UI Integration

Das Projekt nutzt die `@pax-product/pax-ui` Bibliothek als Design-System-Grundlage.
Die Klassen aus Pax UI können direkt in `index.html` genutzt werden.
`variablen.css` überschreibt dabei gezielt die Pax-Tokens für das Sprint-Poker-Theme.

> Ein eigenes Theme (z. B. für White-Labeling) erstellt man, indem man eine neue Variablen-Datei
> anlegt und `variablen.css` im `@import` von `universal.css` ersetzt.

### Logo einbinden

Das Logo wird über CSS-Variablen gesteuert — kein JS nötig:

```css
/* variablen.css */
--logo-display:    block;          /* Einblenden */
--logo-position:   fixed;
--logo-top:        24px;
--logo-left:       24px;
--logo-width:      auto;
--logo-max-height: 48px;
--logo-z:          100;
```

Dann in `index.html` das `src`-Attribut des `#site-logo`-Elements setzen:

```html
<img id="site-logo" src="logo.png" alt="Logo">
```

---

## Projektstruktur

```
Sprint-Poker/
├── src/
│   ├── index.html          # Markup & Struktur
│   ├── app.js              # Gesamte Logik (Firebase, Classic, Casino)
│   ├── universal.css       # Komponenten-Styles (nicht direkt bearbeiten)
│   └── variablen.css       # Theme-Variablen (hier das Design anpassen)
├── .vscode/
│   └── settings.json
├── .gitignore
├── eslint.config.mjs
├── LICENSE
├── package.json
└── README.md
```

---

## Versioning

Patch-Version wird automatisch bei jedem Commit erhöht.
Für neue Features oder grosse Änderungen manuell:

```bash
npm version patch   # 1.0.0 → 1.0.1 (Bugfix)
npm version minor   # 1.0.0 → 1.1.0 (Neue Funktion)
npm version major   # 1.0.0 → 2.0.0 (Grosser Umbau)
```

---

## License

MIT © Bastian Binus
