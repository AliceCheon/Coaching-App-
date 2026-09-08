# Lighthouse Audit - Barbell Diva

## Come eseguire l'audit

### 1. Avvia l'app in produzione
```bash
npm run build
npm run preview
```

### 2. Apri Chrome e vai all'URL mostrato (es. http://localhost:4173)

### 3. Apri Lighthouse
- Premi `F12` per aprire DevTools
- Vai alla tab **Lighthouse**
- Seleziona:
  - **Device**: Mobile
  - **Categories**: Performance, Accessibility, Best Practices, SEO, PWA
- Clicca **Analyze page load**

## Cosa verificare

### Performance (obiettivo: 90+)
- First Contentful Paint < 1.8s
- Largest Contentful Paint < 2.5s
- Total Blocking Time < 200ms
- Cumulative Layout Shift < 0.1
- Speed Index < 3.4s

### Accessibility (obiettivo: 90+)
- Tutti i bottoni hanno aria-label
- Contrasto colori sufficiento
- Immagini hanno alt text
- Form hanno label

### Best Practices (obiettivo: 90+)
- HTTPS attivo
- No console errors
- Immagini con dimensioni corrette

### SEO (obiettivo: 90+)
- Meta description presente
- Title tag ottimizzato
- Viewport configurato

### PWA (obiettivo: PWA completo)
- manifest.webmanifest presente
- Service worker registrato
- Icone 192px e 512px
- Installabile
- Funziona offline

## Ottimizzazioni già implementate

✅ Font preloaded (atlas-nunito-sans.ttf)
✅ Meta viewport configurato
✅ Theme color impostato
✅ Manifest PWA presente
✅ Service worker presente
✅ Icone PWA (192px, 512px)

## Ottimizzazioni suggerite

1. **Code splitting**: I moduli JS sono caricati separatamente
2. **Lazy loading**: Carica i grafici solo quando visibili
3. **Image optimization**: Usa WebP per le immagini
4. **Caching**: Service worker per cache asset statici

## Comando rapido per audit da CLI

```bash
# Installa lighthouse CLI
npm install -g lighthouse

# Esegui audit
lighthouse http://localhost:4173 --output html --output-path ./lighthouse-report.html
```

## Risultati attesi

| Categoria | Score atteso |
|-----------|--------------|
| Performance | 85-95 |
| Accessibility | 90-95 |
| Best Practices | 90-95 |
| SEO | 90-95 |
| PWA | 100 |