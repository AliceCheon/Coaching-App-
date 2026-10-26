package com.barbelldiva.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.Collections;

/**
 * MainActivity — v1.3.0 "APK vero".
 *
 * Fino alla 1.2.1 l'app era una Trusted Web Activity: un guscio che apriva
 * Chrome. Li' dentro la requestFullscreen() della pagina non ha MAI funzionato
 * (Chrome ignora il fullscreen in TWA) e il pulsantino SCHERMO era inutile.
 *
 * Ora l'app ha una WebView PROPRIA:
 *  - il "Fullscreen vero" del pannello SCHERMO arriva qui come
 *    onShowCustomView(): nascondiamo le barre di sistema noi, davvero;
 *  - la finestra resta comunque immersiva (applyImmersiveFullscreen, la stessa
 *    ricetta della 1.1.x), riarmata a ogni ritorno del focus;
 *  - login Google: user-agent senza "; wv" + cookie attivi + niente finestre
 *    multiple -> il popup fallisce e il sito usa da solo il redirect;
 *  - keep-awake: la WebView non ha navigator.wakeLock -> lo forniamo noi
 *    (shim JS) appoggiato a FLAG_KEEP_SCREEN_ON;
 *  - export backup: i download blob: vengono salvati in Download dal nativo.
 */
public class MainActivity extends Activity {

    private static final String SITE_URL = "https://alicecheon.github.io/Coaching-App-/";
    private static final String SITE_ORIGIN = "https://alicecheon.github.io";
    private static final int REQ_FILE_CHOOSER = 4701;

    /** navigator.wakeLock per la WebView, appoggiato al bridge nativo. */
    private static final String WAKE_LOCK_SHIM =
            "(function(){try{" +
            "if(window.__bdWakeShim)return;window.__bdWakeShim=true;" +
            "var bdNative=window.BarbellDivaNative;if(!bdNative)return;" +
            // Export backup: <a download href="blob:..."> -> salvato dal nativo
            // subito (prima che il sito revochi il blob) e con il nome vero.
            "try{var oc=HTMLAnchorElement.prototype.click;" +
            "HTMLAnchorElement.prototype.click=function(){var h=String(this.href||'');" +
            "if(h.indexOf('blob:')===0&&this.hasAttribute('download')){var nm=this.getAttribute('download')||'barbell-diva-backup.json';" +
            "fetch(h).then(function(r){return r.blob();}).then(function(b){var fr=new FileReader();" +
            "fr.onloadend=function(){var s=String(fr.result||'');bdNative.saveBlob(s.slice(s.indexOf(',')+1),nm,b.type||'application/octet-stream');};" +
            "fr.readAsDataURL(b);}).catch(function(){oc.call(this);}.bind(this));return;}" +
            "return oc.apply(this,arguments);};}catch(e){}" +
            "if(navigator.wakeLock&&navigator.wakeLock.__bd!==true&&navigator.wakeLock.request)return;" +
            "var active=[];" +
            "var api={__bd:true,request:function(type){" +
            "var lock={type:'screen',released:false,onrelease:null," +
            "release:function(){if(lock.released)return Promise.resolve();lock.released=true;" +
            "active=active.filter(function(l){return l!==lock;});" +
            "if(!active.length){try{bdNative.setKeepAwake(false);}catch(e){}}" +
            "try{if(typeof lock.onrelease==='function')lock.onrelease({type:'release'});}catch(e){}" +
            "return Promise.resolve();}," +
            "addEventListener:function(){},removeEventListener:function(){}};" +
            "active.push(lock);try{bdNative.setKeepAwake(true);}catch(e){}" +
            "return Promise.resolve(lock);}};" +
            "Object.defineProperty(navigator,'wakeLock',{configurable:true,get:function(){return api;}});" +
            "}catch(e){}})();";

    private FrameLayout mRoot;
    private WebView mWebView;
    private View mCustomView;
    private WebChromeClient.CustomViewCallback mCustomViewCallback;
    private ValueCallback<Uri[]> mFileCallback;
    private boolean mDocStartShim = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        CrashGuard.event("activity-onCreate", "enter");
        try {
            super.onCreate(savedInstanceState);
            mRoot = new FrameLayout(this);
            mRoot.setBackgroundColor(Color.parseColor("#090918"));
            setContentView(mRoot);
            applyImmersiveFullscreen();
            buildWebShell();
            if (savedInstanceState != null) {
                mWebView.restoreState(savedInstanceState);
            } else {
                mWebView.loadUrl(startUrl(getIntent()));
            }
            CrashGuard.event("activity-onCreate", "webview-ok");
        } catch (Throwable t) {
            CrashGuard.report("MainActivity.onCreate", t);
            throw t;
        }
    }

    private String startUrl(Intent intent) {
        try {
            if (intent != null && Intent.ACTION_VIEW.equals(intent.getAction()) && intent.getData() != null) {
                String u = intent.getData().toString();
                if (u.startsWith(SITE_ORIGIN + "/Coaching-App-")) return u;
            }
        } catch (Throwable ignored) { }
        return SITE_URL;
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (mWebView != null && intent != null && Intent.ACTION_VIEW.equals(intent.getAction())) {
            mWebView.loadUrl(startUrl(intent));
        }
    }

    @SuppressLint({"SetJavaScriptEnabled", "JavascriptInterface"})
    private void buildWebShell() {
        if (mWebView != null) {
            try { mRoot.removeView(mWebView); mWebView.destroy(); } catch (Throwable ignored) { }
        }
        WebView wv = new WebView(this);
        wv.setBackgroundColor(Color.parseColor("#090918"));
        wv.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        WebSettings s = wv.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setJavaScriptCanOpenWindowsAutomatically(true);
        // Niente finestre multiple: il popup Google fallisce e il sito passa
        // da solo al login via redirect (fallback gia' presente in app-main.js).
        s.setSupportMultipleWindows(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        // User-agent "da Chrome": senza il marcatore "; wv" Google non blocca
        // l'accesso ("disallowed_useragent").
        String ua = s.getUserAgentString();
        if (ua != null) {
            ua = ua.replace("; wv)", ")").replace("Version/4.0 ", "");
            s.setUserAgentString(ua + " BarbellDivaApp/1.3.0");
        }

        CookieManager cm = CookieManager.getInstance();
        cm.setAcceptCookie(true);
        cm.setAcceptThirdPartyCookies(wv, true);

        wv.addJavascriptInterface(new NativeBridge(), "BarbellDivaNative");

        mDocStartShim = false;
        try {
            if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
                WebViewCompat.addDocumentStartJavaScript(wv, WAKE_LOCK_SHIM,
                        Collections.singleton(SITE_ORIGIN));
                mDocStartShim = true;
            }
        } catch (Throwable t) {
            CrashGuard.report("MainActivity.docStartShim", t);
        }

        wv.setWebViewClient(new DivaWebViewClient());
        wv.setWebChromeClient(new DivaChromeClient());
        wv.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) ->
                handleDownload(url, userAgent, contentDisposition, mimeType));

        mRoot.addView(wv, 0);
        mWebView = wv;
    }

    /* ---------------- Bridge JS <-> nativo ---------------- */

    private final class NativeBridge {
        @JavascriptInterface
        public void setKeepAwake(final boolean on) {
            runOnUiThread(() -> {
                try {
                    if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                    else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                } catch (Throwable t) {
                    CrashGuard.report("NativeBridge.setKeepAwake", t);
                }
            });
        }

        @JavascriptInterface
        public void saveBlob(String base64, String fileName, String mimeType) {
            final String name = safeName(fileName);
            final String mime = (mimeType == null || mimeType.isEmpty()) ? "application/octet-stream" : mimeType;
            try {
                byte[] data = Base64.decode(base64, Base64.DEFAULT);
                writeToDownloads(data, name, mime);
                toast("Salvato in Download: " + name);
            } catch (Throwable t) {
                CrashGuard.report("NativeBridge.saveBlob", t);
                toast("Salvataggio non riuscito");
            }
        }

        @JavascriptInterface
        public String version() {
            return "1.3.0";
        }
    }

    private static String safeName(String n) {
        if (n == null || n.trim().isEmpty()) n = "barbell-diva-backup.json";
        return n.replaceAll("[\\\\/:*?\"<>|]", "_");
    }

    private void writeToDownloads(byte[] data, String name, String mime) throws Exception {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContentResolver cr = getContentResolver();
            ContentValues v = new ContentValues();
            v.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
            v.put(MediaStore.MediaColumns.MIME_TYPE, mime);
            v.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
            Uri uri = cr.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
            if (uri == null) throw new IllegalStateException("MediaStore insert null");
            try (OutputStream os = cr.openOutputStream(uri)) {
                if (os == null) throw new IllegalStateException("stream null");
                os.write(data);
            }
        } else {
            File dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
            if (dir == null) dir = getFilesDir();
            if (!dir.exists()) dir.mkdirs();
            try (FileOutputStream fos = new FileOutputStream(new File(dir, name))) {
                fos.write(data);
            }
        }
    }

    private void toast(final String msg) {
        runOnUiThread(() -> Toast.makeText(MainActivity.this, msg, Toast.LENGTH_LONG).show());
    }

    /* ---------------- Download ---------------- */

    private void handleDownload(String url, String userAgent, String contentDisposition, String mimeType) {
        try {
            String name = URLUtil.guessFileName(url, contentDisposition, mimeType);
            if (url.startsWith("blob:")) {
                String js = "(function(){fetch('" + url.replace("'", "\\'") + "').then(function(r){return r.blob();})" +
                        ".then(function(b){var fr=new FileReader();fr.onloadend=function(){" +
                        "var s=String(fr.result||'');var i=s.indexOf(',');" +
                        "window.BarbellDivaNative.saveBlob(s.slice(i+1),window.__bdLastDownloadName||'" +
                        name.replace("'", "") + "',b.type||'" + (mimeType == null ? "" : mimeType.replace("'", "")) + "');};" +
                        "fr.readAsDataURL(b);}).catch(function(){});})();";
                mWebView.evaluateJavascript(js, null);
                return;
            }
            if (url.startsWith("data:")) {
                int comma = url.indexOf(',');
                String meta = url.substring(5, Math.max(5, comma));
                byte[] data = meta.contains("base64")
                        ? Base64.decode(url.substring(comma + 1), Base64.DEFAULT)
                        : Uri.decode(url.substring(comma + 1)).getBytes("UTF-8");
                writeToDownloads(data, safeName(name), mimeType == null ? "application/octet-stream" : mimeType);
                toast("Salvato in Download: " + name);
                return;
            }
            DownloadManager.Request r = new DownloadManager.Request(Uri.parse(url));
            r.setMimeType(mimeType);
            String cookies = CookieManager.getInstance().getCookie(url);
            if (cookies != null) r.addRequestHeader("cookie", cookies);
            r.addRequestHeader("User-Agent", userAgent);
            r.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            r.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name);
            DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
            if (dm != null) dm.enqueue(r);
            toast("Download avviato: " + name);
        } catch (Throwable t) {
            CrashGuard.report("MainActivity.handleDownload", t);
            toast("Download non riuscito");
        }
    }

    /* ---------------- Navigazione ---------------- */

    private static boolean isInternal(Uri uri) {
        if (uri == null) return false;
        String scheme = uri.getScheme();
        if (scheme == null) return false;
        if (scheme.equals("blob") || scheme.equals("data") || scheme.equals("about")) return true;
        if (!scheme.equals("https") && !scheme.equals("http")) return false;
        String host = uri.getHost();
        if (host == null) return false;
        host = host.toLowerCase();
        return host.equals("alicecheon.github.io")
                || host.contains("google")
                || host.contains("firebase")
                || host.endsWith("gstatic.com");
    }

    private final class DivaWebViewClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (isInternal(uri)) return false;
            try {
                Intent i = new Intent(Intent.ACTION_VIEW, uri);
                i.addCategory(Intent.CATEGORY_BROWSABLE);
                startActivity(i);
            } catch (ActivityNotFoundException e) {
                CrashGuard.event("nav", "no-handler " + uri);
            }
            return true;
        }

        @Override
        public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
            super.onPageStarted(view, url, favicon);
            // Rete di sicurezza: se la WebView e' troppo vecchia per lo script
            // "document start", iniettiamo lo shim il prima possibile.
            if (!mDocStartShim && url != null && url.startsWith(SITE_ORIGIN)) {
                view.evaluateJavascript(WAKE_LOCK_SHIM, null);
            }
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            if (!mDocStartShim && url != null && url.startsWith(SITE_ORIGIN)) {
                view.evaluateJavascript(WAKE_LOCK_SHIM, null);
            }
            CookieManager.getInstance().flush();
            applyImmersiveFullscreen();
        }

        @Override
        public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
            CrashGuard.event("webview", "render-process-gone");
            try {
                String url = view.getUrl();
                buildWebShell();
                mWebView.loadUrl(url != null && url.startsWith(SITE_ORIGIN) ? url : SITE_URL);
            } catch (Throwable t) {
                CrashGuard.report("MainActivity.onRenderProcessGone", t);
            }
            return true;
        }
    }

    private final class DivaChromeClient extends WebChromeClient {
        /** requestFullscreen() della pagina -> fullscreen nativo VERO. */
        @Override
        public void onShowCustomView(View view, CustomViewCallback callback) {
            if (mCustomView != null) {
                callback.onCustomViewHidden();
                return;
            }
            mCustomView = view;
            mCustomViewCallback = callback;
            mRoot.addView(view, new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
            applyImmersiveFullscreen();
            CrashGuard.event("fullscreen", "custom-view-on");
        }

        @Override
        public void onHideCustomView() {
            if (mCustomView == null) return;
            mRoot.removeView(mCustomView);
            mCustomView = null;
            if (mCustomViewCallback != null) {
                try { mCustomViewCallback.onCustomViewHidden(); } catch (Throwable ignored) { }
            }
            mCustomViewCallback = null;
            applyImmersiveFullscreen();
            CrashGuard.event("fullscreen", "custom-view-off");
        }

        @Override
        public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback,
                                         FileChooserParams fileChooserParams) {
            if (mFileCallback != null) mFileCallback.onReceiveValue(null);
            mFileCallback = filePathCallback;
            try {
                Intent i = fileChooserParams.createIntent();
                i.addCategory(Intent.CATEGORY_OPENABLE);
                if (fileChooserParams.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) {
                    i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                }
                startActivityForResult(i, REQ_FILE_CHOOSER);
                return true;
            } catch (Throwable t) {
                mFileCallback = null;
                CrashGuard.report("MainActivity.onShowFileChooser", t);
                return false;
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQ_FILE_CHOOSER || mFileCallback == null) return;
        Uri[] result = null;
        if (resultCode == RESULT_OK && data != null) {
            if (data.getClipData() != null) {
                int n = data.getClipData().getItemCount();
                result = new Uri[n];
                for (int k = 0; k < n; k++) result[k] = data.getClipData().getItemAt(k).getUri();
            } else if (data.getData() != null) {
                result = new Uri[]{data.getData()};
            }
        }
        mFileCallback.onReceiveValue(result);
        mFileCallback = null;
    }

    /* ---------------- Ciclo di vita ---------------- */

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (mCustomView != null) {
            new DivaChromeClient().onHideCustomView();
            if (mWebView != null) mWebView.evaluateJavascript(
                    "try{(document.exitFullscreen||document.webkitExitFullscreen).call(document)}catch(e){}", null);
            return;
        }
        if (mWebView != null && mWebView.canGoBack()) {
            mWebView.goBack();
            return;
        }
        super.onBackPressed();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) applyImmersiveFullscreen();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (mWebView != null) mWebView.saveState(outState);
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (mWebView != null) mWebView.onPause();
        CookieManager.getInstance().flush();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (mWebView != null) mWebView.onResume();
        applyImmersiveFullscreen();
    }

    @Override
    protected void onDestroy() {
        if (mWebView != null) {
            try {
                mRoot.removeView(mWebView);
                mWebView.destroy();
            } catch (Throwable ignored) { }
            mWebView = null;
        }
        super.onDestroy();
    }

    /**
     * Nasconde status bar e navigation bar a livello di finestra, in modo
     * "sticky" (tornano solo trascinando dal bordo, poi spariscono di nuovo).
     * Ricetta identica alla 1.1.x. Ogni passo e' protetto.
     */
    @SuppressWarnings("deprecation")
    private void applyImmersiveFullscreen() {
        try {
            Window w = getWindow();
            if (w == null) return;
            w.setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                    WindowManager.LayoutParams.FLAG_FULLSCREEN);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                WindowManager.LayoutParams lp = w.getAttributes();
                lp.layoutInDisplayCutoutMode =
                        WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS;
                w.setAttributes(lp);
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                w.setDecorFitsSystemWindows(false);
                WindowInsetsController c = w.getInsetsController();
                if (c != null) {
                    c.setSystemBarsBehavior(
                            WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                    c.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                }
            } else {
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
}
