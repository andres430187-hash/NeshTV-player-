package com.neshtv.iptv;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.res.Configuration;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView webView;
    private long lastBackPressTime = 0;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Keep screen on while playing video on TV
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Immersive full-screen mode for TV Box
        View decorView = getWindow().getDecorView();
        int uiOptions = View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
        decorView.setSystemUiVisibility(uiOptions);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);

        // Compatible with Android 6.0 (API 23) up to Android 14 (API 34)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            // Allow HTTP IPTV streams on HTTPS WebViews
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        // Enable hardware acceleration
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return false;
            }
        });

        // Load the local built assets or web endpoint
        webView.loadUrl("file:///android_asset/public/index.html");
    }

    /**
     * Intercept hardware physical TV Box and Android remote control keys:
     * - D-Pad (Up, Down, Left, Right, Center/OK)
     * - Hardware Back key (Code 4 / KEYCODE_BACK)
     * - Media Play / Pause keys
     */
    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getAction() == KeyEvent.ACTION_DOWN) {
            int keyCode = event.getKeyCode();

            // Hardware Back button on TV Box remote or Android phone
            if (keyCode == KeyEvent.KEYCODE_BACK) {
                if (webView != null) {
                    // Send custom cancelable 'nesh:back' event to JavaScript
                    webView.evaluateJavascript(
                        "(function() {" +
                        "  var evt = new CustomEvent('nesh:back', { cancelable: true });" +
                        "  var handled = !window.dispatchEvent(evt);" +
                        "  return handled;" +
                        "})();",
                        result -> {
                            // If JS handled the back event step-by-step, do nothing
                            // If not handled, allow double-back exit to prevent accidental app close
                            if ("false".equals(result) || "null".equals(result)) {
                                long currentTime = System.currentTimeMillis();
                                if (currentTime - lastBackPressTime < 2500) {
                                    finish();
                                } else {
                                    lastBackPressTime = currentTime;
                                }
                            }
                        }
                    );
                    return true;
                }
            }

            // Media keys on remote control
            if (keyCode == KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE ||
                keyCode == KeyEvent.KEYCODE_HEADSETHOOK) {
                if (webView != null) {
                    webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('nesh:playpause'));", null);
                    return true;
                }
            }
        }
        return super.dispatchKeyEvent(event);
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) {
            webView.onPause();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
