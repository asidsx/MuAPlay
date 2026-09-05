import os

def configure_android():
    # 1. Зависимость Media в android/app/build.gradle
    build_gradle = 'android/app/build.gradle'
    if os.path.exists(build_gradle):
        with open(build_gradle, 'r', encoding='utf-8') as f:
            content = f.read()
        if 'androidx.media:media:' not in content:
            content = content.replace("dependencies {", "dependencies {\n    implementation 'androidx.media:media:1.7.0'")
            with open(build_gradle, 'w', encoding='utf-8') as f:
                f.write(content)

    # 2. MainActivity.java и Нативный сервис AudioForegroundService.java
    java_dir = 'android/app/src/main/java/com/muaplay/app'
    os.makedirs(java_dir, exist_ok=True)

    main_activity_code = '''package com.muaplay.app;

import android.os.Bundle;
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
    }

    public void dispatchAudioAction(String action) {
        if (getBridge() != null) {
            getBridge().triggerJSEvent("muaplayAudioAction", "window", "{ \\"action\\": \\"" + action + "\\" }");
        }
    }
}
'''
    with open(os.path.join(java_dir, 'MainActivity.java'), 'w', encoding='utf-8') as f:
        f.write(main_activity_code)
    
    service_code = '''package com.muaplay.app;

import android.app.*;
import android.content.*;
import android.content.pm.ServiceInfo;
import android.os.*;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import androidx.core.app.NotificationCompat;
import androidx.media.app.NotificationCompat.MediaStyle;

public class AudioForegroundService extends Service {
    public static final String CHANNEL_ID = "muaplay_playback_channel";
    public static final int NOTIFICATION_ID = 1001;
    private MediaSessionCompat mediaSession;

    @Override
    public void onCreate() {
        super.onCreate();
        createChannel();
        mediaSession = new MediaSessionCompat(this, "MuAPlay_MediaSession");
        mediaSession.setFlags(MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS | MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS);
        mediaSession.setCallback(new MediaSessionCompat.Callback() {
            @Override public void onPlay() { sendAction("play"); }
            @Override public void onPause() { sendAction("pause"); }
            @Override public void onRewind() { sendAction("rewind_10"); }
            @Override public void onFastForward() { sendAction("forward_10"); }
        });
        mediaSession.setActive(true);
    }

    private void sendAction(String action) {
        if (MainActivity.getInstance() != null) MainActivity.getInstance().dispatchAudioAction(action);
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(CHANNEL_ID, "MuAPlay Воспроизведение", NotificationManager.IMPORTANCE_LOW);
            ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            getSystemService(NotificationManager.class).createNotificationChannel(ch);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        PendingIntent pToggle = PendingIntent.getService(this, 0, new Intent(this, AudioForegroundService.class), PendingIntent.FLAG_IMMUTABLE);
        
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("MuAPlay")
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setStyle(new MediaStyle().setMediaSession(mediaSession.getSessionToken()).setShowActionsInCompactView(0, 1, 2))
            .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
        return START_STICKY;
    }

    @Override public IBinder onBind(Intent intent) { return null; }
}
'''
    with open(os.path.join(java_dir, 'AudioForegroundService.java'), 'w', encoding='utf-8') as f:
        f.write(service_code)

    # 3. Добавление Service и Разрешений в AndroidManifest.xml
    manifest = 'android/app/src/main/AndroidManifest.xml'
    if os.path.exists(manifest):
        with open(manifest, 'r', encoding='utf-8') as f:
            m_content = f.read()

        permissions = [
            '<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />',
            '<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />',
            '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />',
            '<uses-permission android:name="android.permission.WAKE_LOCK" />'
        ]

        # Insert permissions safely before <application>
        permissions_to_add = [p for p in permissions if p not in m_content]
        if permissions_to_add and '<application' in m_content:
            perm_block = "\n    " + "\n    ".join(permissions_to_add) + "\n"
            m_content = m_content.replace('<application', f'{perm_block}\n    <application', 1)

        if 'AudioForegroundService' not in m_content and '</application>' in m_content:
            service_decl = '    <service android:name="com.muaplay.app.AudioForegroundService" android:foregroundServiceType="mediaPlayback" android:exported="false" />\n</application>'
            m_content = m_content.replace('</application>', service_decl, 1)

        with open(manifest, 'w', encoding='utf-8') as f:
            f.write(m_content)

if __name__ == '__main__':
    configure_android()
