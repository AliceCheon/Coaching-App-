package com.barbelldiva.app;

import com.google.androidbrowserhelper.trusted.LauncherActivity;

/**
 * MainActivity — apre Barbell Diva come Trusted Web Activity.
 *
 * La TWA mostra il sito (GitHub Pages) a tutto schermo, senza barra del
 * browser, mantenendo il login Google funzionante (a differenza di una WebView,
 * che Google bloccherebbe). Tutta la configurazione (URL, colori, bordo-schermo)
 * arriva dal AndroidManifest e dal tema.
 */
public class MainActivity extends LauncherActivity {
}
