# Barbell Diva — app Android (TWA)

Questa cartella contiene l'app Android di Barbell Diva. È una **Trusted Web
Activity (TWA)**: una "scatola" Android che apre il sito
`https://alicecheon.github.io/Coaching-App-/` a tutto schermo, **senza barra del
browser** e **con il login Google funzionante** (una WebView normale verrebbe
bloccata da Google). Non è una riscrittura dell'app: è lo stesso sito, stesso
account, stessi dati sincronizzati col PC.

## Cosa fa la TWA
- Mostra il sito già esistente (nessun codice duplicato).
- Nessuna barra indirizzi (verificata con Digital Asset Links).
- Chiede il bordo-schermo (tema `Theme.BarbellDiva.EdgeToEdge`, `shortEdges`).

## File importanti
- `keystore.jks` — chiave di firma (**SEGRETA**, non versionata).
- `.keystore-pass.txt` — password della chiave (**SEGRETA**, non versionata).
- `.well-known/assetlinks.json` — vive nel repo `AliceCheon.github.io`
  (radice del dominio) e contiene l'impronta SHA-256 della chiave.

> ⚠️ **Se perdi `keystore.jks` + password non potrai più aggiornare l'app**
> (Android rifiuterebbe l'aggiornamento come "firma diversa"). Conservali bene.

## Come ricompilare l'APK
Serve JDK 17+, Android SDK (platform 36, build-tools) e Gradle 8.11+.

```bash
export JAVA_HOME=/percorso/jdk
export ANDROID_HOME=/percorso/android-sdk
export BD_KEYSTORE_PASS="$(cat .keystore-pass.txt)"
gradle assembleRelease
# APK: app/build/outputs/apk/release/app-release.apk
```

## Impronta della chiave (SHA-256)
`60:1C:FD:DB:A7:14:D7:66:21:DC:63:99:AB:87:E8:21:25:F0:04:0F:37:21:2D:D4:14:2D:94:CA:05:B0:86:8C`

Deve combaciare con quella in
`https://alicecheon.github.io/.well-known/assetlinks.json`.
