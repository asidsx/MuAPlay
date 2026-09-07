import os

def configure_android():
    # 1. Очистка устаревшего фонового сервиса
    java_dir = 'android/app/src/main/java/com/muaplay/music'
    os.makedirs(java_dir, exist_ok=True)
    
    old_service_file = os.path.join(java_dir, 'AudioForegroundService.java')
    if os.path.exists(old_service_file):
        try:
            os.remove(old_service_file)
        except Exception:
            pass

    # 2. Чистый стандартный MainActivity.java (как в AudioEco / Capacitor)
    main_activity_code = '''package com.muaplay.music;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }
}
'''
    with open(os.path.join(java_dir, 'MainActivity.java'), 'w', encoding='utf-8') as f:
        f.write(main_activity_code)

    # 3. Чистый AndroidManifest.xml без рискованных служб и WakeLock
    manifest_path = 'android/app/src/main/AndroidManifest.xml'
    clean_manifest = '''<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode|navigation|density"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    </application>

</manifest>
'''
    if os.path.exists(os.path.dirname(manifest_path)):
        with open(manifest_path, 'w', encoding='utf-8') as f:
            f.write(clean_manifest)

    print("Android configuration updated to clean standard Capacitor structure.")

if __name__ == '__main__':
    configure_android()
