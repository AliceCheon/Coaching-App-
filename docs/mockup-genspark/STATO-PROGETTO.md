# Barbell Diva — stato del progetto (mockup dashboard)

**Versione attuale del file:** `Barbell-Diva-v31-nomi-puliti.html` (5,76 MB, pagina singola, 22 tab — evolve `Barbell-Diva-dashboard-v31.html` prodotto dalla build)
**Ultimo aggiornamento:** 30 ottobre 2026, sera (archiviazione di fine chat)
**Dove vive il lavoro:** branch `mockup-genspark` del repo Coaching-App-, cartella `docs/mockup-genspark/` (mai su main) + copia sul PC di Alice + copie consegnate nella chat. **Qui non c'è codice dell'app**: solo pagine statiche, immagini di verifica, dati di riferimento e il generatore che produce l'HTML.

> **Avvertenza**: niente in questa cartella tocca `src/`, `tests/`, `main`. È un archivio di lavoro, non una release.

---

## 1. Le regole che mi hai dato (e che valgono ancora)

1. **Colori solo dal tema.** Niente esadecimali o `rgba()` scritti a mano nel blocco nuovo: si usano `var(--card)`, `var(--card-2)`, `var(--text)`, `var(--muted)`, `var(--line)` e gli accenti `--pink #FF4FA3`, `--purple #A855F7`, `--lav #C9A7FF`, `--verde #7BE0A8`, `--core #FFE066`. Le velature si fanno con `color-mix(in srgb, var(--core) 26%, transparent)`.
2. **Niente `!important` nel codice nuovo.** Le dichiarazioni legacy che lo usano si correggono nel generatore, non aggiungendo altre forzature.
3. **Un solo `<style id="programmi">` e un solo `<script id="programmi-js">`** nel file finale: tutto si concatena in build, non si incolla a mano.
4. **Diva Bot resta.** Non va tolta né ridisegnata.
5. **Niente parte commerciale.** Del riferimento CoachPro abbiamo scartato prezzi, CTA, sezioni GDPR/marketing: serve il metodo, non la brochure.
6. **Dati veri dal backup, mai numeri inventati.** Se un dato non c'è, si scrive che manca. Niente cifre di riempimento per far bella la schermata.
7. **Un pulsante o funziona o è marcato "demo".** Non esistono bottoni che fingono.
8. **Testo in italiano**, tono diretto, niente inglesismi dove esiste la parola italiana.
9. **Tema chiaro e scuro** entrambi leggibili: ogni regola si verifica nei due temi.
10. Il lavoro si consegna a blocchi: un tema per turno, con verifica a schermo prima di dichiararlo fatto.

---

## 2. Cosa è stato deciso

- La dashboard è **una pagina sola**, senza framework, apribile con doppio clic: si costruisce con un generatore Python (`build/apply.py`) che parte da `v30.html` e applica i blocchi T2…T10 in ordine.
- La struttura della riga esercizio (T2) è la spina dorsale: `c-js`, `c-dist`, `c-ese` (nome + chip tecnica/finisher/recupero/pausa + `⇄ DX/SX` + test), `c-note`, `c-rec`, `c-tut`, 8 coppie serie/ripetizioni `c-ser`/`c-reps`, `c-ult`.
- Le viste sono 20: `dashboard, dati-cliente, salute-recupero, misure, reset-bulk-cut, monitor-annuale, monitor-peso, integratori, overview-atleta, pianificazione, database-esercizi, scheletri, progressioni, programma-1, programma-2, programma-3, riepilogo-volume, specializzazione, curve-forza, archivio`.
- Lo stato si salva in `localStorage`: `bd.edit.v27` (celle), `bd.t8.rows`, `bd.t8.skel`, `bd.t9.plan` (periodizzazione), `bd.t9.scar` (serie originali per il ripristino dello scarico).
- Gli atleti del mockup sono **Alice Clemente** (178 cm, 67,7 kg, 31 anni, donna) e i dati reali del backup: BF 17,1 → 10,8%, 119 sedute in archivio, ultima 27/10/2026.

### Decisioni del 30/10/2026 — Logbook (pre Fase A)

- **Serie tecniche nell'eseguito**: ereditano la tecnica programmata del giorno; ogni volume così calcolato si etichetta «stimato».
- **Durata e riscaldamento eseguito**: il dato non esiste nell'app; nel logbook si mostra «non registrato», niente stime.
- **Distretti 12 → 11**: la normalizzazione delle etichette è un passo separato, prima della Fase D (dopo il logbook, prima della plancia).
- **Fase B — medie calcolate**: le medie scritte a mano nel Diario diventano calcolate dalle righe esposte: energia media (oggi scritta «8,3», vero 8,5 sulle 6 righe esposte) e RPE medio (riga 1624: scritto «8.6 su 5 sedute»).

---

## 3. Cosa è fatto

| Blocco | Tema | Esito |
|---|---|---|
| T1 | Tema chiaro/scuro sul modello reale | fatto |
| T2 | Struttura riga esercizio rifatta (8 settimane in riga, chip, note, recupero, TUT) | fatto |
| T3 | Chip tecnica/finisher/recupero/pausa, popup, 13 progressioni × 8 settimane, 4 gruppi di tecniche | fatto |
| T4 | Popup esercizio (sostituisci, dettaglio, libreria) | fatto |
| T5 | Tabelle e densità, colonne allineate, sticky | fatto |
| T6 | Menu, rail 250 px, drawer | fatto |
| T7 | 4 pagine nuove (overview atleta, pianificazione, riepilogo volume, specializzazione) | fatto |
| T8 | 5 comandi (duplica scheda, svuota, copia settimana, scheletri, nuova scheda E reale) + persistenza al reload | fatto |
| T9 | **Periodizzazione** (4 modelli: lineare, blocchi, ondulata, conico) + **Analisi programmazione** calcolata dal DOM + fix navigazione Database esercizi | fatto |
| T10 | **5 correzioni**: badge distretto fuori dal nome, scarico reale con colonna gialla, "Applica progressione" per riga, undo vero (Ctrl+Z/Ctrl+Shift+Z, 60 passi), pannello **Stress** calcolato | fatto |
| T10-bis | Badge lettera tolto dal *template* JS (non solo dall'HTML: si rigenerava a ogni render) + unità stress rinominata da `u` (illeggibile) a `pt` con nota metodologica | fatto |
| T10-ter | **Toast spostati in alto**: i 4 toast (`#pg-toast`, `#pr-toast`, `#t8-toast`, `pr-toast3`) erano tutti ancorati a `bottom:26px` al centro e coprivano i comandi della zona bassa. Spostati a `top:26px` correggendo in place le 3 regole CSS esistenti e il `cssText` inline del quarto: zero blocchi `<style>` nuovi, zero `!important`, Diva Bot (`#bd-diva`, in basso a destra) intoccata | fatto |
| T10-quarto | **Audit di tutti i tastini** (test automatico col browser: 862 clic uno per uno) → trovata UNA causa sola: errore di sintassi alla riga della nota Stress (una `+ '...'` persa: `…leggibili') restano fuori dal conteggio.'`) che uccideva l'intero blocco `programmi-js`. Da qui i `PROG is not defined` sui tastini «＋» e «▤ Applica progressione» di ogni riga e i comandi delle schede zitti. Corretta la stringa in place, sintassi verificata con Node, ri-test completo: **879 tastini cliccati, 0 errori, 0 morti** (l'unico non cliccabile è «Serve la mappa articolare», che ha `disabled` di proposito). Tema chiaro/scuro verificato: lampadina e tasti Scuro/Chiaro funzionano | fatto |
| **Logbook · Fase A** | **Fonte unica delle sedute eseguite dentro Overview atleta** (30/10/2026, backup reale del 30/10 incorporato come seme): 120 sedute · 1.918 serie · 778 esercizi. Chip «Ultime sedute» reali e cliccabili (data + scheda + programma) → dettaglio nel **cassetto** con eseguito e programmato fianco a fianco (volume eseguito, RPE medio serie, durata o «non registrata», riscaldamento «non registrato», journal della seduta, serie con tecnica etichettate volume **stimato**). **Logbook completo** con filtri programma/mese/esercizio, scorre nella sua cornice. **«Importa backup» vero**: FileReader locale, valida il formato `barbell-diva-backup`, normalizza, salva in `localStorage` (`bd.logbook.v1`), aggiorna chips + lista + conteggi; «Dimentica» torna al seme. **`totSedi = 119` sostituito dal conto calcolato** (120). Collaudo puppeteer: filtri 120→7 sull'attivo, import di prova 1 seduta → conta 1, tema scuro ok, zero errori nuovi | fatto |
| **Logbook · Fase B** | **Diario delle sedute e Feedback post-allenamento dal logbook**: fuori le 6 righe a mano (date 17/07…22/09, sbagliate), dentro le voci vere del journal del backup 30/10 (03/10 → 20/10, con RPE, energia, umore e note); medie calcolate dai dati, mai scritte a mano: RPE medio **8,67 su 6** (prima «8,7» nel Diario e «8.6 su 5» nel Feedback), energia media **8,5** (prima «8,3»); dopo un import si ridisegnano da soli. Collaudo puppeteer: 6 righe, date e medie lette dal DOM, tema scuro ok, zero errori nuovi | fatto |
| **Logbook · Fase A-bis** | **Ultimi «119» a mano fuori** (su segnalazione di Alice): anteprima in alto → **calcolata dal logbook** (fonte + conto, span `data-lb-ante`); piè del check-in → **calcolato** (fonte, 120 sedute, ultima, catalogo 221 — prima 179); nota peso vuoto → **ricalcolata etichettata istantanea del 30/10** (peso compilato in 0 su 120: la frase era vera, il numero no); nota Curve di forza → **etichettata istantanea del 28/10, non collegata al logbook** (lo sarà in Fase C). KPI Programmi: **ripiego 119 eliminato** (`data-lb-kpi`, all'origine «…» e poi riempito dal logbook). **Umore: vocabolario unico** = mappa `MOOD` (alla grande, buono, neutro, giù) anche nel Feedback: fuori la doppia mappa `M2` («così così») | fatto |
| **Fase 1 — tabella delle tab** | **23 tab censite a sola lettura** (`FASE1-TABELLA-TAB.md`, non 20: emerse `programma-corsa`, `study-time`, `impostazioni`): tab, cosa deve mostrare, fonte (telefono/coach/calcolato), esiste, collegata oggi, verdetto (collegare/tenere/fondere/togliere). Verdetti proposti: 9 tenere, 6 collegare, 2 fondere (Programma 2 e 3 con i programmi reali del backup), Curve = Fase C, 1 da togliere (corsa: decide lei) | fatto |
| **Logbook · Fase A-ter** | **Gli ultimi «119» chiusi** (20:30): frase di Monitor annuale → **calcolata** («le sedute dal logbook (120, ultima 27/10)» con span `data-lb-kpi`); seed `D.fonte` → **allineato al backup 30/10** (sedute 120, nome file 30/10; i consumi erano già tutti lazy); ripiego `: 119` di `totSedi` → **eliminato** (0, ramo mai percorso). **Conteggio vero a tutto file: 1 sola occorrenza UI** («119 sedute lette», etichetta istantanea 28/10 della nota Curve, voluta); le altre sono base64 di foto, path SVG di Diva Bot e `min-width:1196px`. **Mistero pesate**: nel backup 30/10 le pesate non ci sono (`metrics.weight` = stringa vuota, «13/03» zero occorrenze, peso nelle 120 sedute 0/120); le 5 pesate del mockup (13/03 → 27/10) vengono dal vecchio seed `SEED.sessioni` del 28/10 — la fonte vera del log peso va verificata nell'APK (Fase 3) | fatto |

---

## 4. Cosa è fatto male o a metà (onestà)

- **Il badge della lettera è stato corretto due volte.** La prima volta ho cancellato solo le occorrenze già stampate nell'HTML: il JavaScript le ricreava a ogni disegno della riga, quindi a schermo restavano. Corretto alla radice in `build/t8.js` (template) e verificato sul DOM vivo: `.p8-d` = 0.
- **Screenshot del pannello Stress instabile nei miei test.** In un collaudo la cattura è uscita vuota per un problema di tempi dello script Playwright, non del file: i valori li ho letti dal DOM. Da rifare con calma per avere un'immagine pulita.
- **`PROG is not defined`** — RISOLTO il 30/10/2026. La causa era l'errore di sintassi della nota Stress (vedi T10-quarto) che bloccava l'intero blocco `programmi-js`: non era un fantasma, c'era a ogni caricamento.
- **Errori console preesistenti** (non introdotti da noi): due `<path> attribute d: Expected moveto` (SVG di un grafico), `404 favicon`, `501 POST` (il server statico di test non accetta POST).
- **Testi tagliati sul bordo sinistro** quando il rail è fisso: difetto preesistente del mockup v30, non risolto. Nel file reale il rail è dentro il flusso, quindi non si vede.
- **Toast in basso** — RISOLTO il 30/10/2026 (T10-ter): i toast scendono dall'alto e i comandi restano cliccabili.
- **33 righe con TUT vuoto**: lo Stress conta 3 s/ripetizione come default, e la nota lo dichiara. Meglio sarebbe compilare il TUT vero nel backup.
- **Reps sporche nel seed** (`test 12rm, → 8`, `10-8-x`, `—×10`): c'è un parser che estrae i numeri, ma il dato a monte andrebbe ripulito.
- **Logbook Fase A+B — correzioni del 30/10 e residui onesti**: KPI «sedute registrate» della zona Programma attivo collegato al logbook (espressione lazy nel template: conta `BD_LB.sedute.length` a ogni render — era il 119 dell'istantanea); chips, cassetto, logbook e Monitor annuale contano tutti dallo stesso negozio. **Durata corretta**: `totalDurationSeconds` esiste in 3 sedute di luglio (22/07 3950 s, 23/07 4700 s, 25/07 3344 s), NON nelle recenti; `sessionRpe` e `pain`: 0 sedute con valore; `readinessSnapshot`: 3 (le stesse di luglio, con check-in dentro). **Import e memoria**: con il backup completo da 16,5 MB il salvataggio in `localStorage` ci sta (109.896 byte) e il toast dice «Salvate in memoria locale: restano anche ricaricando la pagina»; se un giorno non ci stesse, il messaggio avvisa che i dati restano solo finché la pagina è aperta. Dopo un import la colonna «Programmato» del cassetto si ricostruisce dal backup importato; le 151 righe storico senza data e le 8 con scheda anomala restano fuori dai conteggi, a visiera alta. Il seme è incorporato nell'HTML: portarlo nel generatore (`t11`) resta in coda.
- **Fase B** — fatto (vedi §3). Nota: il vero RPE medio sulle 6 voci è **8,67** (52/6); l'«8,83» scritto in chat il 30/10 era un errore di chi scrive, l'estratto calcolato diceva 8,67.
- **Lo scarico riduce le serie (−35%), non i carichi.** È coerente a metà: la settimana è più leggera di volume, non di intensità.

---

## 5. Cosa resta da fare

1. **Export PDF/scheda stampabile** della scheda settimanale: oggi non c'è.
2. **Vista mobile** della tabella programma (oggi è desktop-first, `min-width: 1196px`) — in pausa: prima solo PC.
3. **Compilare il TUT** mancante e ripulire le reps nel backup d'origine.
4. **Screenshot puliti** di tutti i pannelli, per il README.
5. **Collegamento reale** a Firebase/G9: oggi il mockup lavora offline in prova a secco.
6. **Verifica sistematica chiaro/scuro** su ogni pannello nuovo (fatta a campione, non su tutti).
7. **Blocco 1 APK** — salvare le risposte del check-in settimanale (+ data) e il peso del check-in in `metrics.weight`: oggi nel backup `answers={}` e il «Peso di oggi» va perso (bug APK n.1). Prima il piano (file/funzioni/campi) e il via di Alice, poi il codice: solo branch separato, mai main né produzione, mai toccare `android-twa/` né firma (alias `barbelldiva`), modifiche additive con migrazione, `npm test` eseguito e riportato, istruzioni per provare su copia con backup esportato.
8. **Blocco 2 APK** — mini check-in giornaliero con passi e sonno a inserimento manuale (battiti/HRV non raccolti): parte solo dopo il via sul Blocco 1, con proposta preliminare prima del codice.
9. **Fase D — distretti**: 39 esercizi senza `muscle`, 2 con valore numerico («0», «65,83…»), grafico a fette della Dashboard ancora con «gluteo medio» a mano. Chiusura proposta: mappa nome→distretto per i 39, preparata dall'agente e approvata da Alice, poi si esegue.
10. **Decisioni nutrizione in sospeso** (censimento completo con proposte in `FASE3-INVENTARIO-PAYLOAD.md`; NULLA è stato cancellato): rinomina del gruppo rail «Alimentazione» (proposta «Atleta»), degli occhielli «Alimentazione · …» su 6 pagine e delle tab Reset/Bulk/Cut — decide la coach.
11. **Diva Bot**: decidere se togliere le 3 citazioni JS della corsa dentro i fumetti (oggi lasciato: Diva non si tocca; sono dati, non link).
12. **Verifica su browser umano con rete reale**: i collaudi qui sono puppeteer su `file://`; i 5 avvisi console di `file://` (Cloudflare/CORS/SVG) sono presenti identici nella copia pre-modifiche.

> **Scartato su decisione di Alice (30/10/2026)**: «scarico anche sui carichi». Lo scarico resta sul volume (−35% serie); i carichi suggeriti non si toccano.

---

## 6. Il video di riferimento — CoachPro v5 · AD Method System

Landing di presentazione di un gestionale per coach (non un'app: un sito che vende il sistema), letta su 100 fotogrammi. Sotto solo ciò che **si legge davvero**; il resto è segnato come tale.

### 6.1 Struttura della pagina

| Sezione | Titolo letto | Contenuto |
|---|---|---|
| Hero | «Più visione. Meno rumore.» | badge «AD METHOD SYSTEM · COACHPRO 5», mockup workspace + telefono, indicatore «80 READINESS» |
| 01 — IL PUNTO | «Non ti serve un altro software da compilare.» | «Ti serve un sistema che tenga insieme il tuo metodo, il lavoro del team e ciò che l'atleta fa davvero» + pillola «COSTRUITO DA CHI CONOSCE IL COACHING DALL'INTERNO» |
| Sistema (tab) | «La complessità resta sotto. Tu vedi ciò che conta.» | 4 linguette: **01 Regia coach · 02 Programmazione · 03 Nutrizione & fasi · 04 Esperienza atleta**; sotto «UNA VISTA. LE PRIORITÀ GIUSTE.» |
| Intelligenza proprietaria | «La logica resta protetta. Il valore è davanti a te.» | dashboard con verdetto, «Lettura Coach», «Confronto Questionario» |
| Controllo umano | «01 Contesto, non rumore · 02 Indicazioni, non automatismi ciechi · 03 Controllo umano, sempre» | la promessa: la decisione resta del coach |
| 05 — DATA PROTECTION & CYBER SECURITY | «La performance cresce. I dati restano sotto controllo.» | minimizzazione e finalità, autorizzazioni |
| Prezzo | «COACHPRO BASE da 450 € / anno» | scartato |

> Le sezioni **02, 03 e 04** stanno fra «La complessità resta sotto» e «La logica resta protetta»: nei fotogrammi i titoli erano tagliati dallo scroll, quindi non li cito inventandoli.

### 6.2 Le funzioni mostrate

- **Readiness** 0–100 con giudizio a parole («Buona 80/100 · Atleta pronto: recupero e adattamento in equilibrio») e **affidabilità %** che dice quanto fidarsi del numero.
- **Metriche di contorno**: sonno (ore + punteggio /100), **HRV**, stress %, aderenza %, peso.
- **Verdetto** sintetico con confidenza: «Continua semplice · confidence 84%».
- **Progressione per esercizio** su finestra di 6 settimane: totale ±%, upper/lower, tabella ordinabile per Migliori / Peggiori / Volume set, con delta verdi (+50,0% Seated Calf Raise, +33,3% Pressa 45° focus glutei, +29,8% Rear Delt Machine, +18,7% RDL focus glutei manubri, +14,5% Pulley triangolo, +14,4% Alzate laterali cavo basso, +14,3% Hip Airplane).
- **Lettura Coach**: due righe in italiano che dicono cosa guardare («Upper in crescita moderata, lower cresce meno, stress percepito moderato, continua la progressione semplice, monitora i dorsali»).
- **Confronto Questionario**: l'ultimo questionario contro il precedente.
- **Volume corrente · Radar bilanciamento · Specializzazione [OLTRE IL MAX] · Stress allenamento**: quattro letture sulla stessa schermata.
- **Wearable**: Apple Watch, Garmin, Fitbit, Oura, Whoop, Polar; fasi del sonno ora per ora.
- **App atleta**: barra inferiore Home · Allena · Alimentazione · Corpo · Altro; «Settimana 4 · Schede di oggi», prossima sessione, progressione.

### 6.3 Il check-in settimanale — 16 domande in 4 blocchi

Nei fotogrammi si leggono le **etichette dei blocchi**, non il testo delle singole domande:

| Blocco | Domande | Come si legge | Direzione |
|---|---|---|---|
| 1 | `q1–q4` | **non leggibile** nei fotogrammi | — |
| 2 | `q5–q8` | **non leggibile** nei fotogrammi | — |
| 3 | `q9–q12` | etichetta **STRESS** | **alto = peggio** |
| 4 | `q13–q16` | etichetta **SOSTENIBILITÀ** | **alto = meglio** |

Dalla dashboard: **STRESS 5.0/10**, **SOSTENIBILITÀ 8.0/10**, questionario datato («14 giu, più recente»).

> **Onestà**: le prime otto domande il video non le mostra leggibili — compaiono solo come punteggi aggregati. La struttura a 16 item e i due blocchi con direzione opposta sono un dato; il testo di `q1–q8` no. Il nostro check-in usa **3 domande** — sonno, energia, indolenzimento, 0–10 — e calcola la Readiness.

### 6.4 Cosa abbiamo preso e cosa abbiamo lasciato

**Preso**: la logica del verdetto con confidenza; la «Lettura Coach» in italiano; il confronto questionario; readiness con affidabilità; la progressione per esercizio a finestra mobile; il radar di bilanciamento; il fatto che la decisione resti al coach.

**Lasciato**: prezzo e CTA commerciale; le sezioni GDPR/marketing; i moduli nutrizione (fuori perimetro); l'estetica oro/antracite (noi restiamo rosa/viola su `#17101F`); i nomi dei wearable come promessa di integrazione, finché non c'è.

---

## 7. Come si ricostruisce il file

```bash
cd build
python3 apply.py     # legge ../v30.html e scrive ../Barbell-Diva-dashboard-v31.html
```

L'ordine dei blocchi è dentro `apply.py`: `t2 → t3 → t7 → t8 → t9 → t10`. Il generatore stampa i conteggi di verifica (righe trasformate, badge tolti, hex nuovi = 0, `!important` = 1 residuo legacy). Se un blocco non si applica, lancia un `assert`: meglio rompere la build che consegnare un file mezzo patchato.

I file `t*.css` e `t*.js` sono i pezzi: CSS e JS si concatenano nel blocco unico, i `.py` fanno le sostituzioni sull'HTML.

> **Nota del 30/10/2026 — chiusa**: l'errore di sintassi della nota Stress stava nel testo generato dalla build. Corretto **sia nel file sia alla fonte**, in `build/t10.js` (riga 210). Verifica: tutti i JS del generatore passano `node --check` e anche la concatenazione nell'ordine di build (`pr → t3 → t7 → t8 → t9 → t10`) passa. Rigenerando con `apply.py` il mockup non si rompe più.

---

## 8. Indice dei file

| Cartella | Contenuto |
|---|---|
| `dashboard/` | `Barbell-Diva-dashboard-v31.html` — il mockup completo (T1–T10) |
| `build/` | generatore (`apply.py`) e blocchi `t2…t10` (py + css + js) |
| `verifica/` | 15 schermate di collaudo, un tema per file (`t1…t11`) |
| `riferimento/` | screenshot tuoi (`u1`, `u2`) e le due immagini del turno sui nomi e sullo Stress |
| `dati/` | `prog-schede.json` (13 progressioni), `tree.json` (albero del repo app) |
| radice | `STATO-PROGETTO.md`, `README.md`, `FASE1-TABELLA-TAB.md`, `TABELLA-DATO-FONTE.md`, `FASE3-INVENTARIO-PAYLOAD.md`, `INVENTARIO-LOGBOOK-fase0.md`, `ESTRATTO-LOGBOOK-dati-reali.md`, `push.sh` |
| `backup/` (solo in locale) | copie pre-modifica del mockup (`pre-toast`, `pre-logbookA`, `pre-faseB2`, `pre-blocco3`) e il backup reale dell'app del 30/10 — non su GitHub: è un export integrale dei dati |


### 30/10 sera · Fase B2 (Archivio + Curve reali) e Fase C (distretti 12→11)
- Archivio programmi: esercizi/serie/sedute/ultima calcolati dal backup (gruppo per programId), aggiunta riga «Intensità ottobre-dicembre (attiva)», «senza programma» calcolato. Verificato: 32/7/14/67, ultima IAO 17/10.
- Curve di forza: blocco «Dal logbook — carico massimo per seduta» in cima alla tab «Curva storica» (40 esercizi con almeno 2 sedute, SVG, primo/ultimo/max/Δ). Dati calcolati dal backup 30/10 e incorporati: con «Importa backup» il resto del logbook si aggiorna, questo blocco resta allo snapshot (etichetta dichiarata).
- Grafico demo della curva storica etichettato «demo · istantanea, non collegata al logbook» (span cv-info non più con il numero a mano «48 sedute»).
- Fase C: STOR «gluteo medio» (2) fuso in «Glutei» (9) → 11 distretti, come `ui.volumeGroup`=11 dell'app. Residuo: il grafico a fette della Dashboard mostra ancora «gluteo medio 2%» a mano (non toccato, è un'altra sezione).
- Etichette pesate/misure: «dalla scheda della coach, non dal telefono» ovunque; corretta la mia spiegazione (seme __BDSEED modo «carta», fonte «scheda cartacea 13/03 → 27/10/2026» — non «onda del backup 28/10»).
- Verità check-in: `quiz.questionnaireHistory` ha 2 righe datate (07/09, 21/10) ma `answers={}` → le risposte (e il «Peso di oggi») vanno perse: bug APK n.1. Ritirata la frase «righe scritte a mano».
- APK = PWA (GitHub Pages) + TWA Gradle, niente bridge nativo: Health Connect richiede parte nativa. Lista APK con priorità/costo in FASE3-INVENTARIO-PAYLOAD.md v2.
- Regola nuova: il logbook coach rispecchia il logbook dell'app (campi/filtri da src_app-main.js).
- Backup pre-modifica: `backup/Barbell-Diva-v31-nomi-puliti.pre-faseB2.html`.
- Test: lbtest3 OK + lbtest4 (32/7/14/67, 40 esercizi curva, SVG presente, 0 errori).


### 30/10 sera (2) — Decisioni della coach + residui A (blocco mockup)
- Decisione 1: «Programma corsa» tolta (rail + sezione). 22 tab verificate al DOM. Nei fumetti di Diva Bot restano 3 citazioni JS della corsa (dati, non link — Diva intoccabile).
- Decisione 2: nutrizione NON rientra — censimento completo con proposte tieni/togli/rinomina in FASE3 (nulla cancellato, decide la coach).
- Decisione 3: passi/sonno = inserimento manuale in mini check-in giornaliero (Blocco 2 APK); battiti/HRV non raccolti; nel coach tessere «—»/«non registrato» (verificato: nessun numero finto).
- A1: TABELLA-DATO-FONTE.md (nuova) + Fase 1 a 22 tab.
- A2: frase «RPE medio 8,7» calcolata dal diario (sr-nota-rpe, 52/6); etichetta check-in «date nel backup, risposte non salvate dall'app» su Dashboard e Salute.
- A3: Archivio — «Schede» calcolata (4/4/6/0/0/18); B1/B2 avevano valori inventati (nel backup: 0 sedute) e celle che restavano a puntini. Nuova intro.
- A4: Fase C da NON considerare chiusa: 39 esercizi senza muscle, 2 numerici, grafico Dashboard a mano. Proposta di chiusura in FASE3 (mappa approvata dalla coach → Fase D).
- A5: Mostra/Fonte nel logbook coach come nell'app (dati st/so dal backup; App 81, Alice 31, Bk 5, AWP 3; completate 84, bozza 36). Filtri Mostra/Fonte verificati al DOM: 120 righe, bozza 36/36, App 81/81, Alice Logbook 31/31, Backup Alice 5/5, Excel 0, Cloud 0, tutte 120; zero errori JS.
- Correzione mia: la verifica DOM della tabella completa del logbook è arrivata SOLO in questo turno (diag6): le righe portano data-lb=<id> — mappatura certa.
- NON verificato: comportamento in browser umano con rete reale; i 5 avvisi console di file:// (Cloudflare/CORS/SVG) sono presenti identici nella copia pre-modifiche.
- Backup pre-modifiche: backup/Barbell-Diva-v31-nomi-puliti.pre-blocco3.html.

### 31/10/2026 (notte) — Fase D: distretti chiusi
- **Mappa approvata da Alice** (ore 1:09): 39 senza distretto completati; correzioni sue rispetto alla proposta: **Hyperextension → Glutei** (non Centro schiena) e **Bulgaro → Glutei** (non Quadricipiti); face pull → Spalle; Slanci c.b / Slanci c.b. → Glutei (come «Slanci cavo basso» del catalogo 179). Tutto il resto com'era proposto; Stacco mono → Femorali confermato.
- **BD_LB_EXCAT** (logbook): 221 → **232 voci**. Le 3 chiavi numeriche («0», «65.5», «74») eliminate: righe corrotte del backup, 0 usi nel logbook. 14 nomi usati nel logbook ma assenti aggiunti (5 copiati dal catalogo 179, 9 mappati a mano). Anomalie residue: **0**.
- **Grafico a fette della Dashboard**: da HTML statico a mano (12 fette con «gluteo medio 2%») a legenda + conic-gradient **generati dal JS**; **STOR** da letterale a mano a **calcolato dal programma attivo** (D.programma, serie per distretto, gluteo medio fuso in Glutei). Ricalcolo di verifica in build: 84 serie su 11 distretti — identico allo STOR a mano. `const D` è top-level: il calcolo è vivo a ogni caricamento, non incorporato.
- **STOR.__tot** ora esiste (84): la frase «totale … serie» dell'analisi programmazione mostra il valore vero (prima stampava 0). Guardia `__tot` nel loop distretti dell'analisi, in place, niente `!important`, niente blocchi nuovi.
- Etichetta sotto la ciambella: «Fette e legenda sono calcolate dal programma attivo e dal catalogo normalizzato: niente fette scritte a mano».
- Backup pre-modifica: `backup/Barbell-Diva-v31-nomi-puliti.pre-faseD.html`. Generatore: `faseD-apply.py` (assert sui conteggi; se un assert cade non scrive).
- **Collaudo**: node --check ok sul blocco modificato; jsdom: 232 voci, 11 fette, totale 84, zero errori JS; Chrome/puppeteer: legenda e gradiente corretti, totale 84. I 2 ERR_FILE_NOT_FOUND compaiono IDENTICI nella copia pre-modifica: preesistenti (risorse esterne al file, come il font), non introdotti dalla Fase D. Cambio tema verificato: tasto «Chiaro» e poi html e body a data-theme light. Chip del logbook nel campione automatico non conclusivi (righe campionate: 0, chip distinti visti: 23): da uno sguardo umano.
- Residuo: nessuno bloccante della Fase D; il catalogo del telefono (587 del payload) resta fuori perimetro.



### 31/10/2026 (ore ~02:00) — Banner di benvenuto + Diva Bot nella Dashboard (solo aggiunta)
- Richiesta di Alice: la dashboard era «triste»; anteprima generata (gpt-image-2 sul suo screenshot di riferimento), approvata. Vincolo di Alice: **solo AGGIUNGERE** banner Buonasera + robottina con fumetto; tutto il resto della dashboard invariato.
- Backup: `backup/Barbell-Diva-v31-nomi-puliti.pre-banner.html`.
- Aggiunto (dopo `<div class="ck">`, prima dell'intestazione esistente): banner sfumato rosa→viola con etichetta fase/settimana, «Buonasera, Alice!», riga «Oggi: C — Addominali, Spalle, Femorali, Dorsali, Centro schiena, Bicipiti», «Recupero: stabile» in verde e pulsante **Inizia allenamento**; sotto, card con la robottina (SVG Diva Bot originale riusato, faccia happy, animazione dvBob) e fumetto **COACH AI** «Sei pronta, Alice!». CSS in un blocco nuovo `db-hero-css` (solo variabili esistenti del tema, niente !important, niente toppe).
- Funziona davvero: Inizia allenamento → vista Programma 1 + **Scheda C attiva**; click sulla robottina (o Invio/Spazio) → apre il consiglio del Diva Bot flottante esistente.
- Collaudo: jsdom 9/9 (hero, testi, robot, fumetto, ciambella 84/11 fette, BD_LB_EXCAT 232, click robottina→Diva Bot, 0 errori JS); Chrome: errori console **identici al backup** (2 noti Cloudflare + 2 path malformati PREESISTENTI che compaiono attivando Programma 1, presenti anche nel backup); tema chiaro e scuro verificati; screenshot in `verifica/banner-scuro.png` e `verifica/banner-chiaro.png`.
- Difetti preesistenti confermati (NON introdotti ora): nastro mostra markup grezzo (riga ~5840: `textContent` usato con stringa HTML — «35 esercizi · ultima seduta <span…»), e il fumetto iniziale del Diva Bot flottante copre in parte la card Ciclo mestruale. Da eventuali prossimi giri.


### 31/10/2026 (ore ~02:10) — Banner rimosso, Diva Bot resta con frase a ogni avvio
- Alice: il banner sfumato (Buonasera/Oggi/Recupero/Inizia allenamento) era **fuorviante** per l'app PC coach (andrà bene per l'APK telefono): rimosso del tutto. La robottina con il fumetto COACH AI **resta**.
- A ogni avvio del mockup la robottina mostra una frase motivazionale random: le **20 frasi vere di Barbell Diva** (DIVA_QUOTES in `src/app-main.js` del repo Coaching-App), copiate verbatim. Sotto la frase: «Buonasera, Alice! Ogni volta che apri l'app, Diva Bot sceglie una frase per te.»
- CSS pulito: riscritto il blocco `db-hero-css` senza le regole del banner (niente regole morte). JS: via il gestore del pulsante Inizia allenamento (il pulsante è nel banner rimosso), resta il click/Invio sulla robottina che apre il consiglio del Diva Bot flottante.
- Backup pre-modifica: `backup/Barbell-Diva-v31-nomi-puliti.pre-banner.html` (contiene anche il banner, per ritornare indietro).
- Collaudo: jsdom 9/9 (banner assente, robottina e fumetto presenti, frase ∈ elenco, ciambella 84/11, 232 voci, click→Diva Bot, 0 errori); Chrome: frase random mostrata, tema chiaro OK, errori console solo i 2 preesistenti (path SVG, confermati nel backup). Foto: `verifica/diva-frase-scuro.png`, `verifica/diva-frase-chiaro.png`.


### 31/10/2026 (ore ~02:25) — Splash screen di avvio nel mockup
- Alice: all'avvio dell'app (PC e telefono) deve comparire la splash di Barbell Diva — mancava nel mockup. Aggiunta.
- Copia **verbatim** dall'app vera: HTML da `index.html` riga 70 (`#premiumSplash`, monogramma BD, BARBELL DIVA, «Lift. Slay. Repeat.», «Loading your empire…», barra `premium-loader`), CSS da `coach-studio-inline.css` (glassmorphism su sfondo radiale #120c1a con alone rosa/viola) — le variabili --motion/--radius/--shadow sostituite con i loro valori reali (il mockup non le definisce).
- Chiusura come in `finishPremiumBoot`: dopo ~1,4 s la splash prende `is-hidden` e svanisce; a ogni avvio ricompare (nessun «già vista» memorizzato).
- Nota: il primo inserimento era finito nel commento d'intestazione (lì `<body>` compare come testo); riposizionato dopo `<body data-theme="dark">`.
- Collaudo: jsdom 7/7 (presenza, testi verbatim, BD, loader, frase robottina, ciambella 84, scomparsa dopo, 0 errori JS).


### 31/10/2026 (ore ~13:20) — Mockup telefono v0.2: fase 1, coda di sincronizzazione
- Alice ha caricato `mockup-telefono.html` (v0.1, 18 telefoni, tema scuro/chiaro con pulsante in alto): riferimento fedele per l'aspetto della versione telefono, da NON ricreare da zero. Salvato in `docs/mockup-genspark/telefono/`, backup originale in `backup/mockup-telefono.v0.1-originale.html`.
- Inventario vs specifica: barra inferiore 5 voci OK; Workout solo Schede+Logbook (ultime 5 sedute, cestino; Progressione solo PC) OK; Alimentazione calorie/macro/TDEE-obiettivo/pasti/integratori/quiz OK; Corpo solo Peso e Misure (circonferenze+pliche) OK; Altro con sincronizzazione, Salute, I miei dati, Notifiche, Check-in, Questionario, Anamnesi, Backup OK; nessuna parte coach OK; Diva Bot figura intera grande in Dashboard e piccola altrove, 5 espressioni con fumetti, festeggia a fine allenamento OK.
- FASE 1 completata (requisito imperativo): coda di sincronizzazione VERA. Tutti i bottoni di salvataggio (sonno, peso, circonferenze, pliche, quiz dopo mangiato, check-in, questionario, anamnesi, salva allenamento, passi) accodano una voce {tipo, dettaglio, data}. La card «Sincronizzazione con il PC» in Altro mostra contatore live, elenco voci in coda e «Sincronizza ora» che simula l'invio e svuota; badge rosa sul cloud in ogni barra alta; toast di conferma. La coda resta nel telefono (localStorage con fallback in memoria se lo storage non è disponibile): dopo una ricarica le voci ci sono ancora e partono alla prossima sincronizzazione, senza perdersi.
- Collaudo: jsdom 14/14 (nav 5 voci, nessuna parte coach, coda 0→1→sync→0, persistenza al riavvio, 0 errori JS); Chrome reale: coda iniziale 0 / dopo salva 1 / dopo ricarica 1 / dopo sync 0. Foto in `verifica/telefono-avvio.png` e `telefono-coda.png`.
- Nota di percorso: il primo script applicatore aveva un helper che cancellava le stringhe invece di sostituirle (file corrotto); ripristinato dal backup e riapplicato con script corretto.
- Prossime fasi proposte: 2) campi modificabili veri (peso, sonno, misure) che accodano i valori reali; 3) integratori configurabili (elenco editabile, toggle che accodano); 4) festeggia fine allenamento collegato al flusso di salvataggio; 5) dati smartwatch (sonno e passi) in coda automatica.
