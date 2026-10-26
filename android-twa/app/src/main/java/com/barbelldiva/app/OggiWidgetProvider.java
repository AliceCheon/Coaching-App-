package com.barbelldiva.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Widget "Allenamento di oggi" per la FlexWindow (schermo esterno) dei Galaxy Z Flip.
 *
 * Ricetta ufficiale Samsung (codelab "Develop a widget for Flex Window"):
 *  - meta-data "android.appwidget.provider" con widgetCategory="keyguard"
 *  - meta-data "com.samsung.android.appwidget.provider" con display="sub_screen"
 *
 * Dati: file JSON statico widget-config.json su GitHub Pages (stesso repository
 * del sito). Offline: usa l'ultima copia riuscita salvata in SharedPreferences.
 * Il countdown si aggiorna con l'aggiornamento periodico del widget (minimo di
 * sistema 30 minuti) e col tasto AGGIORNA.
 */
public class OggiWidgetProvider extends AppWidgetProvider {

    private static final String CONFIG_URL =
            "https://alicecheon.github.io/Coaching-App-/widget-config.json";
    private static final String ACTION_REFRESH = "com.barbelldiva.app.WIDGET_REFRESH";
    private static final String PREFS = "oggi_widget";
    private static final TimeZone TZ = TimeZone.getTimeZone("Europe/Rome");
    private static final ExecutorService EXEC = Executors.newSingleThreadExecutor();

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] widgetIds) {
        refresh(context);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_REFRESH.equals(intent.getAction())) {
            refresh(context);
        }
    }

    private void refresh(final Context context) {
        final PendingResult pending = goAsync();
        EXEC.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    String json = fetchLatest(context);
                    if (json == null) {
                        json = readCache(context);
                    }
                    renderAll(context, json);
                } finally {
                    pending.finish();
                }
            }
        });
    }

    /** Scarica il JSON; in caso di problema ritorna null (il chiamante usa la cache). */
    private static String fetchLatest(Context context) {
        HttpURLConnection conn = null;
        try {
            conn = (HttpURLConnection) new URL(CONFIG_URL).openConnection();
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(8000);
            BufferedReader reader =
                    new BufferedReader(new InputStreamReader(conn.getInputStream(), "UTF-8"));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            reader.close();
            String json = sb.toString();
            JSONObject probe = new JSONObject(json);
            probe.getJSONArray("settimana"); // validazione minima prima di salvare in cache
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                    .edit()
                    .putString("config_json", json)
                    .putLong("config_time", System.currentTimeMillis())
                    .apply();
            return json;
        } catch (Exception e) {
            return null;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private static String readCache(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .getString("config_json", null);
    }

    private static void renderAll(Context context, String json) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, OggiWidgetProvider.class));
        for (int id : ids) {
            manager.updateAppWidget(id, buildViews(context, json));
        }
    }

    private static RemoteViews buildViews(Context context, String json) {
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.oggi_widget);

        if (json == null) {
            v.setTextViewText(R.id.w_fase, "Barbell Diva");
            v.setTextViewText(R.id.w_oggi_tipo, "Allenamento di oggi");
            v.setTextViewText(R.id.w_oggi_dettaglio,
                    "Collega il telefono a internet per caricare il programma.");
            v.setTextViewText(R.id.w_countdown, "");
            v.setTextViewText(R.id.w_agg, "");
            attachClicks(context, v);
            return v;
        }

        try {
            JSONObject cfg = new JSONObject(json);
            String fase = cfg.optString("fase", "Barbell Diva");
            JSONArray week = cfg.getJSONArray("settimana");

            Calendar nowCal = Calendar.getInstance(TZ);
            long now = nowCal.getTimeInMillis();
            String todayKey = dayKey(nowCal.get(Calendar.DAY_OF_WEEK));

            JSONObject today = null;
            for (int i = 0; i < week.length(); i++) {
                JSONObject d = week.getJSONObject(i);
                if (todayKey.equals(d.optString("giorno"))) {
                    today = d;
                    break;
                }
            }

            JSONObject next = null;
            String nextKey = null;
            long nextStart = 0;
            if (today != null) {
                long t = startOf(nowCal, today.optString("ora", "00:00"));
                if (now < t) {
                    next = today;
                    nextKey = todayKey;
                    nextStart = t;
                }
            }
            if (next == null) {
                int from = (today != null) ? 1 : 0;
                search:
                for (int delta = from; delta <= 7; delta++) {
                    Calendar probe = (Calendar) nowCal.clone();
                    probe.add(Calendar.DAY_OF_YEAR, delta);
                    String key = dayKey(probe.get(Calendar.DAY_OF_WEEK));
                    for (int i = 0; i < week.length(); i++) {
                        JSONObject d = week.getJSONObject(i);
                        if (key.equals(d.optString("giorno"))) {
                            next = d;
                            nextKey = key;
                            nextStart = startOf(probe, d.optString("ora", "00:00"));
                            break search;
                        }
                    }
                }
            }

            v.setTextViewText(R.id.w_fase, fase);
            if (today != null) {
                v.setTextViewText(R.id.w_oggi_tipo, "Oggi: " + today.optString("tipo", ""));
                v.setTextViewText(R.id.w_oggi_dettaglio,
                        today.optString("dettaglio", "") + " · " + today.optString("ora", ""));
            } else {
                v.setTextViewText(R.id.w_oggi_tipo, "Oggi: Riposo");
                if (next != null) {
                    v.setTextViewText(R.id.w_oggi_dettaglio,
                            "Prossimo: " + next.optString("tipo", "") + " · " + nextKey
                                    + " alle " + next.optString("ora", ""));
                } else {
                    v.setTextViewText(R.id.w_oggi_dettaglio, "Nessun allenamento in programma");
                }
            }
            v.setTextViewText(R.id.w_countdown,
                    (next != null) ? "tra " + humanize(nextStart - now) : "");

            long cachedAt = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                    .getLong("config_time", 0);
            String stamp = (cachedAt > 0)
                    ? new SimpleDateFormat("HH:mm", Locale.ITALY).format(new Date(cachedAt))
                    : "--:--";
            v.setTextViewText(R.id.w_agg, "agg. " + stamp);
        } catch (Exception e) {
            v.setTextViewText(R.id.w_fase, "Barbell Diva");
            v.setTextViewText(R.id.w_oggi_tipo, "Config del widget non valida");
            v.setTextViewText(R.id.w_oggi_dettaglio,
                    "Controlla widget-config.json nel repository.");
            v.setTextViewText(R.id.w_countdown, "");
            v.setTextViewText(R.id.w_agg, "");
        }
        attachClicks(context, v);
        return v;
    }

    private static void attachClicks(Context context, RemoteViews v) {
        Intent open = context.getPackageManager()
                .getLaunchIntentForPackage(context.getPackageName());
        if (open == null) {
            open = new Intent(context, MainActivity.class);
        }
        PendingIntent openPi = PendingIntent.getActivity(context, 0, open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.w_card, openPi);

        Intent refresh = new Intent(context, OggiWidgetProvider.class)
                .setAction(ACTION_REFRESH);
        PendingIntent refreshPi = PendingIntent.getBroadcast(context, 1, refresh,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.w_refresh, refreshPi);
    }

    private static String humanize(long ms) {
        long minutes = ms / 60000L;
        long days = minutes / 1440L;
        long hours = (minutes % 1440L) / 60L;
        long mins = minutes % 60L;
        if (days > 0) return days + "g " + hours + "h";
        if (hours > 0) return hours + "h " + mins + "m";
        return mins + " min";
    }

    private static long startOf(Calendar base, String hhmm) {
        String[] p = hhmm.split(":");
        Calendar c = (Calendar) base.clone();
        try {
            c.set(Calendar.HOUR_OF_DAY, Integer.parseInt(p[0].trim()));
            c.set(Calendar.MINUTE, Integer.parseInt(p[1].trim()));
        } catch (Exception e) {
            c.set(Calendar.HOUR_OF_DAY, 0);
            c.set(Calendar.MINUTE, 0);
        }
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        return c.getTimeInMillis();
    }

    private static String dayKey(int dow) {
        switch (dow) {
            case Calendar.MONDAY: return "LUN";
            case Calendar.TUESDAY: return "MAR";
            case Calendar.WEDNESDAY: return "MER";
            case Calendar.THURSDAY: return "GIO";
            case Calendar.FRIDAY: return "VEN";
            case Calendar.SATURDAY: return "SAB";
            default: return "DOM";
        }
    }
}
