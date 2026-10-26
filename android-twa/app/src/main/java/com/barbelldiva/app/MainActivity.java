package com.barbelldiva.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;

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
 *
 * v1.1.1 — immersiva nativa del guscio (richiesta Alice: "il guscio non deve
 * aspettare il permesso del sito"). La finestra nasconde DA SOLA barra di
 * stato e barra gesti a livello Android, con rientro transiente a swipe e
 * ri-applicazione ad ogni ripresa del focus. Indipendente dalla
 * requestFullscreen() della pagina: funziona anche se il sito non chiede
 * nulla. Nella TWA non esiste una WebView (niente WebChromeClient) e non
 * esiste un flag "TWA_LAUNCH_AS_FULLSCREEN": questa e' la leva nativa reale.
 */
public class MainActivity extends LauncherActivity {

    private static final String SITE_URL = "https://alicecheon.github.io/Coaching-App-/";

    private boolean mFallbackDone = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        CrashGuard.event("activity-onCreate", "enter");
        try {
            super.onCreate(savedInstanceState);
            applyImmersiveFullscreen();
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

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        // Recipe classica dell'immersiva: quando la finestra riprende il focus
        // (ritorno dallo swipe, da una dialog, dal multitasking) le barre
        // vengono nascoste di nuovo, senza che l'utente debba rifare nulla.
        if (hasFocus) {
            applyImmersiveFullscreen();
        }
    }

    /**
     * Nasconde status bar e navigation bar a livello di finestra, in modo
     * "sticky" (ritornano solo trascinando dal bordo, e sparisono di nuovo).
     * Il taglio fotocamera resta sempre sbloccato (cutout ALWAYS). Ogni passo
     * e' protetto: un errore qui non deve mai chiudere l'app.
     */
    private void applyImmersiveFullscreen() {
        try {
            Window w = getWindow();
            if (w == null) return;

            // Flag legacy: nasconde la barra di stato alla vecchia maniera
            // (il tema lo fa gia', lo ribadiamo qui per coprire ogni variante).
            w.setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                    WindowManager.LayoutParams.FLAG_FULLSCREEN);

            // Cutout della fotocamera sempre sfruttato (API 28+).
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                w.getAttributes().layoutInDisplayCutoutMode =
                        WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS;
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                // Via moderna (Android 11+): nascosta vera, transiente a swipe.
                WindowInsetsController c = w.getInsetsController();
                if (c != null) {
                    c.setSystemBarsBehavior(
                            WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                    c.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                }
            } else {
                // Via legacy (fino ad Android 10): immersiva sticky completa.
                w.getDecorView().setSystemUiVisibility(
                        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                                | View.SYSTEM_UI_FLAG_FULLSCREEN
                                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
            }
            CrashGuard.event("immersive", "applied");
        } catch (Throwable t) {
            CrashGuard.report("MainActivity.applyImmersiveFullscreen", t);
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
