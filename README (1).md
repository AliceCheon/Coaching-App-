# Fase 24 — Coach AI 3.0 Intelligent Programming

Build: `v131-phase24.0-coach-ai3`  
Schema dati: `10`  
Motore: `coach-ai3-programming.js` 3.0.0

## Architettura

Coach AI 3.0 non sostituisce il Decision Engine della Fase 23: lo usa come fonte deterministica. Il flusso è:

1. Knowledge Graph raccoglie programma, storico, profilo atleta, strategia e Master Exercise Library.
2. Decision Engine produce metriche, score, regole applicate, confidenza e traccia decisionale.
3. Coach AI 3.0 trasforma le decisioni applicabili in proposte operative.
4. Ogni proposta espone tre strategie: conservativa, bilanciata e aggressiva.
5. La simulazione lavora su una copia isolata dello stato e ricalcola il Decision Engine.
6. Solo il pulsante **Applica questa modifica** scrive nel programma reale.

## Revisione del programma

La pagina Coach AI mostra:

- Program Score e completezza;
- volume settimanale e copertura delle progressioni;
- stato della fatica/deload;
- problemi di ordine, ridondanza, recupero e volume;
- andamento reale dei singoli esercizi;
- dati usati, regole applicate, priorità e confidenza.

Le informazioni mancanti restano visibili e non vengono inventate.

## Proposte intelligenti

Le operazioni supportate dal motore includono:

- revisione di recupero, RIR e numero di serie;
- collegamento di una progressione;
- incremento mirato del volume per una priorità;
- riordino degli esercizi;
- sostituzione tramite record compatibili della Master Exercise Library.

Le sostituzioni vengono ordinate per muscolo principale, pattern, attrezzatura disponibile, relazioni tra esercizi, stabilità e richiesta sistemica. Le limitazioni dichiarate sono considerate come contesto prudenziale; il sistema non formula diagnosi.

## Simulazione prima/dopo

Prima dell'applicazione vengono mostrati:

- Program Score prima/dopo;
- serie settimanali prima/dopo;
- distribuzione del volume muscolare modificata;
- frequenza prima/dopo;
- indicatore di fatica sistemica;
- numero e tipo esatto delle operazioni;
- vantaggi, limiti, dati e regole della strategia scelta.

La simulazione usa una copia dello stato: non modifica il programma, il Logbook o le progressioni salvate.

## Applicazione, protezioni e annullamento

- L'applicazione è possibile soltanto dopo la simulazione e una conferma esplicita.
- Viene applicata esclusivamente l'opzione selezionata.
- Prima della scrittura viene confrontata l'impronta del programma: se nel frattempo è cambiato, l'applicazione viene bloccata.
- L'annullamento è consentito soltanto se non esistono modifiche successive, per evitare di sovrascrivere lavoro più recente.
- Il programma precedente viene ripristinato integralmente tramite il repository canonico.

## Storico decisioni

Lo schema 10 aggiunge `coachAi3.history`. Ogni interazione registra:

- proposta e opzione;
- programma e impronta di partenza;
- stato `suggested`, `accepted`, `rejected` o `undone`;
- data di proposta e delle successive decisioni;
- impronta successiva per l'annullamento protetto.

Lo storico viene incluso nei normali salvataggi, sincronizzazione ed export dati.

## Verifiche eseguite

- parsing del modulo e del JavaScript inline;
- generazione di tre opzioni operative per proposta;
- assenza di mutazioni durante analisi e simulazione;
- conservazione della forma canonica dei recuperi (`rest.seconds`);
- patch limitata al solo esercizio bersaglio;
- confronto score, volume, fatica, frequenza e muscoli;
- stati completi dello storico;
- integrazione build/schema/cache PWA;
- apertura reale della pagina Coach AI nel browser;
- rendering reale di 7 proposte sul programma corrente;
- apertura reale della simulazione e verifica dei controlli di conferma.

Test automatici Fase 24: **5/5 superati**.

## Limiti dichiarati

- Il Coach AI opera solo sui dati presenti; incompletezza della Master Library o del profilo riduce la precisione.
- Il Program Score è un supporto decisionale, non una valutazione medica o una garanzia di risultato.
- L'annullamento automatico viene bloccato dopo modifiche successive intenzionalmente.
- Le proposte non sostituiscono il giudizio del coach: restano sempre facoltative.

