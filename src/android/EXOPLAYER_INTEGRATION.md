# AndroidX Media3 ExoPlayer Native Integration Guide for Nesh TV

This document outlines the official implementation of **AndroidX Media3 ExoPlayer** in the Android container/wrapper (such as Android Studio or WebInto.App) for Nesh TV.

## 1. Gradle Dependencies (`app/build.gradle`)

Add the official AndroidX Media3 dependencies:

```groovy
dependencies {
    implementation 'androidx.media3:media3-exoplayer:1.3.1'
    implementation 'androidx.media3:media3-exoplayer-hls:1.3.1'
    implementation 'androidx.media3:media3-exoplayer-rtsp:1.3.1'
    implementation 'androidx.media3:media3-ui:1.3.1'
    implementation 'androidx.media3:media3-session:1.3.1'
}
```

## 2. Native Activity / Fragment (`MainActivity.kt`)

Initialize ExoPlayer and expose the JavaScript Bridge (`NeshExoPlayerBridge`) to the WebView:

```kotlin
package com.neshtv.app

import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.appcompat.app.AppCompatActivity
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView

class MainActivity : AppCompatActivity() {
    private var player: ExoPlayer? = null
    private lateinit var playerView: PlayerView
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        playerView = findViewById(R.id.player_view)
        webView = findViewById(R.id.webview)

        // Initialize ExoPlayer
        player = ExoPlayer.Builder(this).build().also { exoPlayer ->
            playerView.player = exoPlayer
        }

        // Expose JavaScript Bridge
        webView.settings.javaScriptEnabled = true
        webView.addJavascriptInterface(WebAppInterface(this), "AndroidExoPlayer")
        
        // Load Nesh TV web app URL
        webView.loadUrl("https://ais-dev-sirj5bdtvp7iz6yzywqhdi-881661771957.us-east1.run.app")
    }

    inner class WebAppInterface(private val activity: MainActivity) {
        @JavascriptInterface
        fun playStream(url: String) {
            activity.runOnUiThread {
                player?.let { exoPlayer ->
                    val mediaItem = MediaItem.fromUri(url)
                    exoPlayer.setMediaItem(mediaItem)
                    exoPlayer.prepare()
                    exoPlayer.play()
                }
            }
        }

        @JavascriptInterface
        fun stopStream() {
            activity.runOnUiThread {
                player?.stop()
            }
        }

        @JavascriptInterface
        fun setVolume(volume: Float) {
            activity.runOnUiThread {
                player?.volume = volume
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        player?.release()
    }
}
```

## 3. Web App Integration (`src/utils/iptvPlayer.ts`)

Nesh TV automatically detects `window.AndroidExoPlayer` when running inside the native Android wrapper and delegates playback to AndroidX Media3 ExoPlayer, falling back to HLS.js / MPEG-TS in standard web browsers.
