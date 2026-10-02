package com.barbelldiva.app;

import android.app.Application;
import android.content.Context;

/**
 * DivaApp — Application dell'app.
 *
 * Installa il CrashGuard il prima possibile (in attachBaseContext), cioe' PRIMA
 * che vengano creati i ContentProvider (androidx.startup) e prima di
 * Application.onCreate: cosi' catturiamo anche un eventuale crash che avviene
 * durante l'inizializzazione automatica delle librerie.
 */
public class DivaApp extends Application {

    @Override
    protected void attachBaseContext(Context base) {
        super.attachBaseContext(base);
        try {
            CrashGuard.install(base);
        } catch (Throwable ignored) {
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        try {
            CrashGuard.event("application-onCreate", "ok");
        } catch (Throwable ignored) {
        }
    }
}
