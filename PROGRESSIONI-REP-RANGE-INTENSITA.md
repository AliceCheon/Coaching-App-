# Progressioni aggiuntive: rep range e intensità

## Cosa è stato aggiunto

Nel generatore di progressioni di Barbell Diva sono stati aggiunti tre template:

1. **Rep range · step progressivo** (`rep-range-progression`) — avanza dal minimo al massimo del range già assegnato. Serie, carico e RIR restano quelli della prescrizione; il carico non viene calcolato automaticamente.
2. **Ondulata · range basso/medio/alto** (`undulating-reps`) — alterna i target ripetizioni configurabili. I valori iniziali 12/8/10 sono un esempio editabile, non una prescrizione individuale; serie/RIR restano invariati.
3. **Intensificazione · blocchi di rep range** (`intensification-wave`) — cambia range ogni due settimane, con esempio iniziale 10–12, 8–10, 6–8. I range sono configurabili; non vengono inventati kg, percentuali di 1RM o RIR.

Restano disponibili anche i tre template inseriti in precedenza: doppia progressione, progressione tecnica e accumulo di volume ispirati agli appunti Excel.

## Come interpretare la ricerca

- L'umbrella review ACSM 2026 sintetizza 137 review e oltre 30.000 partecipanti. Riporta un vantaggio dei carichi più alti per la forza massimale, più volume (circa 10 serie/settimana per gruppo muscolare) per l'ipertrofia e nessun effetto coerente della periodizzazione su tutti gli esiti. Non prescrive una singola “zona magica” di ripetizioni per tutti.
- La meta-analisi di Moesgaard et al. (2022), con volume equato, trova un vantaggio modesto della periodizzazione rispetto alla non periodizzazione per 1RM e dell'ondulata rispetto alla lineare per 1RM; il vantaggio UP si concentra nel sottogruppo allenato. Per l'ipertrofia non trova differenze fra lineare e ondulata.
- La review di Grgic et al. (2022) non trova che arrivare al cedimento sia necessario per forza o ipertrofia nel complesso. Perciò il passaggio a range più bassi non è associato automaticamente a cedimento o RIR inventati.
- La network meta-analysis sull'autoregolazione considera RPE/RIR, APRE e velocity-based training in atleti; il campione complessivo è limitato. È una ragione per offrire autoregolazione come opzione, non per dichiarare una modalità universalmente superiore.

La progressione rep-range e le sequenze iniziali sono **strumenti di programmazione del coach**, non risultati diretti di trial che dimostrino l'ottimalità di quei precisi step o range. Prima di assegnarli vanno considerati obiettivo, scheda originale, logbook, esperienza, tecnica, attrezzatura e volume settimanale complessivo. Nessuna prescrizione preesistente viene riscritta automaticamente.

## Fonti consultate

- Currier et al., *American College of Sports Medicine Position Stand. Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults* (2026), overview disponibile su PMC: <https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/>
- Moesgaard et al. (2022), *Effects of Periodization on Strength and Muscle Hypertrophy in Volume-Equated Resistance Training Programs: A Systematic Review and Meta-analysis*: <https://pubmed.ncbi.nlm.nih.gov/35044672/>
- Grgic et al. (2022), *Effects of resistance training performed to repetition failure or non-failure on muscular strength and hypertrophy: A systematic review and meta-analysis*: <https://pubmed.ncbi.nlm.nih.gov/33497853/>
- Huang et al. (2025), *Autoregulated resistance training for maximal strength enhancement: A systematic review and network meta-analysis*: <https://www.sciencedirect.com/science/article/pii/S1728869X25000590>
- Plotkin et al. (2022), *Progression of volume load and muscle hypertrophy: a systematic review*: <https://pubmed.ncbi.nlm.nih.gov/36199287/>

## Verifiche e applicazione

Test mirati eseguiti: `node --test tests/phase6-progressions.test.mjs tests/programming-engine-phase20a.test.mjs tests/bprogram2-original-source.test.mjs tests/v14753-progression-schemes.test.mjs tests/reported-focus-rir-regressions.test.mjs`.

Quando si applica lo ZIP, estrarre preservando le cartelle e sostituire/aggiungere i soli file inclusi, quindi caricarli nella root del repository GitHub. Lo ZIP non contiene la directory `.git`, credenziali o dipendenze `node_modules`.
