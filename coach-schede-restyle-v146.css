/* ============================================================================
   Barbell Diva — v146.2 · Restyle Editor Schede (match immagine di riferimento)
   Layout: header giorno con "Giorno N" + nome + pencil + pill durata,
   colonne fisse [Esercizio, Tipo, Serie, Rip/Tempo, Rec, Peso, RPE, RIR, TUT, Note],
   footer con "+ Esercizio" e "+ Circuito", toggle colonne avanzate.
   Palette Barbell Diva invariata (pink/purple/lavender/surface).
   ========================================================================= */

/* -----------------------------------------------------------
   1. HEADER TOOLBAR: nascondi elementi non presenti nell'immagine
   ----------------------------------------------------------- */
.coach-editor-weekly .coach-program-assignment {
  display: none !important;
}

.coach-editor-weekly .coach-editor-toolbar {
  padding: 10px 16px;
  border-radius: 14px;
  background: transparent;
  border: 0;
  box-shadow: none;
  gap: 12px;
}

.coach-editor-weekly .coach-editor-save-state {
  gap: 8px;
}
.coach-editor-weekly .coach-editor-save-state .save-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #58dea1;
  box-shadow: 0 0 0 4px rgba(88, 222, 161, .18);
}
.coach-editor-weekly .coach-editor-save-state [data-coach-save-label] {
  font-size: .68rem;
  letter-spacing: .09em;
  text-transform: uppercase;
  color: var(--muted);
  font-weight: 900;
}

/* Strumenti settimana — pill compatti + area toggle avanzate */
.coach-editor-weekly .coach-week-tools {
  border-radius: 14px;
  padding: 8px 12px;
  border-color: color-mix(in srgb, var(--purple-primary) 22%, transparent);
  background: color-mix(in srgb, var(--surface-raised) 60%, transparent);
  align-items: center;
}
.coach-editor-weekly .coach-week-tools > span {
  color: var(--pink-soft);
  font-weight: 900;
  letter-spacing: .09em;
  font-size: .68rem;
}
.coach-editor-weekly .coach-week-tools button {
  min-height: 30px;
  padding: 5px 12px;
  border-radius: 999px;
  font-weight: 800;
  font-size: .72rem;
}
.coach-editor-weekly .coach-week-tools button:hover:not(:disabled) {
  transform: translateY(-1px);
  background: color-mix(in srgb, var(--pink-primary) 20%, var(--surface));
  border-color: var(--pink-primary);
}

/* Toggle "Colonne avanzate" iniettato via JS */
.schede-v146-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--purple-primary) 28%, transparent);
  background: color-mix(in srgb, var(--surface-raised) 70%, transparent);
  color: var(--text);
  font-size: .7rem;
  font-weight: 800;
  cursor: pointer;
  user-select: none;
  transition: all 140ms ease;
}
.schede-v146-toggle:hover {
  border-color: var(--pink-primary);
  background: color-mix(in srgb, var(--pink-primary) 12%, var(--surface));
}
.schede-v146-toggle input {
  appearance: none;
  width: 30px;
  height: 16px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--purple-primary) 30%, transparent);
  position: relative;
  cursor: pointer;
  transition: background 160ms ease;
  margin: 0;
}
.schede-v146-toggle input::before {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: #fff;
  transition: transform 160ms ease;
}
.schede-v146-toggle input:checked {
  background: linear-gradient(135deg, var(--pink-primary), var(--purple-primary));
}
.schede-v146-toggle input:checked::before {
  transform: translateX(14px);
}

/* Quando le colonne avanzate sono nascoste */
body.schede-hide-advanced .coach-editor-weekly col.col-rpe,
body.schede-hide-advanced .coach-editor-weekly col.col-rir,
body.schede-hide-advanced .coach-editor-weekly col.col-tut,
body.schede-hide-advanced .coach-editor-weekly thead th.col-header-rpe,
body.schede-hide-advanced .coach-editor-weekly thead th.col-header-rir,
body.schede-hide-advanced .coach-editor-weekly thead th.col-header-tut,
body.schede-hide-advanced .coach-editor-weekly .coach-inline-exercise td.col-cell-rpe,
body.schede-hide-advanced .coach-editor-weekly .coach-inline-exercise td.col-cell-rir,
body.schede-hide-advanced .coach-editor-weekly .coach-inline-exercise td.col-cell-tut {
  display: none !important;
}

/* -----------------------------------------------------------
   2. WEEK TABS
   ----------------------------------------------------------- */
.coach-editor-weekly .coach-program-week-tabs {
  border-radius: 14px;
  padding: 4px;
  gap: 2px;
  background: color-mix(in srgb, var(--surface-raised) 60%, var(--surface));
  border-color: color-mix(in srgb, var(--purple-primary) 18%, transparent);
}
.coach-editor-weekly .coach-program-week-tabs button {
  flex: 1 0 auto;
  min-width: 130px;
  padding: 10px 14px;
  border-radius: 10px;
  border-bottom: 0 !important;
}
.coach-editor-weekly .coach-program-week-tabs button:hover:not(.active) {
  background: color-mix(in srgb, var(--purple-primary) 10%, transparent);
  color: var(--text);
}
.coach-editor-weekly .coach-program-week-tabs button.active {
  background: linear-gradient(135deg, var(--pink-primary), var(--purple-primary)) !important;
  color: #fff !important;
  box-shadow: 0 6px 18px rgba(255, 79, 163, .28);
}
.coach-editor-weekly .coach-program-week-tabs button.active strong,
.coach-editor-weekly .coach-program-week-tabs button.active span {
  color: #fff !important;
}
.coach-editor-weekly .coach-program-week-tabs button strong { font-size: .82rem; font-weight: 900; }
.coach-editor-weekly .coach-program-week-tabs button span {
  font-size: .62rem;
  letter-spacing: .06em;
  text-transform: uppercase;
  opacity: .82;
}

/* -----------------------------------------------------------
   3. BOARD HEAD "Settimana N — X giorni" + controlli
   ----------------------------------------------------------- */
.coach-editor-weekly .coach-program-board-head {
  padding: 8px 4px 0;
  align-items: baseline;
  gap: 16px;
}
.coach-editor-weekly .coach-program-board-head h2 {
  font-size: clamp(1.5rem, 2vw, 2rem) !important;
  letter-spacing: -.02em;
  font-weight: 900;
}
.coach-editor-weekly .coach-program-board-head > div:first-child span {
  color: var(--muted);
  font-weight: 700;
  font-size: .82rem;
}
.coach-editor-weekly .coach-board-controls button {
  min-height: 34px;
  padding: 7px 14px;
  border-radius: 10px;
  font-size: .74rem;
  font-weight: 800;
  border: 1px solid color-mix(in srgb, var(--purple-primary) 26%, transparent);
  background: color-mix(in srgb, var(--surface-raised) 76%, transparent);
  color: var(--text);
}
.coach-editor-weekly .coach-board-controls button:hover {
  transform: translateY(-1px);
  border-color: var(--pink-primary);
  background: color-mix(in srgb, var(--pink-primary) 14%, var(--surface));
}
/* Nascondo Apri tutte / Chiudi tutte per uniformare con l'immagine */
.coach-editor-weekly .coach-board-controls [data-days-expand-all],
.coach-editor-weekly .coach-board-controls [data-days-collapse-all] {
  display: none !important;
}

/* -----------------------------------------------------------
   4. DAY CARD (Giorno N — Lower)
   ----------------------------------------------------------- */
.coach-editor-weekly .coach-program-day {
  border-radius: 18px;
  border-color: color-mix(in srgb, var(--purple-primary) 20%, transparent);
  background: var(--surface);
  transition: border-color 200ms ease, box-shadow 200ms ease;
  overflow: hidden;
}
.coach-editor-weekly .coach-program-day:hover {
  border-color: color-mix(in srgb, var(--pink-primary) 40%, var(--border));
  box-shadow: 0 10px 28px rgba(255, 79, 163, .08);
}
.coach-editor-weekly .coach-program-day > header {
  padding: 14px 22px !important;
  min-height: unset !important;
  background: transparent;
  border-bottom: 1px solid color-mix(in srgb, var(--purple-primary) 14%, transparent);
}
.coach-editor-weekly .coach-day-chevron { display: none !important; }
.coach-editor-weekly .coach-day-toggle { padding: 0 !important; min-width: 0 !important; }
.coach-editor-weekly .coach-day-title {
  display: flex !important;
  align-items: center !important;
  flex-wrap: wrap !important;
  gap: 6px 12px !important;
}
.coach-editor-weekly .coach-day-title em {
  order: 1;
  color: var(--muted) !important;
  font-size: .95rem !important;
  font-weight: 700 !important;
  letter-spacing: -.005em;
  text-transform: none !important;
}
.coach-editor-weekly .coach-day-title strong {
  order: 2;
  font-size: 1rem !important;
  font-weight: 900;
  color: var(--text);
}
.coach-editor-weekly .coach-day-title small {
  display: none !important;   /* nascondo il testo lungo, lo trasformo in pill via JS */
}
/* Pencil edit button iniettato via JS accanto al nome */
.schede-v146-name-edit {
  order: 3;
  margin-left: -6px;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  display: inline-grid;
  place-items: center;
  border-radius: 6px;
  font-size: .82rem;
  transition: color 140ms ease, background 140ms ease;
}
.schede-v146-name-edit:hover {
  color: var(--pink-primary);
  background: color-mix(in srgb, var(--pink-primary) 14%, transparent);
}
/* Pill durata iniettato via JS */
.schede-v146-duration-pill {
  order: 4;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--purple-primary) 22%, transparent);
  color: var(--lavender);
  font-size: .68rem;
  font-weight: 800;
  letter-spacing: .02em;
  border: 1px solid color-mix(in srgb, var(--purple-primary) 30%, transparent);
}
.schede-v146-duration-pill::before {
  content: "⏱";
  font-size: .82rem;
  opacity: .85;
}

/* Day actions (right side) — icone quadrate copia / export / cestino */
.coach-editor-weekly .coach-day-actions {
  gap: 4px !important;
  flex-wrap: nowrap !important;
}
.coach-editor-weekly .coach-day-actions > button {
  width: 34px !important;
  min-width: 34px !important;
  height: 34px !important;
  min-height: 34px !important;
  padding: 0 !important;
  border-radius: 9px !important;
  border: 1px solid color-mix(in srgb, var(--purple-primary) 22%, transparent) !important;
  background: color-mix(in srgb, var(--surface-raised) 70%, transparent) !important;
  color: var(--text) !important;
  font-size: 0 !important;                 /* nasconde il testo dopo l'emoji */
  display: grid !important;
  place-items: center;
  transition: all 140ms ease;
  overflow: hidden;
}
.coach-editor-weekly .coach-day-actions > button::first-letter {
  font-size: .95rem !important;
}
.coach-editor-weekly .coach-day-actions summary {
  min-width: 42px !important;
  height: 34px !important;
  min-height: 34px !important;
  padding: 0 12px !important;
  border-radius: 9px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 140ms ease;
  white-space: nowrap;
}
.coach-editor-weekly .coach-day-actions > button:hover {
  transform: translateY(-1px);
  border-color: var(--pink-primary) !important;
  background: color-mix(in srgb, var(--pink-primary) 14%, var(--surface)) !important;
  color: #fff !important;
}
.coach-editor-weekly .coach-day-actions summary:hover {
  transform: translateY(-1px);
  filter: brightness(1.1);
}
/* Nascondo "Nome e info" testuale e "Sposta prima/dopo" perché ridondanti */
.coach-editor-weekly .coach-day-actions [data-sheet-action="edit"],
.coach-editor-weekly .coach-day-actions [data-sheet-action="left"],
.coach-editor-weekly .coach-day-actions [data-sheet-action="right"] {
  display: none !important;
}
.coach-editor-weekly .coach-day-actions .danger-button {
  color: color-mix(in srgb, #ff6e7d 90%, #fff) !important;
  border-color: color-mix(in srgb, #ff6e7d 32%, transparent) !important;
}
.coach-editor-weekly .coach-day-actions .danger-button:hover {
  background: color-mix(in srgb, #ff6e7d 22%, var(--surface)) !important;
  border-color: #ff6e7d !important;
  color: #fff !important;
}
.coach-editor-weekly .coach-add-menu summary {
  border-radius: 9px !important;
  background: linear-gradient(135deg, var(--pink-primary), var(--purple-primary)) !important;
  color: #fff !important;
  border: 0 !important;
  font-size: .82rem !important;
  font-weight: 900 !important;
  box-shadow: 0 6px 16px rgba(255, 79, 163, .28);
}

/* -----------------------------------------------------------
   5. TABLE — compatta, width 100%, no scroll orizzontale
   ----------------------------------------------------------- */
.coach-editor-weekly .coach-program-day-table {
  padding: 0 !important;
  border-radius: 0;
  overflow: hidden !important;  /* nessuno scroll orizzontale */
  width: 100%;
  max-width: 100%;
}
.coach-editor-weekly .coach-program-day-table table {
  border-collapse: separate !important;
  border-spacing: 0;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;        /* annulla i 1180px del CSS originale */
  table-layout: fixed !important;
}

/* Larghezze colonne fisse: numeriche strette, Esercizio ancorato */
.coach-editor-weekly col.col-exercise { width: 260px !important; }
.coach-editor-weekly col.col-type     { width: 96px !important; }
.coach-editor-weekly col.col-sets     { width: 46px !important; }
.coach-editor-weekly col.col-reps     { width: 62px !important; }
.coach-editor-weekly col.col-rest     { width: 56px !important; }
.coach-editor-weekly col.col-load     { width: 82px !important; }
.coach-editor-weekly col.col-rpe      { width: 42px !important; }
.coach-editor-weekly col.col-rir      { width: 42px !important; }
.coach-editor-weekly col.col-tut      { width: 62px !important; }
.coach-editor-weekly col.col-notes    { width: auto !important; min-width: 130px !important; }
.coach-editor-weekly col.col-actions  { width: 160px !important; }

/* Padding compatto — header font ridotto per risparmiare spazio verticale */
.coach-editor-weekly .coach-program-day-table thead th {
  position: sticky;
  top: 0;
  z-index: 3;
  padding: 7px 4px !important;
  background: transparent !important;
  color: var(--muted) !important;
  font-size: 9px !important;
  font-weight: 900 !important;
  letter-spacing: .06em;
  text-transform: uppercase;
  border-bottom: 1px solid color-mix(in srgb, var(--purple-primary) 20%, transparent) !important;
  white-space: nowrap;
}
.coach-editor-weekly .coach-program-day-table thead th:first-child { padding-left: 16px !important; }
.coach-editor-weekly .coach-program-day-table thead th:last-child { padding-right: 16px !important; text-align: right; }

.coach-editor-weekly .coach-inline-exercise td {
  padding: 4px 4px !important;
  vertical-align: middle !important;
  border-bottom: 1px solid color-mix(in srgb, var(--purple-primary) 10%, transparent) !important;
  background: transparent;
  transition: background 140ms ease;
  overflow: hidden;
}
.coach-editor-weekly .coach-inline-exercise td:first-child { padding-left: 16px !important; min-width: 0 !important; }
.coach-editor-weekly .coach-inline-exercise td:last-child { padding-right: 16px !important; }
.coach-editor-weekly .coach-inline-exercise:hover td {
  background: color-mix(in srgb, var(--pink-primary) 5%, transparent);
}
.coach-editor-weekly .coach-inline-exercise:last-child td { border-bottom: 0 !important; }

/* Righe zebra: pattern alternato leggero per leggibilità */
.coach-editor-weekly .coach-inline-exercise:nth-child(even) td {
  background: color-mix(in srgb, var(--purple-primary) 4%, transparent);
}
.coach-editor-weekly .coach-inline-exercise:nth-child(even):hover td {
  background: color-mix(in srgb, var(--pink-primary) 8%, transparent);
}

/* Save check: pulsazione verde per 1.2s dopo il blur di un input */
@keyframes schedeSaveCheck {
  0%   { box-shadow: 0 0 0 0 rgba(88, 222, 161, 0);   border-color: color-mix(in srgb, var(--purple-primary) 20%, transparent); }
  25%  { box-shadow: 0 0 0 2px rgba(88, 222, 161, .5); border-color: #58dea1; }
  100% { box-shadow: 0 0 0 0 rgba(88, 222, 161, 0);   border-color: color-mix(in srgb, var(--purple-primary) 20%, transparent); }
}
.coach-editor-weekly .coach-inline-exercise input.schede-just-saved,
.coach-editor-weekly .coach-inline-exercise select.schede-just-saved {
  animation: schedeSaveCheck 1.2s ease-out;
}
.coach-editor-weekly .coach-inline-exercise td.schede-cell-saved {
  position: relative;
}
.coach-editor-weekly .coach-inline-exercise td.schede-cell-saved::after {
  content: "✓";
  position: absolute;
  top: 2px;
  right: 3px;
  width: 12px;
  height: 12px;
  display: grid;
  place-items: center;
  color: #58dea1;
  font-size: 10px;
  font-weight: 900;
  animation: schedeSaveTickFade 1.2s ease-out forwards;
  pointer-events: none;
  z-index: 2;
}
@keyframes schedeSaveTickFade {
  0%   { opacity: 0; transform: scale(.6); }
  30%  { opacity: 1; transform: scale(1.15); }
  100% { opacity: 0; transform: scale(1); }
}

/* Program list — cards cliccabili (universale) */
.schede-card-clickable {
  cursor: pointer !important;
  transition: transform 140ms ease, border-color 140ms ease, background 140ms ease, box-shadow 140ms ease;
}
.schede-card-clickable:hover {
  transform: translateY(-1px);
  border-color: var(--pink-primary) !important;
  background: color-mix(in srgb, var(--pink-primary) 6%, var(--surface)) !important;
  box-shadow: 0 6px 22px rgba(255, 79, 163, .18);
}

/* Input molto compatti — numerici come mini box */
.coach-editor-weekly .coach-inline-exercise input,
.coach-editor-weekly .coach-inline-exercise select {
  min-height: 26px !important;
  padding: 3px 5px !important;
  border-radius: 6px !important;
  border: 1px solid color-mix(in srgb, var(--purple-primary) 20%, transparent) !important;
  background: color-mix(in srgb, var(--surface-raised) 60%, var(--surface)) !important;
  color: var(--text) !important;
  font-size: 11px !important;
  transition: border-color 140ms ease, box-shadow 140ms ease, background 140ms ease;
  min-width: 0 !important;
  width: 100% !important;
  box-sizing: border-box !important;
  text-align: center;
}
/* Rip/Tempo, Peso e Note allineati a sinistra */
.coach-editor-weekly .coach-inline-exercise td[data-label="Rip/tempo"] input,
.coach-editor-weekly .coach-inline-exercise td[data-label="Note"] input,
.coach-editor-weekly .coach-inline-exercise td[data-label="TUT"] input {
  text-align: left;
}
.coach-editor-weekly .coach-inline-exercise input:hover,
.coach-editor-weekly .coach-inline-exercise select:hover {
  border-color: color-mix(in srgb, var(--pink-primary) 35%, transparent) !important;
}
.coach-editor-weekly .coach-inline-exercise input:focus,
.coach-editor-weekly .coach-inline-exercise select:focus {
  outline: none !important;
  border-color: var(--pink-primary) !important;
  background: color-mix(in srgb, var(--pink-primary) 10%, var(--surface)) !important;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--pink-primary) 22%, transparent) !important;
}

/* -----------------------------------------------------------
   6. Cell "Esercizio" — drag + set-link + letter + name
   ----------------------------------------------------------- */
.coach-editor-weekly .coach-inline-name {
  grid-template-columns: 18px 18px 22px minmax(0, 1fr) !important;
  align-items: center;
  gap: 3px !important;
}
.coach-editor-weekly .coach-inline-name .coach-exercise-title {
  min-width: 0;
  overflow: hidden;
}
.coach-editor-weekly .drag-handle {
  color: color-mix(in srgb, var(--muted) 70%, transparent);
  font-size: 14px;
  width: 20px;
  height: 24px;
  padding: 0;
  display: grid;
  place-items: center;
  border-radius: 5px;
  transition: color 140ms ease, background 140ms ease;
}
.coach-editor-weekly .drag-handle:hover {
  color: var(--pink-soft);
  background: color-mix(in srgb, var(--pink-primary) 15%, transparent);
}
.coach-editor-weekly .set-link-button {
  width: 20px !important;
  height: 20px !important;
  min-width: unset !important;
  min-height: unset !important;
  border-radius: 5px !important;
  padding: 0 !important;
  background: color-mix(in srgb, var(--purple-primary) 12%, transparent) !important;
  border: 1px dashed color-mix(in srgb, var(--purple-primary) 35%, transparent) !important;
  color: var(--lavender) !important;
  font-size: .68rem !important;
}
.coach-editor-weekly .set-link-button:hover {
  background: color-mix(in srgb, var(--purple-primary) 30%, transparent) !important;
  color: #fff !important;
  border-style: solid !important;
}
.coach-editor-weekly .set-link-button.active {
  background: linear-gradient(135deg, var(--purple-primary), var(--pink-primary)) !important;
  color: #fff !important;
  border-color: transparent !important;
}
.coach-editor-weekly .program-exercise-letter {
  width: 20px !important;
  height: 20px !important;
  border-radius: 5px !important;
  background: transparent !important;
  color: var(--pink-primary) !important;
  font-size: .78rem !important;
  font-weight: 900 !important;
  margin: 0 !important;
  border: 0 !important;
  display: inline-grid !important;
  place-items: center;
}
.coach-editor-weekly .coach-inline-name .coach-exercise-name-text {
  font-size: .86rem !important;
  font-weight: 800 !important;
  color: var(--text);
  line-height: 1.2;
  padding: 2px 2px;
  transition: color 140ms ease;
  -webkit-line-clamp: 2;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.coach-editor-weekly .coach-inline-name .coach-exercise-name-text:hover {
  color: var(--pink-primary);
}
/* Nascondo il sub (muscolo/secondari) sotto il nome — non è nell'immagine */
.coach-editor-weekly .coach-inline-sub {
  display: flex !important;
  align-items: center;
  gap: 6px !important;
  margin: 2px 0 0 62px !important;
  padding: 0 !important;
  min-width: 0;
  color: #7b6778;
  font-size: .58rem !important;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
}
.coach-editor-weekly .coach-inline-sub strong {
  color: var(--purple-primary);
  font-size: .61rem;
  overflow: hidden;
  text-overflow: ellipsis;
}
.coach-editor-weekly .coach-inline-sub span {
  overflow: hidden;
  text-overflow: ellipsis;
}
.coach-editor-weekly .coach-inline-sub span::before {
  content: "Secondario: ";
  opacity: .72;
}

/* Load unit compact */
.coach-editor-weekly .coach-inline-load {
  grid-template-columns: minmax(0, 1fr) 30px !important;
  gap: 2px !important;
}
.coach-editor-weekly .coach-inline-load select {
  min-width: 0 !important;
  padding: 3px 1px !important;
  font-size: 10px !important;
  text-align: center;
}

/* Note cell — pill tratteggiata compatta */
.coach-editor-weekly .coach-inline-note {
  min-height: 32px !important;
  padding: 5px 8px !important;
  border: 1px dashed color-mix(in srgb, var(--purple-primary) 30%, transparent) !important;
  border-radius: 8px !important;
  color: var(--muted) !important;
  font-size: .68rem !important;
  gap: 4px !important;
  cursor: pointer;
  transition: all 140ms ease;
  background: transparent;
  overflow: hidden;
}
.coach-editor-weekly .coach-inline-note:hover {
  border-style: solid !important;
  border-color: var(--pink-primary) !important;
  background: color-mix(in srgb, var(--pink-primary) 8%, var(--surface)) !important;
  color: var(--text) !important;
}
.coach-editor-weekly .coach-inline-note span {
  color: var(--pink-primary);
  font-size: .78rem;
  flex-shrink: 0;
}
.coach-editor-weekly .coach-inline-note em {
  color: var(--text);
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.coach-editor-weekly .coach-inline-note.has-note {
  border-style: solid !important;
  border-color: color-mix(in srgb, var(--pink-primary) 50%, transparent) !important;
  background: color-mix(in srgb, var(--pink-primary) 8%, var(--surface)) !important;
  color: var(--text) !important;
}

/* -----------------------------------------------------------
   7. ACTIONS cell — icone quadrate uniformi, compatte
   ----------------------------------------------------------- */
.coach-editor-weekly .coach-inline-actions {
  gap: 3px !important;
  flex-wrap: nowrap !important;
  justify-content: flex-end !important;
}
.coach-editor-weekly .coach-row-action-icon {
  width: 14px;
  height: 14px;
  pointer-events: none;
}
.coach-editor-weekly .coach-inline-actions .progression-badge {
  color: var(--purple-primary) !important;
}
.coach-editor-weekly .coach-inline-actions .progression-badge::first-letter {
  color: inherit !important;
  font-size: inherit;
}
.coach-editor-weekly .coach-row-add-menu {
  position: relative;
  flex: 0 0 auto;
}
.coach-editor-weekly .coach-row-add-menu > summary {
  list-style: none;
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--purple-primary) 20%, transparent);
  border-radius: 5px;
  background: color-mix(in srgb, var(--surface-raised) 70%, transparent);
  color: var(--text);
  cursor: pointer;
}
.coach-editor-weekly .coach-row-add-menu > summary::-webkit-details-marker {
  display: none;
}
.coach-editor-weekly .coach-row-add-menu > summary:hover {
  border-color: var(--pink-primary);
  background: linear-gradient(135deg, var(--pink-primary), var(--purple-primary));
  color: #fff;
}
.coach-editor-weekly .coach-row-add-menu > div {
  position: absolute;
  z-index: 120;
  right: 0;
  top: 28px;
  width: 145px;
  display: none;
  gap: 2px;
  padding: 7px;
  border: 1px solid color-mix(in srgb, var(--purple-primary) 25%, var(--border));
  border-radius: 12px;
  background: var(--surface-raised);
  box-shadow: 0 18px 42px rgba(30,10,42,.24);
}
.coach-editor-weekly .coach-row-add-menu[open] > div,
.coach-editor-weekly .coach-row-add-menu:hover > div,
.coach-editor-weekly .coach-row-add-menu:focus-within > div {
  display: grid;
}
.coach-editor-weekly .coach-row-add-menu > div button {
  width: 100%;
  min-height: 32px;
  padding: 7px 9px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text);
  font-size: .7rem;
  font-weight: 750;
  text-align: left;
}
.coach-editor-weekly .coach-row-add-menu > div button:hover {
  background: color-mix(in srgb, var(--pink-primary) 13%, var(--surface));
  color: var(--pink-primary);
}
.coach-editor-weekly .coach-inline-exercise td:last-child {
  position: relative;
  overflow: visible !important;
}
.coach-editor-weekly .coach-inline-actions > button,
.coach-editor-weekly .coach-row-more > summary {
  width: 24px !important;
  min-width: 24px !important;
  height: 24px !important;
  min-height: 24px !important;
  padding: 0 !important;
  border-radius: 5px !important;
  border: 1px solid color-mix(in srgb, var(--purple-primary) 20%, transparent) !important;
  background: color-mix(in srgb, var(--surface-raised) 70%, transparent) !important;
  color: var(--text) !important;
  font-size: 11px !important;
  transition: all 140ms ease;
  display: grid !important;
  place-items: center;
}
.coach-editor-weekly .coach-inline-actions > button:hover,
.coach-editor-weekly .coach-row-more > summary:hover {
  transform: translateY(-1px);
  border-color: var(--pink-primary) !important;
  background: color-mix(in srgb, var(--pink-primary) 18%, var(--surface)) !important;
  color: #fff !important;
}
.coach-editor-weekly .coach-inline-actions .progression-badge {
  width: 24px !important;
  max-width: 24px !important;
  color: transparent !important;
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--pink-primary) 30%, transparent),
    color-mix(in srgb, var(--purple-primary) 30%, transparent)) !important;
  border-color: color-mix(in srgb, var(--pink-primary) 45%, transparent) !important;
}
.coach-editor-weekly .coach-inline-actions .progression-badge::first-letter {
  color: var(--pink-soft) !important;
  font-size: 1rem;
}
.coach-editor-weekly .coach-inline-actions .progression-badge:hover {
  background: linear-gradient(135deg, var(--pink-primary), var(--purple-primary)) !important;
}
.coach-editor-weekly .coach-inline-actions .progression-badge:hover::first-letter {
  color: #fff !important;
}

/* Delete button ha stile danger */
.coach-editor-weekly .coach-inline-actions [data-exercise-action="delete"] {
  color: color-mix(in srgb, #ff6e7d 90%, #fff) !important;
  border-color: color-mix(in srgb, #ff6e7d 32%, transparent) !important;
}
.coach-editor-weekly .coach-inline-actions [data-exercise-action="delete"]:hover {
  background: color-mix(in srgb, #ff6e7d 22%, var(--surface)) !important;
  border-color: #ff6e7d !important;
  color: #fff !important;
}

/* Nascondo azioni ridondanti — teniamo: copia, dettagli/video, elimina, + overflow */
.coach-editor-weekly .coach-inline-actions [data-exercise-action="up"],
.coach-editor-weekly .coach-inline-actions [data-exercise-action="down"],
.coach-editor-weekly .coach-inline-actions [data-inline-replace] {
  display: none !important;
}

/* Pulsante Trend per riga iniettato via JS */
.coach-editor-weekly .coach-inline-actions .schede-v146-row-trend {
  background: color-mix(in srgb, var(--purple-primary) 14%, var(--surface-raised)) !important;
  border-color: color-mix(in srgb, var(--purple-primary) 40%, transparent) !important;
  color: var(--lavender) !important;
}
.coach-editor-weekly .coach-inline-actions .schede-v146-row-trend:hover {
  background: linear-gradient(135deg, var(--pink-primary), var(--purple-primary)) !important;
  color: #fff !important;
  border-color: transparent !important;
}

/* Thumbnail video iniettato via JS al posto di ⓘ */
.coach-editor-weekly .coach-inline-actions .schede-v146-video-thumb {
  width: 34px !important;
  min-width: 34px !important;
  height: 24px !important;
  min-height: 24px !important;
  border-radius: 5px !important;
  background-size: cover !important;
  background-position: center !important;
  background-color: #000 !important;
  border-color: color-mix(in srgb, var(--pink-primary) 40%, transparent) !important;
  position: relative;
  color: transparent !important;
  font-size: 0 !important;
  overflow: hidden;
}
.coach-editor-weekly .coach-inline-actions .schede-v146-video-thumb::after {
  content: "▶";
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: .62rem;
  color: #fff;
  text-shadow: 0 1px 4px rgba(0,0,0,.6);
  background: linear-gradient(180deg, transparent, rgba(0,0,0,.35));
}
.coach-editor-weekly .coach-inline-actions .schede-v146-video-thumb:hover {
  transform: translateY(-1px);
  border-color: var(--pink-primary) !important;
  box-shadow: 0 4px 12px rgba(255, 79, 163, .3);
}

/* -----------------------------------------------------------
   8. Row group (Superserie/Circuito) — banda evidente
   ----------------------------------------------------------- */
.coach-editor-weekly .coach-set-group-header td {
  padding: 10px 22px !important;
  border: 0 !important;
  background: linear-gradient(90deg,
    color-mix(in srgb, var(--pink-primary) 22%, var(--surface)),
    color-mix(in srgb, var(--purple-primary) 22%, var(--surface))) !important;
}
.coach-editor-weekly .coach-set-group-header strong {
  color: #fff !important;
  font-size: .78rem !important;
  font-weight: 900;
  letter-spacing: .06em;
  text-transform: uppercase;
}
.coach-editor-weekly .coach-set-group-header em {
  padding: 3px 10px !important;
  border-radius: 999px !important;
  background: rgba(255, 255, 255, .18) !important;
  color: #fff !important;
  font-size: .66rem !important;
  font-weight: 900;
  letter-spacing: .08em;
}
.coach-editor-weekly .coach-inline-exercise.in-set-group td:first-child {
  border-left: 3px solid var(--pink-primary) !important;
  padding-left: 19px !important;
  background: color-mix(in srgb, var(--pink-primary) 5%, transparent);
}
.coach-editor-weekly .coach-inline-exercise.in-set-group .program-exercise-letter {
  background: linear-gradient(135deg, var(--pink-primary), var(--purple-primary)) !important;
  color: #fff !important;
}

/* -----------------------------------------------------------
   9. FOOTER "+ Esercizio  + Circuito" iniettato via JS
   ----------------------------------------------------------- */
.schede-v146-day-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 22px 16px;
  border-top: 1px solid color-mix(in srgb, var(--purple-primary) 10%, transparent);
  background: color-mix(in srgb, var(--surface-raised) 30%, transparent);
}
.schede-v146-day-footer button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--pink-primary) 30%, transparent);
  background: color-mix(in srgb, var(--pink-primary) 8%, transparent);
  color: var(--pink-soft);
  font-family: inherit;
  font-size: .76rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 140ms ease;
}
.schede-v146-day-footer button:hover {
  background: color-mix(in srgb, var(--pink-primary) 20%, var(--surface));
  border-color: var(--pink-primary);
  color: #fff;
  transform: translateY(-1px);
}
.schede-v146-day-footer button svg,
.schede-v146-day-footer button .plus {
  width: 14px;
  height: 14px;
  display: grid;
  place-items: center;
  font-size: 1rem;
  font-weight: 700;
}

/* Empty state row */
.coach-editor-weekly .coach-empty-inline {
  padding: 32px 22px !important;
  color: var(--muted);
  font-size: .82rem;
  font-style: italic;
  background: color-mix(in srgb, var(--surface-raised) 40%, transparent);
  text-align: center !important;
}

/* -----------------------------------------------------------
   10. MODALS — palette sync (invariata rispetto v146)
   ----------------------------------------------------------- */
#coachModalPortalHost .coach-modal-backdrop {
  background: rgba(15, 6, 26, .72) !important;
  backdrop-filter: blur(6px);
}
#coachModalPortalHost .coach-modal {
  border-radius: 22px !important;
  border: 1px solid color-mix(in srgb, var(--purple-primary) 26%, transparent) !important;
  background: linear-gradient(145deg,
    color-mix(in srgb, var(--surface-raised) 96%, var(--pink-primary) 4%),
    var(--surface)) !important;
  box-shadow: 0 34px 90px rgba(10, 4, 20, .5) !important;
}
.coach-note-modal textarea,
#coachModalPortalHost textarea {
  min-height: 140px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--purple-primary) 22%, transparent);
  background: color-mix(in srgb, var(--surface-raised) 90%, transparent);
  color: var(--text);
  font-size: .88rem;
  line-height: 1.5;
}
.coach-note-modal textarea:focus,
#coachModalPortalHost textarea:focus {
  outline: none;
  border-color: var(--pink-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--pink-primary) 22%, transparent);
}
#coachModalPortalHost .coach-modal-actions .gold-button,
#coachModalPortalHost .coach-modal-actions .primary-button {
  background: linear-gradient(135deg, var(--pink-primary), var(--purple-primary));
  color: #fff;
  border: 0;
  box-shadow: 0 8px 22px rgba(255, 79, 163, .3);
}
.coach-tools-modal {
  border-color: color-mix(in srgb, var(--purple-primary) 26%, transparent) !important;
  background: linear-gradient(145deg,
    color-mix(in srgb, var(--surface-raised) 96%, var(--pink-primary) 4%),
    var(--surface)) !important;
}
.coach-tools-trend polyline {
  stroke: var(--pink-primary) !important;
  stroke-width: 3.5 !important;
  filter: drop-shadow(0 4px 12px rgba(255, 79, 163, .35));
}
.coach-tools-trend circle {
  fill: var(--pink-primary) !important;
  stroke: var(--surface-raised) !important;
  stroke-width: 3 !important;
}
.coach-tools-trend text { fill: var(--muted) !important; font-size: 12px !important; font-weight: 700; }
.coach-tools-trend text.value { fill: var(--pink-soft) !important; font-weight: 900 !important; }
.coach-tools-trend line { stroke: color-mix(in srgb, var(--purple-primary) 20%, transparent) !important; }

/* Program board bot ridimensionato */
.coach-editor-weekly .program-board-bot {
  bottom: 8px;
  right: 12px;
  font-size: .62rem;
  opacity: .55;
}
.coach-editor-weekly .program-board-bot .coach-avatar { width: 34px; height: 34px; }

/* Responsive: mantengo layout desktop-first, ma senza scroll orizzontale */
@media (max-width: 1366px) {
  .coach-editor-weekly col.col-notes    { width: 100px !important; }
  .coach-editor-weekly col.col-actions  { width: 160px !important; }
  .coach-editor-weekly .coach-inline-exercise td { padding: 5px 4px !important; }
}
@media (max-width: 1180px) {
  .coach-editor-weekly col.col-type   { width: 84px !important; }
  .coach-editor-weekly col.col-reps   { width: 64px !important; }
  .coach-editor-weekly col.col-load   { width: 78px !important; }
  .coach-editor-weekly col.col-notes  { width: 88px !important; }
  .coach-editor-weekly col.col-actions { width: 148px !important; }
  .coach-editor-weekly .coach-inline-exercise input,
  .coach-editor-weekly .coach-inline-exercise select {
    font-size: .68rem !important; padding: 4px 5px !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .coach-editor-weekly *, #coachModalPortalHost * { animation: none !important; transition: none !important; }
}

/* -----------------------------------------------------------
   12. TEMA CHIARO — contrasto testo (v146.1 correttiva)
   Mantiene palette e layout; sostituisce soltanto i toni troppo
   chiari ereditati dal tema scuro.
   ----------------------------------------------------------- */
body[data-theme="light"] .coach-editor-weekly .coach-program-board-head > div:first-child span,
body[data-theme="light"] .coach-editor-weekly .coach-day-title em,
body[data-theme="light"] .coach-editor-weekly .coach-program-day-table thead th,
body[data-theme="light"] .coach-editor-weekly .coach-inline-note,
body[data-theme="light"] .coach-editor-weekly .coach-empty-inline,
body[data-theme="light"] .coach-editor-weekly .coach-editor-save-state [data-coach-save-label] {
  color: #654f62 !important;
}

body[data-theme="light"] .schede-v146-duration-pill {
  color: #6c278f;
  background: rgba(151, 52, 213, .12);
  border-color: rgba(128, 39, 185, .26);
}

body[data-theme="light"] .schede-v146-day-footer button {
  color: #8b246d;
  background: rgba(225, 61, 151, .09);
  border-color: rgba(194, 40, 126, .34);
}

body[data-theme="light"] .coach-editor-weekly .coach-week-tools > span {
  color: #7b315f;
}

body[data-theme="light"] .coach-editor-weekly button:disabled {
  color: #6f536a !important;
  opacity: .72;
  filter: none;
}

body[data-theme="light"] .coach-tools-trend text {
  fill: #654f62 !important;
}

body[data-theme="light"] .coach-tools-trend text.value {
  fill: #8b246d !important;
}

/* -----------------------------------------------------------
   13. v146.1 Coach UX - focus, azioni e Trend utile
   ----------------------------------------------------------- */
.coach-editor-weekly .schede-v146-focus-pills {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 4px;
}
.coach-editor-weekly .schede-v146-focus-pills > span {
  max-width: 105px;
  overflow: hidden;
  padding: 3px 7px;
  border: 1px solid color-mix(in srgb, var(--purple-primary) 24%, var(--border));
  border-radius: 999px;
  background: color-mix(in srgb, var(--purple-primary) 9%, var(--surface-raised));
  color: color-mix(in srgb, var(--purple-primary) 72%, var(--text));
  font-size: .58rem;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.coach-editor-weekly .coach-inline-actions .progression-badge {
  max-width: none !important;
  color: var(--text) !important;
  font-size: .68rem !important;
  text-indent: 0 !important;
}
.coach-editor-weekly .coach-inline-actions .progression-badge::after {
  content: none !important;
}
.coach-statistics-launch-row {
  gap: 10px;
  align-items: center;
}
.coach-trend-launch {
  background: color-mix(in srgb, var(--surface-raised) 86%, var(--purple-primary) 14%) !important;
  color: var(--text) !important;
  border-color: color-mix(in srgb, var(--purple-primary) 35%, var(--border)) !important;
  box-shadow: none !important;
}
.coach-trend-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin: 16px 0 12px;
}
.coach-trend-filters button {
  padding: 7px 11px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface-raised);
  color: var(--text);
  font: inherit;
  font-size: .72rem;
  font-weight: 800;
  cursor: pointer;
}
.coach-trend-filters button.active {
  border-color: transparent;
  background: linear-gradient(135deg, var(--pink-primary), var(--purple-primary));
  color: #fff;
}
.coach-trend-kpis {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 12px 0 16px;
}
.coach-trend-kpis article {
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: color-mix(in srgb, var(--surface-raised) 92%, var(--pink-primary) 8%);
}
.coach-trend-kpis span,
.coach-trend-kpis small,
.coach-trend-kpis strong { display: block; }
.coach-trend-kpis span,
.coach-trend-kpis small { color: var(--text-muted); }
.coach-trend-kpis span { font-size: .68rem; }
.coach-trend-kpis strong { margin: 4px 0; color: var(--purple-primary); font-size: 1.45rem; }
.coach-trend-kpis strong.positive { color: #16a468; }
.coach-trend-kpis strong.negative { color: #dc4776; }
.coach-trend-current {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 5px;
}
.coach-trend-current span { color: var(--text); font-weight: 900; }
.coach-trend-current small { color: var(--text-muted); }
@media (max-width: 720px) {
  .coach-trend-kpis { grid-template-columns: 1fr; }
  .coach-editor-weekly .schede-v146-focus-pills > span:nth-child(n+3) { display: none; }
}
