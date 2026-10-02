package com.barbelldiva.app;

import android.content.Context;
import android.os.Build;
import android.util.Log;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * CrashGuard — rete di sicurezza per l'avvio dell'app.
 *
 * Registra un gestore di eccezioni non catturate che:
 *  1. scrive lo stack trace nel log di sistema (logcat);
 *  2. lo salva su file dentro la cartella privata dell'app (crash-log.txt);
 *  3. lo invia a un raccoglitore remoto (best-effort) cosi' possiamo vedere
 *     l'errore esatto anche se l'app si chiude subito.
 *
 * Tutto e' racchiuso in try/catch: se qualcosa qui dentro fallisce non deve
 * MAI far crashare l'app.
 */
public final class CrashGuard {

    static final String TAG = "BarbellDivaCrash";

    // Raccolta remota (best-effort). Se non raggiungibile, il log resta su file.
    static final String COLLECTOR =
            "https://8099-i8artd7n67077wsba4qwe-2b54fc91.sandbox.novita.ai/report";

    private static volatile Context ctx;
    private static volatile boolean installed;

    private CrashGuard() {}

    /** Installa il gestore. Idempotente e a prova di errore. */
    static void install(Context c) {
        try {
            if (installed) return;
            ctx = c.getApplicationContext();
            installed = true;

            final Thread.UncaughtExceptionHandler prev =
                    Thread.getDefaultUncaughtExceptionHandler();

            Thread.setDefaultUncaughtExceptionHandler((thread, t) -> {
                try {
                    report("uncaught:" + thread.getName(), t);
                    showCrashScreen();
                    // Piccola pausa per dare tempo all'invio e alla schermata.
                    Thread.sleep(1500);
                } catch (Throwable ignored) {
                }
                if (prev != null) {
                    prev.uncaughtException(thread, t);
                }
            });

            event("app-start", "sdk=" + Build.VERSION.SDK_INT
                    + " release=" + Build.VERSION.RELEASE
                    + " model=" + Build.MODEL);
        } catch (Throwable t) {
            Log.e(TAG, "install() failed", t);
        }
    }

    /** Evento informativo (non un crash). */
    static void event(String name, String extra) {
        try {
            send("{\"event\":\"" + esc(name) + "\",\"extra\":\"" + esc(extra) + "\"}");
        } catch (Throwable ignored) {
        }
    }

    /** Registra un errore. */
    static void report(String where, Throwable t) {
        try {
            Log.e(TAG, where, t);
            String stack = describe(t);
            persist("[" + where + "]\n" + stack + "\n\n");
            send("{\"event\":\"crash\""
                    + ",\"where\":\"" + esc(where) + "\""
                    + ",\"sdk\":" + Build.VERSION.SDK_INT
                    + ",\"release\":\"" + esc(Build.VERSION.RELEASE) + "\""
                    + ",\"model\":\"" + esc(Build.MODEL) + "\""
                    + ",\"stack\":\"" + esc(stack) + "\"}");
        } catch (Throwable ignored) {
        }
    }

    /** Stack trace leggibile (con le cause annidate). */
    static String describe(Throwable t) {
        StringWriter sw = new StringWriter();
        try {
            t.printStackTrace(new PrintWriter(sw));
            Throwable cause = t.getCause();
            int guard = 0;
            while (cause != null && guard++ < 6) {
                sw.append("\nCaused by: ");
                cause.printStackTrace(new PrintWriter(sw));
                cause = cause.getCause();
            }
        } catch (Throwable ignored) {
        }
        return sw.toString();
    }

    /** Apre la schermata di emergenza (processo separato) con l'ultimo errore. */
    private static void showCrashScreen() {
        try {
            Context c = ctx;
            if (c == null) return;
            android.content.Intent i = new android.content.Intent();
            i.setClassName(c.getPackageName(), "com.barbelldiva.app.CrashActivity");
            i.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK
                    | android.content.Intent.FLAG_ACTIVITY_CLEAR_TASK);
            c.startActivity(i);
        } catch (Throwable ignored) {
        }
    }

    private static void persist(String s) {
        try {
            Context c = ctx;
            if (c == null) return;
            File f = new File(c.getFilesDir(), "crash-log.txt");
            FileOutputStream fo = new FileOutputStream(f, true);
            fo.write(s.getBytes("UTF-8"));
            fo.close();
        } catch (Throwable ignored) {
        }
    }

    private static void send(final String json) {
        new Thread(() -> {
            HttpURLConnection conn = null;
            try {
                URL u = new URL(COLLECTOR);
                conn = (HttpURLConnection) u.openConnection();
                conn.setRequestMethod("POST");
                conn.setDoOutput(true);
                conn.setConnectTimeout(8000);
                conn.setReadTimeout(8000);
                conn.setRequestProperty("Content-Type", "application/json");
                OutputStream os = conn.getOutputStream();
                os.write(json.getBytes("UTF-8"));
                os.close();
                Log.i(TAG, "sent -> " + conn.getResponseCode());
            } catch (Throwable t) {
                Log.w(TAG, "send failed: " + t);
            } finally {
                if (conn != null) {
                    try { conn.disconnect(); } catch (Throwable ignored) {}
                }
            }
        }, "crash-send").start();
    }

    private static String esc(String s) {
        if (s == null) return "";
        StringBuilder b = new StringBuilder(s.length() + 16);
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            switch (ch) {
                case '"':  b.append("\\\""); break;
                case '\\': b.append("\\\\"); break;
                case '\n': b.append("\\n");  break;
                case '\r': break;
                case '\t': b.append("\\t");  break;
                default:
                    if (ch < 0x20) b.append(' '); else b.append(ch);
            }
        }
        return b.toString();
    }
}
