# Barbell Diva 🏋️‍♀️

PWA di coaching fitness per allenamento, programmazione e analisi performance.

## 🚀 Avvio rapido

### Requisiti
- [Node.js](https://nodejs.org/) 18 o superiore

### Sviluppo locale
```bash
# Installa le dipendenze (la prima volta)
npm install

# Avvia il server di sviluppo
npm run dev
```

### Build di produzione
```bash
npm run build
npm run preview
```

### Test
```bash
npm test
```

## 📁 Struttura del progetto

```
├── index.html                  # Pagina principale dell'app
├── coach-studio-inline.css     # Stili principali (estratti da index.html)
├── src/
│   ├── utils.js                # Utility condivise (modulo ES)
│   └── utils-global.js         # Utility globali per script non-module
├── docs/
│   └── history/                # Documentazione storica (README, CHANGELOG versioni)
├── tests/                      # Test automatici
├── *.test.mjs                  # Test per versione
└── *.js                        # Moduli applicativi
```

## 🧩 Moduli principali

| File | Descrizione |
|------|-------------|
| `coach-ai-engine-2.js` | Motore AI per analisi performance e insight |
| `coach-ai3-programming.js` | Coach AI 3.0 - Intelligent Programming |
| `decision-engine.js` | Motore decisionale con risoluzione conflitti |
| `decision-rules.js` | Regole decisionali |
| `knowledge-graph.js` | Knowledge graph (atleti, programmi, esercizi) |
| `master-exercise-library.js` | Libreria centrale esercizi |
| `programming-engine.js` | Motore di programmazione e progressioni |
| `sync-reliability.js` | Sincronizzazione offline affidabile |
| `workout-flow-v147.js` | Flusso workout |
| `athlete-context.js` | Contesto atleta |
| `coach-studio.js` | Coach Studio |

## 📚 Documentazione

La documentazione storica delle versioni precedenti è in `docs/history/`:
- README e CHANGELOG delle versioni v142-v147
- Report di test delle fasi 19-24
- Note di migrazione e limitazioni

## 🔒 Sicurezza

- Le regole Firestore sono in `firestore.rules`
- Ogni utente può accedere solo ai propri dati
- Le API key Firebase sono pubbliche (normale per Firebase), ma assicurati di configurare **App Check** per prevenire abusi

## 📝 Note

- La pagina principale è `index.html`
- Il file `.nojekyll` evita problemi con gli asset della PWA su GitHub Pages
- Per pubblicare su GitHub Pages: Settings → Pages → Deploy from branch `main`