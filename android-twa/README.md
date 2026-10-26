# Barbell Diva — app Android (WebView propria, dalla 1.3.0)

Questa cartella contiene l'app Android di Barbell Diva. Fino alla 1.2.1 era una
Trusted Web Activity (dentro Chrome, dove il fullscreen della pagina non
funzionava mai). **Dalla 1.3.0 è un'app con WebView propria** che apre
`https://alicecheon.github.io/Coaching-App-/`: stesso sito, stesso account,
stessi dati sincronizzati col PC.

## Cosa fa l'app (MainActivity)
- Fullscreen vero: `requestFullscreen()` della pagina -> `onShowCustomView()`
  + immersiva della finestra (barre di sistema nascoste, cutout usato).
- Login Google NATIVO (dalla 1.3.1): GoogleSignIn + id token -> `signInWithCredential`. Serve l'impronta SHA-1 registrata nel progetto Firebase. Il flusso web (popup/redirect) resta di riserva.
- Schermo sempre acceso durante l'allenamento: shim `navigator.wakeLock` -> `FLAG_KEEP_SCREEN_ON`.
- Export backup salvato nella cartella Download.

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
`60:1C:FD:DB:A7:14:D7:66:21:DC:63:99:AB:87:E8:21:25:F0:04:0F:37:21:2D:D4:14:2D:94:CA:05:B0:86:8C` (stessa dalla 1.0.8; copia sul PC di Alice: `barbell-diva-keystore-1.0.8.jks`)

Per i link verificati deve combaciare con quella in
`https://alicecheon.github.io/.well-known/assetlinks.json`.
