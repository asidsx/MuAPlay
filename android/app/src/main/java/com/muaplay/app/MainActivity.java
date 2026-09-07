package com.muaplay.app;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static MainActivity instance;

    public static MainActivity getInstance() {
        return instance;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        instance = this;

        // 1. Запрос разрешения на уведомления (Android 13+ / API 33)
        if (Build.VERSION.SDK_INT >= 33) {
            if (ContextCompat.checkSelfPermission(this, "android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{"android.permission.POST_NOTIFICATIONS"}, 101);
            }
        }

        // 2. Регистрация моста JavaScriptInterface для прямого управления MediaSession из WebView
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().addJavascriptInterface(new AudioBridge(), "NativeAudioBridge");
        }

        // 3. Запуск нативного фонового сервиса воспроизведения
        try {
            Intent serviceIntent = new Intent(this, AudioForegroundService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public class AudioBridge {
        @JavascriptInterface
        public void updateMedia(String title, String artist, String album, boolean isPlaying, long durationSec, long positionSec) {
            AudioForegroundService.updateMediaInfo(MainActivity.this, title, artist, album, isPlaying, durationSec, positionSec);
        }
    }

    public void dispatchAudioAction(String action) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (getBridge() != null) {
                    getBridge().triggerJSEvent("muaplayAudioAction", "window", "{ \"action\": \"" + action + "\" }");
                }
            }
        });
    }
}
