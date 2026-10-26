# Barbell Diva — app Android (WebView propria, dalla 1.3.0)

Questa cartella contiene l'app Android di Barbell Diva. Fino alla 1.2.1 era una
Trusted Web Activity (dentro Chrome, dove il fullscreen della pagina non
funzionava mai). **Dalla 1.3.0 è un'app con WebView propria** che apre
`https://alicecheon.github.io/Coaching-App-/`: stesso sito, stesso account,
stessi dati sincronizzati col PC.

## Cosa fa l'app (MainActivity)
- Fullscreen vero: `requestFullscreen()` della pagina -> `onShowCustomView()`
  + immersiva della finestra (barre di sistema nascoste, cutout usato).
- Login Google: user-agent senza `; wv`, cookie attivi, popup che ricade sul redirect.
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
`3B:7E:B4:37:36:84:DE:84:57:BF:CD:D7:27:94:D9:E0:90:49:94:9D:61:4B:6E:5B:C7:CC:17:7C:0D:EC:0A:22` (chiave nuova dalla 1.3.0; la 1.0.8–1.2.1 usava 60:1C:...:86:8C)

Per i link verificati deve combaciare con quella in
`https://alicecheon.github.io/.well-known/assetlinks.json`.
