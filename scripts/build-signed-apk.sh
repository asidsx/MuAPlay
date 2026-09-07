#!/usr/bin/env bash
# ==============================================================================
# MUAPLAY // CYBER_AUDIO 2077 - Production APK Build & Sign Script
# Android 14 / 15 / 16 / 17 (API 34-37) Compliant Signing with Schemes v1..v4
# ==============================================================================

set -e

echo "⚡ [MUAPLAY] Сборка веб-дистрибутива (Vite)..."
npm run build

echo "⚡ [MUAPLAY] Синхронизация Capacitor Android..."
npx cap sync android

KEYSTORE="android/app/muaplay-release.keystore"
ALIAS="muaplay"
STOREPASS="muaplay2077"

if [ ! -f "$KEYSTORE" ]; then
    echo "🔑 [MUAPLAY] Создание RSA 4096 Release Keystore..."
    keytool -genkey -v \
      -keystore "$KEYSTORE" \
      -alias "$ALIAS" \
      -keyalg RSA \
      -keysize 4096 \
      -sigalg SHA256withRSA \
      -validity 10000 \
      -storepass "$STOREPASS" \
      -keypass "$STOREPASS" \
      -dname "CN=MuAPlay, OU=Audio, O=CyberAudio, L=City, ST=State, C=RU"
fi

echo "📦 [MUAPLAY] Сборка Release APK через Gradle..."
cd android
./gradlew assembleRelease
cd ..

UNSIGNED_APK="android/app/build/outputs/apk/release/app-release-unsigned.apk"
SIGNED_APK="android/app/build/outputs/apk/release/app-release.apk"
ALIGNED_APK="android/app/build/outputs/apk/release/app-release-aligned.apk"

if [ -f "$UNSIGNED_APK" ]; then
    echo "⚙️ [MUAPLAY] Выравнивание байтов (zipalign 4)..."
    zipalign -v -p -f 4 "$UNSIGNED_APK" "$ALIGNED_APK"

    echo "🔐 [MUAPLAY] Подпись APK (apksigner с поддержкой v1, v2, v3, v4)..."
    apksigner sign \
      --ks "$KEYSTORE" \
      --ks-key-alias "$ALIAS" \
      --ks-pass "pass:$STOREPASS" \
      --key-pass "pass:$STOREPASS" \
      --v1-signing-enabled true \
      --v2-signing-enabled true \
      --v3-signing-enabled true \
      --v4-signing-enabled true \
      --out "$SIGNED_APK" \
      "$ALIGNED_APK"

    echo "✅ [MUAPLAY] Проверка подписи apksigner:"
    apksigner verify --verbose "$SIGNED_APK"
fi

echo "✨ [MUAPLAY] Готово! Релизный APK готов к установке."
