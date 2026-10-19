# ⏳ ZenFocus — Modern Pomodoro Timer

A modern, high-precision web-based Pomodoro timer designed with glassmorphism aesthetics, dynamic SVG circular countdown, ambient glowing themes, and triumphant audio fanfare notifications.

---

## ✨ Features

- **Large 25-Minute Countdown Display**: Monospaced tabular numerals (`25:00`) with zero layout shifts.
- **Dynamic Circular Progress Ring**: Smooth SVG circular track with glowing gradient animation.
- **Custom Duration Input**: Set any custom duration in minutes directly on the main card or use quick preset pills (`1m`, `5m`, `15m`, `25m`, `45m`, `60m`).
- **Selectable End-of-Timer Music**: 6 high-fidelity audio options with instant audio previews:
  - 🎺 **Victory Fanfare**: Triumphant brass fanfare celebration (`alarm.wav`)
  - 🧘 **Zen Temple Chime**: Soothing 528Hz Solfeggio singing bowl chime
  - 💎 **Crystal Marimba**: Bright ascending 4-note crystalline triad
  - ⚡ **Modern Pulse**: Crisp contemporary electronic dual alert
  - 🔔 **Acoustic Bell**: Warm resonant meditation desk bell
  - ✨ **Celestial Harp**: Gentle atmospheric ambient glissando
- **Settings & Theme Navigation**:
  - Always-visible sticky **Save & Apply** button and **Back** buttons in both the header and footer.
  - Interactive cards with active checkmark indicators for both music and ambient background lighting.
  - One-click quick background light switcher in the main header.
- **Session & Streak Tracker**: Daily completed sessions, total focus time, and streak count saved to `localStorage`.
- **Keyboard Shortcuts**:
  - <kbd>Space</kbd>: Start / Pause
  - <kbd>R</kbd>: Reset current timer
  - <kbd>S</kbd>: Skip session

---

## 🚀 Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/zenfocus-pomodoro.git
   cd zenfocus-pomodoro
   ```

2. **Run locally**:
   Open `index.html` in any modern web browser or serve via Python / Node:
   ```bash
   # Using Python
   python -m http.server 3000

   # Or using Node / npx
   npx serve .
   ```

3. Open **`http://localhost:3000`** in your browser.

---

## 🛠️ Built With

- **HTML5**: Semantic markup, SVG icons and rings, audio integration.
- **Vanilla CSS**: Custom properties, glassmorphism (`backdrop-filter`), keyframe animations.
- **Vanilla JavaScript**: High-accuracy drift-free countdown engine (`Date.now()`), Web Audio API chime generator, `localStorage` persistence.
- **Google Fonts**: `Plus Jakarta Sans` & `Space Grotesk`.

---

## 📄 License

MIT License. Free to use and modify for personal and commercial projects.
