# Changelog — Fase 19.2

Build `v114-phase19.2`, schema dati `5` invariato, cache `atlas-app-v114-phase19.2`.

- I test DOM sono ora isolati: non leggono né scrivono il journal della sessione attiva e non chiamano il salvataggio reale dell'app.
- Il ripristino completo o della sola sezione Logbook unisce le sedute esistenti e quelle del backup; non sostituisce più lo storico corrente con quello di un backup più vecchio.
- L'esportazione scarica sempre il backup verificato anche quando lo spazio locale non permette di conservarne una copia aggiuntiva nella cronologia interna.
- Il recupero dal journal durevole riapplica la correzione della Scheda F al 16/07/2026 dopo il caricamento asincrono.
- La marcatura del backup pre-aggiornamento viene registrata soltanto se la copia è stata realmente salvata.
- Aggiunto `Avvia-Barbell-Diva.cmd`, che mantiene l'origine stabile `http://127.0.0.1:8767` e impedisce la falsa perdita di dati causata dall'apertura diretta di versioni diverse con `file://`.

Il backup del 17/07/2026 fornito da Alice contiene 36 sedute e quattro Schede F storiche, fino al 24/06/2026. Non contiene la Scheda F completa del 16/07/2026; per recuperarla integralmente occorre un'esportazione dal dispositivo che la conserva.
