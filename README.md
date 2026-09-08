# ⚡ MUAPLAY // CYBER_AUDIO 2077

<div align="center">

![MUAPLAY Banner](https://img.shields.io/badge/MUAPLAY-CYBER_AUDIO_2077-FF1A3C?style=for-the-badge&logo=android&logoColor=white)
![Hi-Res Lossless](https://img.shields.io/badge/AUDIO-192kHz%20%2F%2024--BIT%20LOSSLESS-00E5FF?style=for-the-badge&logo=soundcharts&logoColor=black)

**Профессиональный бесплатный Hi-Res аудио-плеер нового поколения для Android в эстетике Киберпанка.**  
*Чистый звук без сжатия, неоновый визуализатор, 10-полосный эквалайзер, поддержка FLAC/DSD/WAV и полный оффлайн-режим.*

---

### 📊 Динамическая статистика и статус проекта

<!-- Реальный динамический счетчик посещений от hits.seeyoufarm.com -->
[![Посещения](https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2Fasidsx%2Fmuaplay-cyber-audio&count_bg=%23FF1A3C&title_bg=%2318040C&icon=&icon_color=%23E7E7E7&title=%D0%9F%D0%9E%D0%A1%D0%95%D0%A9%D0%95%D0%9D%D0%98%D0%AF&edge_flat=true)](https://github.com)
<!-- Реальный счетчик просмотров GHPVC -->
[![Просмотры](https://komarev.com/ghpvc/?username=asidsx-muaplay&color=ff1a3c&style=flat-square&label=%D0%9F%D0%A0%D0%9E%D0%A1%D0%9C%D0%9E%D0%A2%D0%A0%D0%AB)](https://github.com)
<!-- Реальные загрузки через GitHub Releases API -->
[![GitHub Downloads](https://img.shields.io/github/downloads/asidsx/muaplay-cyber-audio/total?color=00E5FF&style=flat-square&logo=github&label=%D0%A1%D0%9A%D0%90%D0%A7%D0%98%D0%92%D0%90%D0%9D%D0%98%D0%AF)](https://github.com)
<!-- Реальные звезды GitHub -->
[![GitHub Stars](https://img.shields.io/github/stars/asidsx/muaplay-cyber-audio?style=flat-square&logo=github&color=FFD700&label=%D0%97%D0%92%D0%81%D0%97%D0%94%D0%AB)](https://github.com)
<!-- Реальная дата последнего коммита -->
[![Last Commit](https://img.shields.io/github/last-commit/asidsx/muaplay-cyber-audio?style=flat-square&color=3DDC84&label=%D0%9E%D0%91%D0%9D%D0%9E%D0%92%D0%9B%D0%95%D0%9D%D0%9E)](https://github.com)
<!-- Платформа и лицензия -->
[![Платформа](https://img.shields.io/badge/%D0%9F%D0%9B%D0%90%D0%A2%D0%A4%D0%9E%D0%A0%D0%9C%D0%90-Android%208.0%2B%20%7C%20PWA-3DDC84?style=flat-square&logo=android&logoColor=white)](https://github.com)
[![Лицензия](https://img.shields.io/badge/%D0%9B%D0%98%D0%A6%D0%95%D0%9D%D0%97%D0%98%D0%AF-CC%20BY--NC--SA%204.0%20(NON--COMMERCIAL)-FF1A3C?style=flat-square)](LICENSE)
[![No Commercial Use](https://img.shields.io/badge/%D0%9F%D0%A0%D0%9E%D0%94%D0%90%D0%96%D0%90-%D0%97%D0%90%D0%9F%D0%A0%D0%95%D0%A9%D0%95%D0%9D%D0%90%20(FREE%20ONLY)-00E5FF?style=flat-square)](LICENSE)

</div>

---

## 🌟 Ключевые возможности

### 🔊 1. Neural DSP Hi-Res Audio Engine
- **Поддержка студийного звука:** Воспроизведение несжатого аудио до **192 kHz / 24-bit / 32-bit Float**.
- **Широкий спектр форматов:**
  - **Lossless:** `FLAC`, `WAV`, `ALAC`, `AIFF`, `DSF`, `DFF` (DSD), `APE`.
  - **Compressed:** `MP3`, `M4A`, `AAC`, `OGG`, `OPUS`, `WMA`, `WEBA`.
- **Строгий фильтр файлов:** Автоматический отсев не-аудио файлов (PDF, DOCX, ZIP и др.) без ложной нагрузки на систему.

### 🎛️ 2. Студийный 10-полосный эквалайзер и аудио-эффекты
- Регулировка частот от **32 Гц** (глубокий суб-бас) до **16 кГц** (кристальные верха).
- **Bass Boost (Усилитель баса):** Мощная накачка низких частот без клиппинга.
- **Cyber Spatializer (3D объемный звук):** Пространственное расширение стереобазы для наушников.
- **Пресеты звучания:** `FLAT`, `BASS BOOST`, `CYBER ROCK`, `NEON ELECTRO`, `VOCAL CLARITY`, `HI-RES MASTER`.

### 🌌 3. Реактивное Кибер-Кольцо эквалайзера (CyberReactiveRing)
- **Живая реакция на звук:** Многосегментный холст вокруг обложки трека в реальном времени считывает FFT-спектр (басы, средние, верха) через `Web Audio AnalyserNode`.
- **Энергосбережение (Battery Saver Mode):** Быстрый тап по обложке альбома мгновенно останавливает GPU-анимацию для экономии заряда батареи в долгих поездках.

### 👆 4. Интуитивные сенсорные свайп-жесты
- **Свайп влево ($\leftarrow$):** Мгновенное переключение на **следующий трек**.
- **Свайп вправо ($\rightarrow$):** Переключение на **предыдущий трек**.
- **Поддержка свайпов везде:** В полноэкранном плеере («Холо-дек»), на экране блокировки и в мини-плеере.
- **Свайп вверх ($\uparrow$):** Разблокировка киберпанк-экрана блокировки.

### 📜 5. Синхронизированный караоке-текст песен (LRC)
- Извлечение встроенных слов из метаданных ID3 (`USLT`/`SYLT`), Vorbis (`LYRICS`), MP4 (`©lyr`).
- Поддержка внешних сопутствующих файлов `.lrc` и `.txt`.
- Автоматический онлайн-поиск текстов песен через API **LRCLIB** с посимвольной подсветкой текущей строки.

### 🔒 6. Cyber Lockscreen (Экран блокировки)
- Полный киберпанк-интерфейс с неоновыми часами, датой, зарядом батареи.
- Встроенный светодиодный фонарик (Torch).
- Интерактивный музыкальный мини-виджет с управлением жестами и живой бегущей строкой текста.

### 💾 7. 100% Оффлайн и Безопасность данных
- Локальное хранилище **IndexedDB**: треки, кэшированные обложки и волнограммы сохраняются прямо на устройстве.
- Никаких скрытых платежей, подписок, трекеров и рекламы.

---

## 📱 Скриншоты и экраны интерфейса

<div align="center">

| 🎵 Медиатека треков | 🌌 Холо-дек (Now Playing) | 🎛️ 10-Band EQ & DSP |
| :---: | :---: | :---: |
| <img src="docs/screenshots/library.png" width="250" alt="Медиатека MUAPLAY" /> | <img src="docs/screenshots/now_playing.png" width="250" alt="Холо-дек Плеер" /> | <img src="docs/screenshots/equalizer.png" width="250" alt="10-Band Эквалайзер" /> |
| **Оффлайн Медиатека**<br><sub>FLAC / WAV / MP3 • Поиск и обложки</sub> | **CyberРеактивное Кольцо**<br><sub>Караоке LRC • FFT-визуализатор • Жесты</sub> | **Студийный DSP Движок**<br><sub>Sandevistan Bass • 3D Soundstage</sub> |

</div>

---

## 🚀 Установка и запуск

### Вариант 1: Установка как PWA на Android (Рекомендуется)
1. Откройте приложение в браузере Chrome на вашем смартфоне.
2. Нажмите меню **«•••»** (или значок в адресной строке).
3. Выберите **«Установить приложение»** / **«Добавить на главный экран»**.
4. Запускайте MUAPLAY как полноценное нативное Android-приложение без рамок браузера с поддержкой оффлайн-режима.

### Вариант 2: Сборка и подпись нативного Android APK (Android 14–17)

Проект полностью настроен для сборки релизного APK с поддержкой схем подписи **v1, v2, v3 и v4**, выравниванием `zipalign 4` и совместимостью с **Google Play Protect**:

```bash
# 1. Сборка веб-дистрибутива и синхронизация Capacitor
npm run build
npm run cap:sync

# 2. Автоматическая сборка, выравнивание (zipalign) и подпись (apksigner v1-v4)
npm run apk:sign
```

*Готовый файл появится в `android/app/build/outputs/apk/release/app-release.apk`.*

### Вариант 3: Запуск веб-версии для разработчиков (Node.js)

```bash
# Клонируйте репозиторий
git clone https://github.com/your-username/muaplay-cyber-audio.git

# Перейдите в папку проекта
cd muaplay-cyber-audio

# Установите зависимости
npm install

# Запустите сервер разработки
npm run dev
```

Приложение будет доступно по адресу: `http://localhost:3000`

---

## 🛠️ Технологический стек

- **Core:** React 18, TypeScript, Vite
- **Аудио-движок:** Web Audio API (`AudioContext`, `BiquadFilterNode`, `AnalyserNode`, `StereoPannerNode`, `ConvolverNode`)
- **Графика и анимация:** HTML5 Canvas 2D (60 FPS FFT Spectrum Visualizer), Tailwind CSS, Lucide Icons
- **Хранилище:** IndexedDB (`idb-keyval`), LocalStorage
- **Метаданные:** `music-metadata-browser`, Deezer API, iTunes Search API, LRCLIB API

---

## 📄 Лицензия и условия использования

Проект распространяется под некоммерческой публичной лицензией **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 (CC BY-NC-SA 4.0)** / **PolyForm Noncommercial 1.0.0**:

- ✅ **Разрешено:** Свободное личное, домашнее, образовательное и некоммерческое использование, изучение кода, создание личных модификаций и форков с указанием авторства.
- 🚫 **СТРОГО ЗАПРЕЩЕНО:** Продажа приложения или его исходного кода, распространение на платной основе, включение платных подписок, монетизация через рекламу, а также публикация платных сборок в магазинах приложений (Google Play, RuStore, App Store и т.д.).

Подробный юридический текст условий доступен в файле [LICENSE](LICENSE).

<div align="center">

**MUAPLAY // CYBER_AUDIO 2077** • *Создано для истинных ценителей чистого звука и кибернетической эстетики.*

</div>
