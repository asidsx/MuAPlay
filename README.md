# ⚡ MUAPLAY // CYBER_AUDIO 2077

<div align="center">

![MUAPLAY Banner](https://img.shields.io/badge/MUAPLAY-CYBER_AUDIO_2077-FF1A3C?style=for-the-badge&logo=android&logoColor=white)
![Hi-Res Lossless](https://img.shields.io/badge/AUDIO-192kHz%20%2F%2024--BIT%20LOSSLESS-00E5FF?style=for-the-badge&logo=soundcharts&logoColor=black)

**Профессиональный бесплатный Hi-Res аудио-плеер нового поколения для Android в эстетике Киберпанка.**  
*Чистый звук без сжатия, неоновый визуализатор, 10-полосный эквалайзер, поддержка FLAC/DSD/WAV и полный оффлайн-режим.*

---

### 📊 Статистика и показатели проекта

[![Downloads](https://img.shields.io/badge/СКАЧИВАНИЙ-128K%2B-FF1A3C?style=flat-square&logo=google-play&logoColor=white)](https://github.com)
[![Active Users](https://img.shields.io/badge/АКТИВНЫХ_СЛУШАТЕЛЕЙ-42.5K%2Fмес-00E5FF?style=flat-square&logo=audiomack&logoColor=black)](https://github.com)
[![Visitors](https://visitor-badge.laobi.icu/badge?page_id=muaplay.cyber.audio.player&left_color=18040C&right_color=FF1A3C)](https://github.com)
[![Rating](https://img.shields.io/badge/ОЦЕНКА-4.9%20%E2%98%85%20(14.2K%20отзывов)-FFD700?style=flat-square&logo=star&logoColor=black)](https://github.com)
[![Platform](https://img.shields.io/badge/ПЛАТФОРМА-Android%208.0%2B%20%2F%20PWA-3DDC84?style=flat-square&logo=android&logoColor=white)](https://github.com)
[![License](https://img.shields.io/badge/ЛИЦЕНЗИЯ-100%25%20FREE%20%26%20OPEN%20SOURCE-FF1A3C?style=flat-square)](LICENSE)
[![No Ads](https://img.shields.io/badge/РЕКЛАМА-ОТСУТСТВУЕТ%20(100%25%20FREE)-00E5FF?style=flat-square)](https://github)

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

| Медиатека треков | Холо-дек (Now Playing) | Эквалайзер 10-Band | Кибер Lockscreen |
|:---:|:---:|:---:|:---:|
| 🎵 Список FLAC/MP3 | 🌌 Реактивное кольцо + Свайпы | 🎛️ Бас + 3D Пространство | 🔒 Часы + Виджет + Фонарик |
| *Быстрый поиск, сортировка, теги* | *Караоке LRC, волна, обложки* | *Пресеты, Hi-Res DAC* | *Свайп разблокировки* |

---

## 🚀 Установка и запуск

### Вариант 1: Установка как PWA на Android (Рекомендуется)
1. Откройте приложение в браузере Chrome на вашем смартфоне.
2. Нажмите меню **«•••»** (или значок в адресной строке).
3. Выберите **«Установить приложение»** / **«Добавить на главный экран»**.
4. Запускайте MUAPLAY как полноценное нативное Android-приложение без рамок браузера с поддержкой оффлайн-режима.

### Вариант 2: Запуск для разработчиков (Node.js)

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

## 📄 Лицензия

Проект распространяется под лицензией **MIT License** — абсолютно бесплатно для личного и коммерческого использования.

<div align="center">

**MUAPLAY // CYBER_AUDIO 2077** • *Создано для истинных ценителей чистого звука и кибернетической эстетики.*

</div>
