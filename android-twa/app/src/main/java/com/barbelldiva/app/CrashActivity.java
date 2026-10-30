package com.barbelldiva.app;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.util.TypedValue;
import android.widget.ScrollView;
import android.widget.TextView;

import java.io.File;
import java.io.FileInputStream;

/**
 * CrashActivity — schermata di emergenza che mostra l'ultimo errore.
 *
 * Gira in un processo separato (:crash) e legge il file crash-log.txt, cosi'
 * puo' mostrare il messaggio anche se il processo principale e' in fase di
 * chiusura. Serve solo a far leggere l'errore ad Alice (una foto) quando l'app
 * non si apre.
 */
public class CrashActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        String txt = readLog();
        if (txt == null || txt.isEmpty()) {
            txt = "(nessun log trovato)";
        }

        ScrollView sv = new ScrollView(this);
        TextView tv = new TextView(this);
        tv.setText("BARBELL DIVA - errore di avvio\n\n"
                + txt
                + "\n\n>>> Fai una foto di questa schermata e inviala. <<<");
        tv.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f);
        tv.setTextColor(Color.WHITE);
        tv.setBackgroundColor(Color.parseColor("#090918"));
        tv.setPadding(24, 48, 24, 48);
        sv.setBackgroundColor(Color.parseColor("#090918"));
        sv.addView(tv);
        setContentView(sv);
    }

    private String readLog() {
        try {
            File f = new File(getFilesDir(), "crash-log.txt");
            if (!f.exists()) return null;
            long len = f.length();
            if (len <= 0) return null;
            int n = (int) Math.min(len, 12000);
            byte[] buf = new byte[n];
            FileInputStream in = new FileInputStream(f);
            int read = in.read(buf);
            in.close();
            if (read <= 0) return null;
            return new String(buf, 0, read, "UTF-8");
        } catch (Throwable t) {
            return "(lettura log fallita: " + t + ")";
        }
    }
}
