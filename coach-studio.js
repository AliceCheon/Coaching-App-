/* Fase 19.9 — editor stabile: aggiornamenti locali di modali e progressioni. */
.coach-editor-weekly { --editor-border:color-mix(in srgb,var(--purple) 18%,transparent); --editor-shadow:0 8px 28px rgba(38,15,62,.08); }
.coach-editor-weekly .coach-editor-layout.unified { display:block; min-width:0; }
.coach-editor-weekly .coach-program-board { display:grid; width:100%; max-width:100%; gap:18px; min-width:0; }
.coach-editor-weekly .coach-program-assignment,
.coach-editor-weekly .coach-program-week-tabs,
.coach-editor-weekly .coach-program-day { background:var(--surface); border:1px solid var(--editor-border); box-shadow:var(--editor-shadow); }
.coach-editor-weekly .coach-program-board-head { display:flex; align-items:end; justify-content:space-between; gap:16px; padding:4px 2px; }
.coach-editor-weekly .coach-program-board-head h2 { margin:0; font-size:clamp(26px,2.3vw,38px); line-height:1; }
.coach-editor-weekly .coach-board-controls { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:8px; }
.coach-editor-weekly .coach-program-days { display:grid; gap:20px; min-width:0; }
.coach-editor-weekly .coach-program-day { min-width:0; max-width:100%; overflow:visible; border-radius:18px; }
.coach-editor-weekly .coach-program-day > header { display:flex; align-items:center; justify-content:space-between; gap:16px; min-height:82px; padding:14px 18px; border-bottom:1px solid var(--editor-border); }
.coach-editor-weekly .coach-program-day.is-collapsed > header { border-bottom:0; }
.coach-editor-weekly .coach-day-toggle { display:flex; align-items:center; flex:1; min-width:260px; gap:12px; padding:4px; text-align:left; color:inherit; background:transparent; border:0; box-shadow:none; }
.coach-editor-weekly .coach-day-chevron { display:grid; place-items:center; width:32px; height:32px; flex:0 0 32px; border-radius:10px; background:color-mix(in srgb,var(--pink) 12%,var(--surface)); color:var(--purple); font-size:20px; transition:transform .18s ease; }
.coach-editor-weekly .is-collapsed .coach-day-chevron { transform:rotate(-90deg); }
.coach-editor-weekly .coach-day-title { display:grid; grid-template-columns:auto minmax(0,1fr); align-items:baseline; gap:3px 14px; min-width:0; }
.coach-editor-weekly .coach-day-title em { color:var(--muted); font-style:normal; font-size:14px; font-weight:800; text-transform:uppercase; letter-spacing:.04em; }
.coach-editor-weekly .coach-day-title strong { min-width:0; font-size:19px; line-height:1.25; }
.coach-editor-weekly .coach-day-title small { grid-column:1/-1; color:var(--muted); font-size:13px; }
.coach-editor-weekly .coach-day-actions { display:flex; align-items:center; flex-wrap:wrap; justify-content:flex-end; gap:6px; }
.coach-editor-weekly .coach-day-actions button,
.coach-editor-weekly .coach-day-actions summary { min-height:36px; }
.coach-editor-weekly .coach-program-day-table { width:100%; min-width:0; max-width:100%; overflow:auto; overscroll-behavior:contain; scrollbar-gutter:stable; border-radius:0 0 18px 18px; }
.coach-editor-weekly .coach-program-day-table[hidden] { display:none; }
.coach-editor-weekly .coach-program-day-table table { width:100%; min-width:1180px!important; table-layout:fixed; border-collapse:separate; border-spacing:0; }
.coach-editor-weekly col.col-exercise { width:280px; }
.coach-editor-weekly col.col-type { width:108px; }
.coach-editor-weekly col.col-sets { width:64px; }
.coach-editor-weekly col.col-reps { width:102px; }
.coach-editor-weekly col.col-rest { width:80px; }
.coach-editor-weekly col.col-load { width:118px; }
.coach-editor-weekly col.col-rpe,
.coach-editor-weekly col.col-rir { width:62px; }
.coach-editor-weekly col.col-tut { width:96px; }
.coach-editor-weekly col.col-notes { width:180px; }
.coach-editor-weekly col.col-actions { width:104px; }
.coach-editor-weekly .coach-program-day-table thead th { position:sticky; top:0; z-index:2; height:38px; padding:8px 7px; background:var(--surface); color:var(--muted); border-bottom:1px solid var(--editor-border); font-size:11px; letter-spacing:.04em; text-transform:uppercase; }
.coach-editor-weekly .coach-inline-exercise td { height:64px; padding:7px; vertical-align:middle; border-bottom:1px solid color-mix(in srgb,var(--editor-border) 65%,transparent); }
.coach-editor-weekly .coach-inline-exercise:last-child td { border-bottom:0; }
.coach-editor-weekly .coach-inline-exercise input,
.coach-editor-weekly .coach-inline-exercise select { width:100%; min-width:0; height:38px; padding:6px 8px; border:1px solid color-mix(in srgb,var(--muted) 34%,transparent); border-radius:9px; background:var(--surface); color:var(--text); font-size:14px; }
.coach-editor-weekly .coach-inline-exercise input:focus,
.coach-editor-weekly .coach-inline-exercise select:focus { border-color:var(--purple); box-shadow:0 0 0 3px color-mix(in srgb,var(--purple) 14%,transparent); outline:0; }
.coach-editor-weekly .coach-inline-name { display:flex; align-items:center; gap:6px; min-width:0; }
.coach-editor-weekly .coach-exercise-title { display:flex; align-items:flex-start; min-width:0; flex:1; gap:5px; }
.coach-editor-weekly .coach-exercise-name-text { display:-webkit-box; min-width:0; overflow:hidden; color:var(--text); font-size:14px; font-weight:800; line-height:1.25; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
.coach-editor-weekly .coach-name-edit { flex:0 0 auto; width:26px; min-height:26px; padding:0; color:var(--purple); background:transparent; border:0; box-shadow:none; }
.coach-editor-weekly .coach-name-input[hidden] { display:none; }
.coach-editor-weekly .coach-inline-sub { display:flex; gap:8px; padding:4px 0 0 68px; min-width:0; color:var(--muted); font-size:11px; white-space:nowrap; overflow:hidden; }
.coach-editor-weekly .coach-inline-sub strong { color:var(--purple); }
.coach-editor-weekly .coach-inline-load { display:grid; grid-template-columns:minmax(0,1fr) 46px; gap:4px; }
.coach-editor-weekly .coach-inline-note { display:flex; align-items:center; width:100%; min-height:38px; padding:5px 7px; gap:6px; color:var(--text); background:transparent; border:0; box-shadow:none; text-align:left; }
.coach-editor-weekly .coach-inline-note span { color:var(--pink); }
.coach-editor-weekly .coach-inline-note em { overflow:hidden; font-style:normal; text-overflow:ellipsis; white-space:nowrap; }
.coach-editor-weekly .coach-inline-actions { display:flex; align-items:center; justify-content:flex-end; gap:5px; }
.coach-editor-weekly .coach-inline-actions > button,
.coach-editor-weekly .coach-row-more > summary { display:grid; place-items:center; width:36px; height:36px; min-height:36px; padding:0; border-radius:10px; }
.coach-editor-weekly .coach-inline-actions .progression-badge { width:36px; overflow:hidden; color:transparent; }
.coach-editor-weekly .coach-inline-actions .progression-badge::first-letter { color:var(--text); }
.coach-editor-weekly .coach-row-more { position:relative; }
.coach-editor-weekly .coach-row-more > summary { list-style:none; cursor:pointer; background:color-mix(in srgb,var(--purple) 8%,var(--surface)); border:1px solid var(--editor-border); font-weight:900; }
.coach-editor-weekly .coach-row-more > summary::-webkit-details-marker { display:none; }
.coach-editor-weekly .coach-row-more > div { position:absolute; right:0; top:42px; z-index:30; display:grid; width:190px; padding:7px; gap:4px; border:1px solid var(--editor-border); border-radius:12px; background:var(--surface); box-shadow:0 16px 38px rgba(25,10,40,.18); }
.coach-editor-weekly .coach-row-more > div button { justify-content:flex-start; width:100%; min-height:36px; text-align:left; }
.coach-editor-weekly .coach-set-group-header td { padding:8px 16px; background:color-mix(in srgb,var(--purple) 13%,var(--surface)); color:var(--purple); }
.coach-editor-weekly .set-link-button { width:30px; height:30px; flex:0 0 30px; padding:0; border-radius:9px; }
.coach-editor-weekly .set-link-button.active { color:white; background:var(--purple); }
.coach-editor-weekly button:hover,
.coach-editor-weekly summary:hover { animation:none!important; transform:translateY(-1px)!important; transition:transform .14s ease,box-shadow .14s ease,background-color .14s ease; }
.coach-editor-weekly .coach-program-day-table * { animation-duration:.18s; }

#coachModalPortalHost:empty { display:none; }
#coachModalPortalHost .coach-modal-backdrop { position:fixed; inset:0; z-index:10000; display:grid; place-items:center; padding:20px; background:rgba(20,9,33,.48); backdrop-filter:blur(3px); }
#coachModalPortalHost .coach-modal { position:relative; width:min(880px,calc(100vw - 32px)); max-height:min(88vh,900px); overflow:auto; overscroll-behavior:contain; border-radius:20px; background:var(--surface); box-shadow:0 28px 80px rgba(18,8,30,.34); }
#coachModalPortalHost .progression-modal { display:flex; flex-direction:column; width:min(1180px,calc(100vw - 32px)); overflow:hidden; }
#coachModalPortalHost .progression-modal > .section-eyebrow,
#coachModalPortalHost .progression-modal > h3,
#coachModalPortalHost .progression-modal > .coach-flow-note,
#coachModalPortalHost .progression-modal > .form-grid { flex:0 0 auto; margin-left:18px; margin-right:18px; }
#coachModalPortalHost .progression-modal > .section-eyebrow { margin-top:18px; }
#coachModalPortalHost .progression-scroll { flex:1 1 auto; max-height:52vh; overflow:auto; margin:14px 18px; }
#coachModalPortalHost .progression-table thead th { position:sticky; top:0; z-index:3; background:var(--surface); }
#coachModalPortalHost .progression-modal > .coach-modal-actions { position:sticky; bottom:0; z-index:4; flex:0 0 auto; margin:0; padding:12px 18px; border-top:1px solid var(--editor-border); background:var(--surface); }
#coachModalPortalHost .coach-library-picker { display:flex; flex-direction:column; width:min(820px,calc(100vw - 32px)); max-height:88vh; overflow:hidden; }
#coachModalPortalHost .coach-library-picker > .row,
#coachModalPortalHost .coach-library-picker > .phase4-library-filters,
#coachModalPortalHost .coach-library-picker > button { flex:0 0 auto; margin-left:16px; margin-right:16px; }
#coachModalPortalHost .coach-library-picker > .row { margin-top:16px; }
#coachModalPortalHost .technical-picker-list { flex:1 1 auto; overflow:auto; min-height:260px; margin:12px 16px; }
#coachModalPortalHost .coach-details-section { margin:14px 0; padding:14px; border:1px solid var(--editor-border); border-radius:15px; }
#coachModalPortalHost .coach-details-section legend { padding:0 8px; color:var(--purple); font-weight:900; }
#coachModalPortalHost .progression-rule-summary { display:grid; gap:4px; margin:12px 18px 0; padding:12px 14px; border:1px solid color-mix(in srgb,var(--purple) 22%,transparent); border-radius:13px; background:color-mix(in srgb,var(--purple) 7%,var(--surface)); }
#coachModalPortalHost .progression-rule-summary span,
#coachModalPortalHost .progression-rule-summary small { color:var(--muted); }
#coachModalPortalHost .progression-template-editor { width:min(980px,calc(100vw - 32px)); padding:18px; }
#coachModalPortalHost .progression-template-editor textarea { min-height:84px; resize:vertical; }
.coach-progression-template-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,330px),1fr)); gap:16px; }
.progression-template-card { display:flex; flex-direction:column; gap:9px; }
.progression-template-card .quick-actions { margin-top:auto; }
.progression-template-card.is-inactive { opacity:.62; }
.coach-missing-list { display:grid; gap:12px; }
.coach-missing-list > article { padding:13px; border:1px solid color-mix(in srgb,var(--purple) 16%,transparent); border-radius:14px; background:color-mix(in srgb,var(--purple) 4%,var(--surface)); }
.coach-missing-list > article p { margin:8px 0; color:var(--muted); }

@media (max-width:900px) {
  .coach-editor-weekly .coach-program-board-head { align-items:stretch; flex-direction:column; }
  .coach-editor-weekly .coach-board-controls { justify-content:flex-start; }
  .coach-editor-weekly .coach-program-day > header { align-items:stretch; flex-direction:column; }
  .coach-editor-weekly .coach-day-actions { justify-content:flex-start; }
  .coach-editor-weekly .coach-program-day-table table { min-width:1120px!important; }
  #coachModalPortalHost .coach-modal-backdrop { align-items:end; padding:8px; }
  #coachModalPortalHost .coach-modal { width:100%; max-height:92vh; border-radius:20px 20px 10px 10px; }
}

@media (prefers-reduced-motion:reduce) {
  .coach-editor-weekly *, #coachModalPortalHost * { scroll-behavior:auto!important; transition:none!important; animation:none!important; }
}
