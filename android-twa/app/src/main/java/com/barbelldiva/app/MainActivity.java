package com.barbelldiva.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

import com.google.androidbrowserhelper.trusted.LauncherActivity;

/**
 * MainActivity — apre Barbell Diva come Trusted Web Activity.
 *
 * La TWA mostra il sito (GitHub Pages) a tutto schermo, senza barra del
 * browser, mantenendo il login Google funzionante (a differenza di una WebView,
 * che Google bloccherebbe). Tutta la configurazione (URL, colori, bordo-schermo)
 * arriva dal AndroidManifest e dal tema.
 *
 * In questa build diagnostica:
 *  - ogni passo dell'avvio viene registrato (CrashGuard -> raccoglitore remoto);
 *  - se il percorso TWA solleva un'eccezione, la segnaliamo e apriamo comunque
 *    il sito (ultima rete di sicurezza), cosi' l'app non resta chiusa.
 */
public class MainActivity extends LauncherActivity {

    private static final String SITE_URL = "https://alicecheon.github.io/Coaching-App-/";

    private boolean mFallbackDone = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        CrashGuard.event("activity-onCreate", "enter");
        try {
            super.onCreate(savedInstanceState);
            CrashGuard.event("activity-onCreate", "super-ok");
        } catch (Throwable t) {
            CrashGuard.report("MainActivity.onCreate", t);
            throw t;
        }
    }

    @Override
    protected void launchTwa() {
        CrashGuard.event("launchTwa", "enter");
        try {
            super.launchTwa();
            CrashGuard.event("launchTwa", "done");
        } catch (Throwable t) {
            CrashGuard.report("MainActivity.launchTwa", t);
            openFallback();
        }
    }

    /**
     * Ultima rete di sicurezza: se la TWA non parte, apriamo il sito con un
     * intent VIEW (Custom Tab / browser). Non e' bello come la TWA ma almeno
     * l'app si apre e mostra i dati.
     */
    private void openFallback() {
        if (mFallbackDone) return;
        mFallbackDone = true;
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(SITE_URL));
            i.addCategory(Intent.CATEGORY_BROWSABLE);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(i);
            CrashGuard.event("fallback", "open-view-intent");
        } catch (Throwable t) {
            CrashGuard.report("MainActivity.openFallback", t);
        }
    }
}
