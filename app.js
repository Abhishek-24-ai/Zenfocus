/**
 * ZenFocus — Modern Pomodoro Timer
 * High-precision countdown, Web Audio API sound synthesis, responsive SVG ring, and productivity stats.
 */

class PomodoroTimer {
  constructor() {
    // Configurable Durations (in seconds)
    this.durations = {
      pomodoro: 25 * 60,
      shortBreak: 5 * 60,
      longBreak: 15 * 60,
    };

    // State
    this.currentMode = 'pomodoro'; // 'pomodoro' | 'shortBreak' | 'longBreak'
    this.totalDuration = this.durations.pomodoro;
    this.timeLeft = this.totalDuration;
    this.timerInterval = null;
    this.isRunning = false;
    this.isCompleted = false; // Flag for when countdown finishes
    this.endTime = null; // For drift-free countdown
    this.flashTimer = null;

    // Stats
    this.stats = {
      completedSessions: 0,
      totalFocusMinutes: 0,
      streak: 0,
      cycleCount: 1, // 1 to 4
    };

    // User Preferences
    this.preferences = {
      soundEnabled: true,
      chimeStyle: 'fanfare',
      volume: 0.85,
      autoBreak: false,
      theme: 'midnight',
    };

    // Audio Engine
    this.audioCtx = null;

    // SVG Ring Constants
    this.RING_RADIUS = 145;
    this.CIRCUMFERENCE = 2 * Math.PI * this.RING_RADIUS; // ~911.06

    this.initDOM();
    this.loadState();
    this.initAudioContext();
    this.bindEvents();
    this.updateDisplay();
    this.updateModeStyles();
  }

  /* -------------------------------------------------------------
     DOM Elements Initialization
  ------------------------------------------------------------- */
  initDOM() {
    // Buttons & Controls
    this.timerDisplay = document.getElementById('timer-display');
    this.progressCircle = document.getElementById('progress-circle');
    this.btnToggle = document.getElementById('btn-toggle');
    this.btnToggleLabel = document.getElementById('btn-toggle-label');
    this.iconPlay = document.getElementById('icon-play');
    this.iconPause = document.getElementById('icon-pause');
    this.btnReset = document.getElementById('btn-reset');
    this.btnSkip = document.getElementById('btn-skip');

    // Header Controls
    this.btnSoundToggle = document.getElementById('btn-sound-toggle');
    this.soundIconOn = document.getElementById('sound-icon-on');
    this.soundIconOff = document.getElementById('sound-icon-off');
    this.btnTestSound = document.getElementById('btn-test-sound');

    // Tabs & Glider
    this.tabButtons = document.querySelectorAll('.tab-btn');
    this.tabGlider = document.querySelector('.tab-glider');

    // Badges & Cycle
    this.sessionBadge = document.getElementById('session-badge');
    this.badgeText = document.getElementById('badge-text');
    this.cycleText = document.getElementById('cycle-text');
    this.cycleDots = document.getElementById('cycle-dots');

    // Stats
    this.statCompleted = document.getElementById('stat-completed');
    this.statFocusTime = document.getElementById('stat-focus-time');
    this.statStreak = document.getElementById('stat-streak');

    // Settings Modal & Back Buttons
    this.settingsModal = document.getElementById('settings-modal');
    this.btnSettingsOpen = document.getElementById('btn-settings-open');
    this.btnSettingsClose = document.getElementById('btn-settings-close');
    this.btnSettingsBack = document.getElementById('btn-settings-back');
    this.btnSettingsFooterBack = document.getElementById('btn-settings-footer-back');
    this.btnSettingsSave = document.getElementById('btn-settings-save');
    this.btnSettingsReset = document.getElementById('btn-settings-reset');
    this.inputPomodoro = document.getElementById('input-pomodoro');
    this.inputShortBreak = document.getElementById('input-shortBreak');
    this.inputLongBreak = document.getElementById('input-longBreak');
    this.settingSoundEnabled = document.getElementById('setting-sound-enabled');
    this.settingChimeStyle = document.getElementById('setting-chime-style');
    this.settingVolume = document.getElementById('setting-volume');
    this.settingVolumeLabel = document.getElementById('setting-volume-label');
    this.settingAutoBreak = document.getElementById('setting-auto-break');

    // Header Music & Theme Controls
    this.btnThemeQuick = document.getElementById('btn-theme-quick');
    this.currentMusicPill = document.getElementById('current-music-pill');
    this.activeSoundPill = document.getElementById('active-sound-pill');
    this.activeThemePill = document.getElementById('active-theme-pill');

    // Interactive Music Cards
    this.musicCards = document.querySelectorAll('.music-card-btn');
    this.musicPreviewBtns = document.querySelectorAll('.music-card-preview-btn');

    // Toast
    this.toastNotification = document.getElementById('toast-notification');
    this.toastTitle = document.getElementById('toast-title');
    this.toastMessage = document.getElementById('toast-message');
    this.btnToastDismiss = document.getElementById('btn-toast-dismiss');

    // Custom Time in Minutes Controls
    this.customMinutesInput = document.getElementById('custom-minutes-input');
    this.btnSetCustomTime = document.getElementById('btn-set-custom-time');
    this.presetPills = document.querySelectorAll('.preset-pill');

    // Alarm Sound Audio Element
    this.alarmAudio = document.getElementById('alarm-audio');

    // Theme Switchers inside Settings Modal
    this.themeSwatches = document.querySelectorAll('.theme-card-btn, .theme-swatch-btn');
    this.settingTheme = document.getElementById('setting-theme');

    // Sound metadata mapping
    this.soundMeta = {
      fanfare: { name: 'Victory Fanfare', icon: '🎺', desc: 'Triumphant Brass' },
      zen: { name: 'Zen Temple Chime', icon: '🧘', desc: '528Hz Solfeggio' },
      crystal: { name: 'Crystal Marimba', icon: '💎', desc: 'Melodic Triad' },
      digital: { name: 'Modern Pulse', icon: '⚡', desc: 'Crisp Dual Alert' },
      bell: { name: 'Acoustic Bell', icon: '🔔', desc: 'Warm Desk Chime' },
      harp: { name: 'Celestial Harp', icon: '✨', desc: 'Ambient Glissando' },
    };

    // Configure progress circle
    if (this.progressCircle) {
      this.progressCircle.style.strokeDasharray = `${this.CIRCUMFERENCE}`;
      this.progressCircle.style.strokeDashoffset = '0';
    }
  }

  /* -------------------------------------------------------------
     Audio Context & Synthesized Sound Generation (Zero External Files)
  ------------------------------------------------------------- */
  initAudioContext() {
    const resumeAudio = () => {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      if (this.alarmAudio) {
        this.alarmAudio.load();
      }
    };

    window.addEventListener('click', resumeAudio, { once: true });
    window.addEventListener('keydown', resumeAudio, { once: true });
  }

  ensureAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Synthesize rich chime notifications using Web Audio API
   */
  playChime(type = this.preferences.chimeStyle) {
    if (!this.preferences.soundEnabled) return;
    this.ensureAudioContext();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.preferences.volume, now);
    masterGain.connect(ctx.destination);

    if (type === 'fanfare') {
      // Strong Victory Fanfare Melody with rich synth brass, bell harmonics, and punchy sub bass
      const notes = [
        { freq: 523.25, time: 0, dur: 0.22, type: 'triangle', gain: 0.75 },     // C5
        { freq: 659.25, time: 0.18, dur: 0.22, type: 'triangle', gain: 0.75 },  // E5
        { freq: 783.99, time: 0.36, dur: 0.22, type: 'triangle', gain: 0.85 },  // G5
        { freq: 1046.50, time: 0.54, dur: 0.55, type: 'sawtooth', gain: 0.65 }, // C6 accent
        { freq: 130.81, time: 0.54, dur: 0.65, type: 'sine', gain: 0.7 },      // Sub C3
        { freq: 880.00, time: 1.05, dur: 0.20, type: 'triangle', gain: 0.75 },  // A5
        { freq: 987.77, time: 1.25, dur: 0.20, type: 'triangle', gain: 0.80 },  // B5
        { freq: 1046.50, time: 1.45, dur: 0.25, type: 'triangle', gain: 0.85 }, // C6
        // Grand Final Triumph Chord (E6 + C6 + G5 + C5 + C3 Bass)
        { freq: 1318.51, time: 1.68, dur: 2.2, type: 'triangle', gain: 0.90 }, // E6
        { freq: 1046.50, time: 1.68, dur: 2.2, type: 'sine', gain: 0.80 },     // C6
        { freq: 783.99, time: 1.68, dur: 2.2, type: 'sine', gain: 0.70 },      // G5
        { freq: 523.25, time: 1.68, dur: 2.2, type: 'sine', gain: 0.60 },      // C5
        { freq: 130.81, time: 1.68, dur: 1.8, type: 'sine', gain: 0.75 }       // C3 Punch
      ];

      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = note.type;
        osc.frequency.setValueAtTime(note.freq, now + note.time);

        gain.gain.setValueAtTime(0.001, now + note.time);
        gain.gain.linearRampToValueAtTime(note.gain, now + note.time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.dur);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + note.time);
        osc.stop(now + note.time + note.dur + 0.1);
      });
    } else if (type === 'zen') {
      // Peaceful Zen Meditation Chime (Harmonic frequencies with soothing exponential decay)
      const freqs = [528, 1056, 1584, 2112]; // 528 Hz Solfeggio & overtones
      const weights = [0.65, 0.28, 0.12, 0.06];

      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(weights[i], now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.4);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 3.6);
      });
    } else if (type === 'crystal') {
      // Crystal Marimba 4-Note Melodic Triad
      const notes = [
        { freq: 523.25, time: 0 },    // C5
        { freq: 659.25, time: 0.16 }, // E5
        { freq: 783.99, time: 0.32 }, // G5
        { freq: 1046.5, time: 0.48 }  // C6
      ];

      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.freq, now + note.time);

        gain.gain.setValueAtTime(0.001, now + note.time);
        gain.gain.linearRampToValueAtTime(0.55, now + note.time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + 1.8);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + note.time);
        osc.stop(now + note.time + 2.0);
      });
    } else if (type === 'bell') {
      // Warm resonant acoustic meditation desk bell
      const bellFreqs = [587.33, 1174.66, 1762.0, 2349.3]; // D5 and natural bell harmonics
      const bellGains = [0.65, 0.35, 0.15, 0.08];
      const decays = [2.8, 2.0, 1.4, 0.9];

      bellFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(bellGains[idx], now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + decays[idx]);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + decays[idx] + 0.1);
      });
    } else if (type === 'harp') {
      // Celestial Cosmic Harp - gentle arpeggiated glissando
      const notes = [
        { freq: 523.25, time: 0 },    // C5
        { freq: 659.25, time: 0.12 }, // E5
        { freq: 783.99, time: 0.24 }, // G5
        { freq: 987.77, time: 0.36 }, // B5
        { freq: 1046.50, time: 0.48 }, // C6
        { freq: 1318.51, time: 0.60 }  // E6
      ];

      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, now + note.time);

        gain.gain.setValueAtTime(0.001, now + note.time);
        gain.gain.linearRampToValueAtTime(0.45, now + note.time + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + 2.2);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + note.time);
        osc.stop(now + note.time + 2.4);
      });
    } else {
      // Modern Digital Pulse Chime
      const notes = [
        { freq: 880, time: 0 },
        { freq: 1760, time: 0.12 }
      ];

      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, now + note.time);

        gain.gain.setValueAtTime(0.45, now + note.time);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + 0.8);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + note.time);
        osc.stop(now + note.time + 0.9);
      });
    }
  }

  // Gentle tactile click sound for interactions
  playClickSound() {
    if (!this.preferences.soundEnabled || !this.audioCtx) return;
    try {
      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

      gain.gain.setValueAtTime(0.08 * this.preferences.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Fail silently if audio context unavailable
    }
  }

  /**
   * Primary method to play completion music.
   * If fanfare is selected: plays alarm.wav (with Web Audio fallback).
   * For all other music: stops alarm.wav and synthesizes the exact chosen music!
   */
  playMusic(style = this.preferences.chimeStyle) {
    if (!this.preferences.soundEnabled) return;

    if (style === 'fanfare') {
      if (this.alarmAudio) {
        try {
          this.alarmAudio.volume = Math.max(0, Math.min(1, this.preferences.volume));
          this.alarmAudio.currentTime = 0;
          const playPromise = this.alarmAudio.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              this.playChime('fanfare');
            });
          }
        } catch {
          this.playChime('fanfare');
        }
      } else {
        this.playChime('fanfare');
      }
    } else {
      // For all non-fanfare sounds, ensure alarm.wav is stopped
      if (this.alarmAudio) {
        try {
          this.alarmAudio.pause();
          this.alarmAudio.currentTime = 0;
        } catch {}
      }
      this.playChime(style);
    }
  }

  /**
   * Preview a specific music track with toast feedback
   */
  previewMusic(style) {
    this.stopZeroAlarm();
    this.playMusic(style);
    const meta = this.soundMeta[style] || { name: style, icon: '🎵' };
    this.showToast('Music Preview', `Playing ${meta.name} ${meta.icon}`);
  }

  /**
   * Select a music track, update active cards and indicators, and preview it
   */
  selectMusic(style, preview = false) {
    if (!this.soundMeta[style]) style = 'fanfare';
    this.preferences.chimeStyle = style;

    // Update active state on music cards
    if (this.musicCards) {
      this.musicCards.forEach((card) => {
        const m = card.getAttribute('data-music');
        card.classList.toggle('active', m === style);
      });
    }

    // Sync select element
    if (this.settingChimeStyle) {
      this.settingChimeStyle.value = style;
    }

    // Update active badges & pills
    const meta = this.soundMeta[style] || { name: style, icon: '🎵' };
    if (this.activeSoundPill) {
      this.activeSoundPill.textContent = `Music: ${meta.name}`;
    }
    if (this.currentMusicPill) {
      this.currentMusicPill.textContent = meta.name;
    }

    this.savePreferences();

    if (preview) {
      this.previewMusic(style);
    }
  }

  /**
   * Test currently selected music from header button
   */
  testSelectedMusic() {
    this.stopZeroAlarm();
    this.playMusic(this.preferences.chimeStyle);
    const meta = this.soundMeta[this.preferences.chimeStyle] || { name: 'Victory Fanfare', icon: '🎺' };
    this.showToast('Test Music', `Playing ${meta.name} ${meta.icon}`);
  }

  /**
   * Sound effect triggered when the timer reaches 00:00.
   * Plays the user's selected music (Fanfare, Zen, Crystal, Modern Pulse, Bell, or Harp).
   */
  playZeroAlarm() {
    if (!this.preferences.soundEnabled) return;

    // Play the currently selected music
    this.playMusic(this.preferences.chimeStyle);

    // Visual time-up flash on timer digits
    if (this.timerDisplay) {
      this.timerDisplay.classList.add('time-up');
      clearTimeout(this.flashTimer);
      this.flashTimer = setTimeout(() => {
        this.timerDisplay.classList.remove('time-up');
      }, 5000);
    }
  }

  /**
   * Silence alarm sound effect and remove time-up animation
   */
  stopZeroAlarm() {
    if (this.alarmAudio) {
      try {
        this.alarmAudio.pause();
        this.alarmAudio.currentTime = 0;
      } catch {}
    }
    if (this.timerDisplay) {
      this.timerDisplay.classList.remove('time-up');
    }
    clearTimeout(this.flashTimer);
  }

  /**
   * Set custom duration in minutes from input or quick preset.
   * Stops any playing alarm, resets cleanly, and waits for user.
   */
  setCustomTime(minutes) {
    const min = parseInt(minutes, 10);
    if (isNaN(min) || min <= 0) {
      this.showToast('Invalid Time', 'Please enter a valid number of minutes (1-180).');
      return;
    }

    const clampedMin = Math.min(180, Math.max(1, min));
    this.stopZeroAlarm();
    this.isCompleted = false;
    this.pauseTimer();

    // Update custom input field
    if (this.customMinutesInput) {
      this.customMinutesInput.value = clampedMin;
    }

    // Set durations
    this.durations.pomodoro = clampedMin * 60;
    this.totalDuration = clampedMin * 60;
    this.timeLeft = this.totalDuration;

    // Reset button label to Start
    this.btnToggleLabel.textContent = 'Start';
    this.iconPlay.classList.remove('hidden');
    this.iconPause.classList.add('hidden');

    // Update active state on quick preset pills
    if (this.presetPills) {
      this.presetPills.forEach((pill) => {
        const pillMin = parseInt(pill.getAttribute('data-min'), 10);
        pill.classList.toggle('active', pillMin === clampedMin);
      });
    }

    // Update tab duration label
    const pomodoroDurationSpan = document.querySelector('#tab-pomodoro .tab-duration');
    if (pomodoroDurationSpan) {
      pomodoroDurationSpan.textContent = `${clampedMin}m`;
    }

    this.badgeText.textContent = `Custom (${clampedMin}m)`;
    this.updateDisplay();
    this.playClickSound();
    this.showToast('Timer Set', `Duration set to ${clampedMin} minute${clampedMin > 1 ? 's' : ''}. Click Start when ready!`);
  }

  /**
   * Set and persist background color theme / ambient lighting
   */
  setTheme(themeName, showNotification = true) {
    const validThemes = ['midnight', 'violet', 'cyan', 'emerald', 'sunset', 'crimson'];
    if (!validThemes.includes(themeName)) themeName = 'midnight';

    document.body.setAttribute('data-theme', themeName);
    this.preferences.theme = themeName;

    // Update active swatch button
    if (this.themeSwatches) {
      this.themeSwatches.forEach((swatch) => {
        const t = swatch.getAttribute('data-theme');
        swatch.classList.toggle('active', t === themeName);
      });
    }

    // Update select in settings if open
    if (this.settingTheme) {
      this.settingTheme.value = themeName;
    }

    // Update active theme badge pill
    if (this.activeThemePill) {
      const capName = themeName.charAt(0).toUpperCase() + themeName.slice(1);
      this.activeThemePill.textContent = `Active: ${capName}`;
    }

    this.savePreferences();

    if (showNotification) {
      const themeLabels = {
        midnight: 'Midnight Slate 🌌',
        violet: 'Cosmic Violet 🔮',
        cyan: 'Electric Ocean 🌊',
        emerald: 'Zen Forest 🌿',
        sunset: 'Golden Sunset 🌅',
        crimson: 'Ruby Rose 🌹'
      };
      this.showToast('Background Light', `Atmosphere changed to ${themeLabels[themeName] || themeName}!`);
      this.playClickSound();
    }
  }

  /**
   * Quick cycle to next ambient background theme
   */
  cycleTheme() {
    const themes = ['midnight', 'violet', 'cyan', 'emerald', 'sunset', 'crimson'];
    const currentIndex = themes.indexOf(this.preferences.theme || 'midnight');
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex], true);
  }

  /* -------------------------------------------------------------
     Event Listeners
  ------------------------------------------------------------- */
  bindEvents() {
    // Primary Controls
    this.btnToggle.addEventListener('click', () => this.toggleTimer());
    this.btnReset.addEventListener('click', () => this.resetTimer());
    this.btnSkip.addEventListener('click', () => this.skipSession());

    // Sound Header Buttons
    this.btnSoundToggle.addEventListener('click', () => this.toggleSound());
    this.btnTestSound.addEventListener('click', () => this.testSelectedMusic());

    // Quick Theme Switcher Button in Header
    if (this.btnThemeQuick) {
      this.btnThemeQuick.addEventListener('click', () => this.cycleTheme());
    }

    // Theme Swatch Buttons
    if (this.themeSwatches) {
      this.themeSwatches.forEach((swatch) => {
        swatch.addEventListener('click', () => {
          const theme = swatch.getAttribute('data-theme');
          this.setTheme(theme, true);
        });
      });
    }

    // Music Cards Click & Preview Buttons
    if (this.musicCards) {
      this.musicCards.forEach((card) => {
        card.addEventListener('click', (e) => {
          // If clicked preview button, handle separately
          if (e.target.closest('.music-card-preview-btn')) return;
          const music = card.getAttribute('data-music');
          this.selectMusic(music, true);
        });
      });
    }

    if (this.musicPreviewBtns) {
      this.musicPreviewBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const music = btn.getAttribute('data-preview');
          this.previewMusic(music);
        });
      });
    }

    // Fallback select change
    if (this.settingChimeStyle) {
      this.settingChimeStyle.addEventListener('change', () => {
        this.selectMusic(this.settingChimeStyle.value, true);
      });
    }

    // Volume Slider Live Feedback
    if (this.settingVolume) {
      this.settingVolume.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (this.settingVolumeLabel) {
          this.settingVolumeLabel.textContent = `${val}%`;
        }
        this.preferences.volume = Math.max(0.05, Math.min(1, val / 100));
      });
    }

    // Custom Duration Input & Set Button
    if (this.btnSetCustomTime && this.customMinutesInput) {
      this.btnSetCustomTime.addEventListener('click', () => {
        this.setCustomTime(this.customMinutesInput.value);
      });

      this.customMinutesInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.setCustomTime(this.customMinutesInput.value);
        }
      });
    }

    // Quick Preset Chips (1m, 5m, 15m, 25m, 45m, 60m)
    if (this.presetPills) {
      this.presetPills.forEach((pill) => {
        pill.addEventListener('click', () => {
          const min = pill.getAttribute('data-min');
          this.setCustomTime(min);
        });
      });
    }

    // Mode Tabs
    this.tabButtons.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        const mode = e.currentTarget.getAttribute('data-mode');
        this.switchMode(mode);
      });
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      // Don't trigger when user is in input field
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        this.toggleTimer();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        this.resetTimer();
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        this.skipSession();
      }
    });

    // Settings Modal Open, Close, & Back
    this.btnSettingsOpen.addEventListener('click', () => this.openSettings());
    this.btnSettingsClose.addEventListener('click', () => this.closeSettings());
    if (this.btnSettingsBack) {
      this.btnSettingsBack.addEventListener('click', () => this.closeSettings());
    }
    if (this.btnSettingsFooterBack) {
      this.btnSettingsFooterBack.addEventListener('click', () => this.closeSettings());
    }
    this.settingsModal.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) this.closeSettings();
    });
    this.btnSettingsSave.addEventListener('click', () => this.saveSettings());
    this.btnSettingsReset.addEventListener('click', () => this.resetSettingsToDefault());

    // Toast Dismiss
    this.btnToastDismiss.addEventListener('click', () => this.hideToast());

    // Request Notification permission on first Start click if supported
    if ('Notification' in window && Notification.permission === 'default') {
      window.addEventListener('click', () => {
        try { Notification.requestPermission(); } catch {}
      }, { once: true });
    }
  }

  /* -------------------------------------------------------------
     Timer Engine & Drift-Free Countdown
  ------------------------------------------------------------- */
  toggleTimer() {
    this.playClickSound();
    if (this.isRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  }

  startTimer() {
    if (this.isRunning) return;

    // If timer was finished at 00:00, reload current set duration
    if (this.timeLeft <= 0) {
      this.timeLeft = this.totalDuration;
      this.stopZeroAlarm();
    }

    this.isCompleted = false;
    this.isRunning = true;
    this.endTime = Date.now() + this.timeLeft * 1000;

    this.btnToggle.classList.add('is-running');
    this.btnToggleLabel.textContent = 'Pause';
    this.iconPlay.classList.add('hidden');
    this.iconPause.classList.remove('hidden');

    this.tick(); // Immediate tick
    this.timerInterval = setInterval(() => this.tick(), 250); // High frequency check for perfect accuracy
  }

  pauseTimer() {
    if (!this.isRunning) return;

    this.isRunning = false;
    clearInterval(this.timerInterval);
    this.timerInterval = null;

    this.btnToggle.classList.remove('is-running');
    this.btnToggleLabel.textContent = 'Start';
    this.iconPlay.classList.remove('hidden');
    this.iconPause.classList.add('hidden');

    this.updateDisplay();
  }

  resetTimer() {
    this.playClickSound();
    this.stopZeroAlarm();
    this.isCompleted = false;
    this.pauseTimer();
    this.timeLeft = this.totalDuration;

    this.btnToggleLabel.textContent = 'Start';
    this.iconPlay.classList.remove('hidden');
    this.iconPause.classList.add('hidden');

    this.updateDisplay();
    this.showToast('Timer Reset', 'Timer reset back to your set time.');
  }

  tick() {
    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((this.endTime - now) / 1000));
    this.timeLeft = remaining;

    this.updateDisplay();

    if (this.timeLeft <= 0) {
      this.onTimerComplete();
    }
  }

  onTimerComplete() {
    // 1. Immediately STOP the countdown
    this.isRunning = false;
    clearInterval(this.timerInterval);
    this.timerInterval = null;

    this.timeLeft = 0;
    this.isCompleted = true;

    // 2. Change Start button to Restart so user can restart whenever they want
    this.btnToggle.classList.remove('is-running');
    this.btnToggleLabel.textContent = 'Restart';
    this.iconPlay.classList.remove('hidden');
    this.iconPause.classList.add('hidden');

    // 3. Update display to 00:00
    this.updateDisplay();

    // 4. Play end music
    this.playZeroAlarm();

    // 5. Trigger notification
    const isFocus = this.currentMode === 'pomodoro';
    const title = isFocus ? 'Time Is Up! 🎯' : 'Break Is Up! ⚡';
    const message = 'Countdown completed and stopped. Click Restart or set another custom duration.';

    this.showToast(title, message);
    this.sendDesktopNotification(title, message);

    // 6. Update session stats
    if (isFocus) {
      this.stats.completedSessions += 1;
      this.stats.totalFocusMinutes += Math.round(this.totalDuration / 60);
      this.stats.streak += 1;
      this.saveStats();
      this.updateStatsUI();
      if (this.stats.cycleCount >= 4) {
        this.stats.cycleCount = 1;
      } else {
        this.stats.cycleCount += 1;
      }
      this.updateCycleDots();
    }

    // CRITICAL: The timer STOPS here! It will NOT automatically switch modes or auto-start.
    // It remains stopped at 00:00 until the user sets another time or clicks Restart/Start.
  }

  skipSession() {
    this.playClickSound();
    this.stopZeroAlarm();
    const isFocus = this.currentMode === 'pomodoro';
    if (isFocus) {
      this.switchMode('shortBreak');
    } else {
      this.switchMode('pomodoro');
    }
  }

  switchMode(mode) {
    if (!this.durations[mode]) return;
    this.stopZeroAlarm();
    this.isCompleted = false;
    this.pauseTimer();

    this.currentMode = mode;
    this.totalDuration = this.durations[mode];
    this.timeLeft = this.totalDuration;

    this.btnToggleLabel.textContent = 'Start';
    this.iconPlay.classList.remove('hidden');
    this.iconPause.classList.add('hidden');

    this.updateModeStyles();
    this.updateDisplay();
    this.updateCycleDots();
  }

  /* -------------------------------------------------------------
     UI Render & Display Updates
  ------------------------------------------------------------- */
  updateDisplay() {
    const safeTime = Math.max(0, this.timeLeft);
    const minutes = Math.floor(safeTime / 60);
    const seconds = safeTime % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    this.timerDisplay.textContent = formatted;

    // Update document title
    const modeLabel = this.isCompleted ? 'Time Up!' : (this.currentMode === 'pomodoro' ? 'Focus' : 'Break');
    if (this.isRunning || this.isCompleted) {
      document.title = `(${formatted}) ${modeLabel} — ZenFocus.time`;
    } else {
      document.title = 'ZenFocus.time - Minimalist Focus & Productivity Timer';
    }

    // Circular SVG Progress Ring
    if (this.progressCircle) {
      const progressRatio = this.totalDuration > 0 ? (this.totalDuration - safeTime) / this.totalDuration : 0;
      const offset = this.CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, progressRatio)));
      this.progressCircle.style.strokeDashoffset = `${offset}`;
    }
  }

  updateModeStyles() {
    // 1. Update Tabs & Glider position
    this.tabButtons.forEach((tab, index) => {
      const tabMode = tab.getAttribute('data-mode');
      const isActive = tabMode === this.currentMode;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');

      if (isActive && this.tabGlider) {
        this.tabGlider.style.transform = `translateX(${index * 100}%)`;
      }
    });

    // 2. Set theme colors & gradients on root
    const root = document.documentElement;
    if (this.currentMode === 'pomodoro') {
      root.style.setProperty('--theme-gradient', 'var(--focus-gradient)');
      root.style.setProperty('--theme-glow', 'var(--focus-glow)');
      root.style.setProperty('--theme-primary', '#ff6b6b');
      this.badgeText.textContent = 'Focus Session';
      if (this.progressCircle) {
        this.progressCircle.style.stroke = 'url(#ring-gradient-focus)';
      }
    } else if (this.currentMode === 'shortBreak') {
      root.style.setProperty('--theme-gradient', 'var(--shortBreak-gradient)');
      root.style.setProperty('--theme-glow', 'var(--shortBreak-glow)');
      root.style.setProperty('--theme-primary', '#00f2fe');
      this.badgeText.textContent = 'Short Break';
      if (this.progressCircle) {
        this.progressCircle.style.stroke = 'url(#ring-gradient-shortBreak)';
      }
    } else if (this.currentMode === 'longBreak') {
      root.style.setProperty('--theme-gradient', 'var(--longBreak-gradient)');
      root.style.setProperty('--theme-glow', 'var(--longBreak-glow)');
      root.style.setProperty('--theme-primary', '#43e97b');
      this.badgeText.textContent = 'Long Break';
      if (this.progressCircle) {
        this.progressCircle.style.stroke = 'url(#ring-gradient-longBreak)';
      }
    }
  }

  updateCycleDots() {
    const dots = this.cycleDots.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index < this.stats.cycleCount);
    });
    this.cycleText.textContent = `Session ${this.stats.cycleCount} of 4`;
  }

  updateStatsUI() {
    this.statCompleted.textContent = this.stats.completedSessions;
    this.statFocusTime.textContent = `${this.stats.totalFocusMinutes}m`;
    this.statStreak.textContent = this.stats.streak;
  }

  /* -------------------------------------------------------------
     Sound, Preferences & Toast
  ------------------------------------------------------------- */
  toggleSound() {
    this.preferences.soundEnabled = !this.preferences.soundEnabled;
    this.updateSoundIcons();
    this.savePreferences();

    const status = this.preferences.soundEnabled ? 'Sound enabled 🔔' : 'Sound muted 🔕';
    this.showToast('Audio Notification', status);
  }

  updateSoundIcons() {
    if (this.preferences.soundEnabled) {
      this.soundIconOn.classList.remove('hidden');
      this.soundIconOff.classList.add('hidden');
      this.btnSoundToggle.title = 'Sound is ON (Click to mute)';
    } else {
      this.soundIconOn.classList.add('hidden');
      this.soundIconOff.classList.remove('hidden');
      this.btnSoundToggle.title = 'Sound is OFF (Click to unmute)';
    }
  }

  showToast(title, message) {
    this.toastTitle.textContent = title;
    this.toastMessage.textContent = message;
    this.toastNotification.classList.remove('hidden');

    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.hideToast(), 4500);
  }

  hideToast() {
    this.toastNotification.classList.add('hidden');
    this.stopZeroAlarm();
  }

  sendDesktopNotification(title, message) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ff6348"><circle cx="12" cy="12" r="10"/></svg>',
        });
      } catch {
        // Ignore notification constructor errors
      }
    }
  }

  /* -------------------------------------------------------------
     Settings Management
  ------------------------------------------------------------- */
  openSettings() {
    this.playClickSound();
    this.inputPomodoro.value = Math.round(this.durations.pomodoro / 60);
    this.inputShortBreak.value = Math.round(this.durations.shortBreak / 60);
    this.inputLongBreak.value = Math.round(this.durations.longBreak / 60);
    this.settingSoundEnabled.checked = this.preferences.soundEnabled;

    // Sync volume slider and label
    const volPercent = Math.round(this.preferences.volume * 100);
    this.settingVolume.value = volPercent;
    if (this.settingVolumeLabel) {
      this.settingVolumeLabel.textContent = `${volPercent}%`;
    }

    // Sync music cards and indicators
    this.selectMusic(this.preferences.chimeStyle || 'fanfare', false);

    // Sync theme swatches and indicators
    this.setTheme(this.preferences.theme || 'midnight', false);

    this.settingAutoBreak.checked = this.preferences.autoBreak;

    this.settingsModal.classList.remove('hidden');
  }

  closeSettings() {
    this.playClickSound();
    this.settingsModal.classList.add('hidden');
  }

  saveSettings() {
    this.playClickSound();

    const pMinutes = Math.max(1, Math.min(120, parseInt(this.inputPomodoro.value, 10) || 25));
    const sMinutes = Math.max(1, Math.min(60, parseInt(this.inputShortBreak.value, 10) || 5));
    const lMinutes = Math.max(1, Math.min(90, parseInt(this.inputLongBreak.value, 10) || 15));

    this.durations.pomodoro = pMinutes * 60;
    this.durations.shortBreak = sMinutes * 60;
    this.durations.longBreak = lMinutes * 60;

    // Update tab duration labels
    document.querySelector('#tab-pomodoro .tab-duration').textContent = `${pMinutes}m`;
    document.querySelector('#tab-shortBreak .tab-duration').textContent = `${sMinutes}m`;
    document.querySelector('#tab-longBreak .tab-duration').textContent = `${lMinutes}m`;

    this.preferences.soundEnabled = this.settingSoundEnabled.checked;
    this.preferences.volume = Math.max(0.05, Math.min(1, parseInt(this.settingVolume.value, 10) / 100));
    this.preferences.autoBreak = this.settingAutoBreak.checked;

    // Update main header current music pill
    const currentMeta = this.soundMeta[this.preferences.chimeStyle] || { name: 'Victory Fanfare' };
    if (this.currentMusicPill) {
      this.currentMusicPill.textContent = currentMeta.name;
    }

    this.updateSoundIcons();
    this.savePreferences();

    // If timer was not running, update current mode's duration immediately
    if (!this.isRunning) {
      this.totalDuration = this.durations[this.currentMode];
      this.timeLeft = this.totalDuration;
      this.updateDisplay();
    }

    this.closeSettings();
    this.showToast('Settings Saved', 'Timer preferences, music, and background light updated! ✨');
    this.playMusic(this.preferences.chimeStyle);
  }

  resetSettingsToDefault() {
    this.playClickSound();
    this.inputPomodoro.value = 25;
    this.inputShortBreak.value = 5;
    this.inputLongBreak.value = 15;
    this.settingSoundEnabled.checked = true;
    this.settingVolume.value = 85;
    if (this.settingVolumeLabel) {
      this.settingVolumeLabel.textContent = '85%';
    }
    this.settingAutoBreak.checked = false;

    this.selectMusic('fanfare', false);
    this.setTheme('midnight', false);
    this.showToast('Defaults Restored', 'Settings reset to factory defaults.');
  }

  /* -------------------------------------------------------------
     LocalStorage Persistence
  ------------------------------------------------------------- */
  loadState() {
    try {
      const savedStats = localStorage.getItem('zenfocus_stats');
      if (savedStats) {
        this.stats = { ...this.stats, ...JSON.parse(savedStats) };
        this.updateStatsUI();
        this.updateCycleDots();
      }

      const savedPrefs = localStorage.getItem('zenfocus_prefs');
      if (savedPrefs) {
        this.preferences = { ...this.preferences, ...JSON.parse(savedPrefs) };
      }

      // Apply saved theme
      if (this.preferences.theme) {
        this.setTheme(this.preferences.theme, false);
      }

      // Apply saved music selection
      this.selectMusic(this.preferences.chimeStyle || 'fanfare', false);

      const savedDurations = localStorage.getItem('zenfocus_durations');
      if (savedDurations) {
        this.durations = { ...this.durations, ...JSON.parse(savedDurations) };
        document.querySelector('#tab-pomodoro .tab-duration').textContent = `${Math.round(this.durations.pomodoro / 60)}m`;
        document.querySelector('#tab-shortBreak .tab-duration').textContent = `${Math.round(this.durations.shortBreak / 60)}m`;
        document.querySelector('#tab-longBreak .tab-duration').textContent = `${Math.round(this.durations.longBreak / 60)}m`;
      }
    } catch {
      // LocalStorage access failover
    }

    this.totalDuration = this.durations[this.currentMode];
    this.timeLeft = this.totalDuration;
    this.updateSoundIcons();
  }

  saveStats() {
    try {
      localStorage.setItem('zenfocus_stats', JSON.stringify(this.stats));
    } catch {}
  }

  savePreferences() {
    try {
      localStorage.setItem('zenfocus_prefs', JSON.stringify(this.preferences));
      localStorage.setItem('zenfocus_durations', JSON.stringify(this.durations));
    } catch {}
  }
}

// Instantiate on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  window.zenFocus = new PomodoroTimer();
});
